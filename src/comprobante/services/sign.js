import * as forge from 'node-forge';
import { readFileSync } from 'fs';
import * as https from 'node:https';
import * as crypto from 'crypto';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const httpsAgent = new https.Agent({
  family: 4,
});

export async function getP12FromUrl(url, httpsAgent) {
  try {
    const response = await fetch(url, { agent: httpsAgent });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

export function getP12FromLocalFile(path) {
  const file = readFileSync(path);
  const buffer = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  );
  return buffer;
}

// ============================================
// Funciones de canonicalización C14N
// ============================================

const CommentNodeIdentifier = '#comment';

function processAttributeValue(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/\t/g, '&#x9;')
    .replace(/\n/g, '&#xA;')
    .replace(/\r/g, '&#xD;');
}

function processTagValue(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r/g, '&#xD;');
}

function parseXml(xml) {
  const parserOptions = {
    commentPropName: '#comment',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: false,
    preserveOrder: true,
    trimValues: false,
    processEntities: false,
    ignorePiTags: true,
    attributeValueProcessor: (name, value) => processAttributeValue(value),
    tagValueProcessor: (name, value) => processTagValue(value)
  };
  const parser = new XMLParser(parserOptions);
  return parser.parse(xml);
}

function buildXml(data) {
  const builderOptions = {
    ignoreAttributes: false,
    preserveOrder: true,
    processEntities: false,
    suppressEmptyNode: false
  };
  const builder = new XMLBuilder(builderOptions);
  return builder.build(data);
}

function attributeCompare(a, b) {
  if (!a.namespaceURI && b.namespaceURI) return -1;
  if (!b.namespaceURI && a.namespaceURI) return 1;
  const left = (a.namespaceURI || '') + a.name;
  const right = (b.namespaceURI || '') + b.name;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function namespaceCompare(a, b) {
  if (!a.prefix) return -1;
  if (!b.prefix) return 1;
  if (a.prefix === b.prefix) return 0;
  return a.prefix < b.prefix ? -1 : 1;
}

function parseAttributesAndNamespaces(data) {
  const attributes = [];
  const attributesWithPendingNamespace = [];
  const namespacesByPrefix = {};

  for (const rawKey of Object.keys(data)) {
    const key = rawKey.substring(2);
    const splittedKey = key.split(':');
    const isNamespace = splittedKey[0] === 'xmlns';
    const isAttribute = !isNamespace;
    const isAttributeWithNamespace = isAttribute && splittedKey.length === 2;

    if (isNamespace) {
      const prefix = splittedKey[1];
      namespacesByPrefix[prefix] = { prefix, uri: data[rawKey] };
    }

    if (isAttribute) {
      if (isAttributeWithNamespace) {
        const prefix = splittedKey[0];
        const namespaceURI = namespacesByPrefix[prefix]?.uri;
        if (namespaceURI === undefined) {
          attributesWithPendingNamespace.push({
            name: splittedKey[1],
            namespaceURI,
            namespacePrefix: prefix,
            value: data[rawKey]
          });
        } else {
          attributes.push({
            name: splittedKey[1],
            namespacePrefix: prefix,
            namespaceURI,
            value: data[rawKey]
          });
        }
      } else {
        attributes.push({
          name: splittedKey[0],
          namespacePrefix: undefined,
          namespaceURI: undefined,
          value: data[rawKey]
        });
      }
    }
  }

  const solvedAttributesWithPendingNamespace = attributesWithPendingNamespace.map((attr) => ({
    ...attr,
    namespaceURI: namespacesByPrefix[attr.namespacePrefix ?? '']?.uri,
    value: attr.value
  }));

  return {
    attributes: [...attributes, ...solvedAttributesWithPendingNamespace],
    namespaces: Object.values(namespacesByPrefix)
  };
}

function insertAttributesAndNamespaces(node, attributes, namespaces) {
  const toInsert = {};
  namespaces.forEach((namespace) => {
    toInsert[`@_xmlns${namespace.prefix ? `:${namespace.prefix}` : ''}`] = namespace.uri;
  });
  attributes.forEach((attr) => {
    toInsert[`@_${attr.namespacePrefix ? `${attr.namespacePrefix}:${attr.name}` : attr.name}`] = attr.value;
  });
  node[':@'] = toInsert;
}

function mergeLocalAndInheritedNamespaces(local, inherited) {
  const acceptedInherited = inherited.filter(
    (inheritedNamespace) => !local.some((localNamespace) => localNamespace.prefix === inheritedNamespace.prefix)
  );
  return [...acceptedInherited, ...local];
}

function processNode(node, alreadyDeclaredNamespaces, inheritedNamespaces) {
  const reservedKeywords = new Set([':@', '#text', CommentNodeIdentifier]);
  let { attributes, namespaces } = parseAttributesAndNamespaces(node[':@'] ?? {});

  if (inheritedNamespaces) {
    namespaces = mergeLocalAndInheritedNamespaces(namespaces, inheritedNamespaces);
  }

  namespaces.sort(namespaceCompare);
  attributes.sort(attributeCompare);

  const tagName = Object.keys(node).find((key) => !reservedKeywords.has(key));
  const children = node[tagName] ?? [];

  insertAttributesAndNamespaces(node, attributes, namespaces);

  let i = 0;
  while (i < children.length) {
    const child = children[i];
    if (child[CommentNodeIdentifier]) {
      children.splice(i, 1);
      continue;
    }
    processNode(child, namespaces);
    i++;
  }

  return { namespaces: [...alreadyDeclaredNamespaces, ...namespaces] };
}

function processObj(obj, inheritedNamespaces) {
  let i = 0;
  while (i < obj.length) {
    const node = obj[i];
    if (node[CommentNodeIdentifier]) {
      obj.splice(i, 1);
      continue;
    }
    processNode(node, [], inheritedNamespaces);
    i++;
  }
}

function c14nCanonicalize(xml, options) {
  const obj = parseXml(xml);
  processObj(obj, options?.inheritedNamespaces);
  return buildXml(obj);
}

// ============================================
// Funciones auxiliares comunes
// ============================================

function sha1_base64(txt, encoding) {
  const md = forge.md.sha1.create();
  md.update(txt, encoding);
  const HASH = md.digest().toHex();
  const BUFFER = Buffer.from(HASH, 'hex');
  return BUFFER.toString('base64');
}

function getHashSha1(data) {
  return forge.util.encode64(forge.sha1.create().update(data, 'utf8').digest().bytes());
}

function signData(data, privateKey) {
  return forge.util.encode64(privateKey.sign(forge.sha1.create().update(data, 'utf8')));
}

function hexToBase64(hexStr) {
  hexStr = hexStr.padStart(hexStr.length + (hexStr.length % 2), '0');
  const BYTES = hexStr.match(/.{2}/g).map((byte) => parseInt(byte, 16));
  return btoa(String.fromCharCode(...BYTES));
}

function bigIntToBase64(bigint) {
  const HEXSTRING = bigint.toString(16);
  const HEXPAIRS = HEXSTRING.match(/\w{2}/g);
  const BYTES = HEXPAIRS.map((pair) => parseInt(pair, 16));
  const BYTESTRING = String.fromCharCode(...BYTES);
  const BASE64 = btoa(BYTESTRING);
  return BASE64.match(/.{1,76}/g).join('\n');
}

function getRandomNumber(min = 990, max = 9999) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateUUID() {
  return crypto.randomUUID();
}

function normalizeXml(xml) {
  return xml
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(?<=>)(\r?\n)|(\r?\n)(?=<\/)/g, '')
    .trim()
    .replace(/(?<=>)(\s*)/g, '');
}

function extractP12Data(arrayBuffer, password) {
  const arrayUint8 = new Uint8Array(arrayBuffer);
  const der = forge.util.decode64(forge.util.binary.base64.encode(arrayUint8));
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

  const pkcs8Bags = p12.getBags({
    bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
  });

  const certBags = p12.getBags({
    bagType: forge.pki.oids.certBag,
  });

  const certBag = certBags[forge.oids.certBag];
  const friendlyName = certBag[1]?.attributes?.friendlyName?.[0] || '';

  const cert = certBag.reduce((prev, curr) => {
    return curr.cert.extensions.length > prev.cert.extensions.length ?
      curr :
      prev;
  });

  const issuerAttrs = cert.cert.issuer.attributes;

  return {
    p12,
    pkcs8Bags,
    certBag,
    cert,
    friendlyName,
    issuerAttrs,
    certificate: cert.cert,
  };
}

function detectProvider(friendlyName, issuerAttrs) {
  if (/BANCO CENTRAL/i.test(friendlyName)) {
    return 'BANCO_CENTRAL';
  }
  if (/SECURITY DATA/i.test(friendlyName)) {
    return 'SECURITY_DATA';
  }

  const issuerString = issuerAttrs.map(attr => attr.value).join(' ');
  if (/UANATACA/i.test(issuerString)) {
    return 'UANATACA';
  }

  return 'SECURITY_DATA';
}

function validateCertificate(certificate) {
  const notBefore = certificate.validity['notBefore'];
  const notAfter = certificate.validity['notAfter'];
  const currentDate = new Date();

  if (currentDate < notBefore || currentDate > notAfter) {
    throw new Error('Invalid certificate, certificate has expired');
  }

  return currentDate;
}

function prepareCertificateData(certificate, key) {
  const certificateX509_pem = forge.pki.certificateToPem(certificate);

  let certificateX509 = certificateX509_pem.substring(
    certificateX509_pem.indexOf('\n') + 1,
    certificateX509_pem.indexOf('\n-----END CERTIFICATE-----'),
  );

  certificateX509 = certificateX509
    .replace(/\r?\n|\r/g, '')
    .replace(/([^\0]{76})/g, '$1\n');

  const certificateX509_asn1 = forge.pki.certificateToAsn1(certificate);
  const certificateX509_der = forge.asn1.toDer(certificateX509_asn1).getBytes();
  const certificateX509_serialNumber = BigInt('0x' + certificate.serialNumber).toString();

  const exponent = hexToBase64(key.e.data[0].toString(16));
  const modules = bigIntToBase64(key.n);

  return {
    certificateX509,
    certificateX509_der,
    certificateX509_serialNumber,
    exponent,
    modules,
  };
}

// ============================================
// Lógica de firma para Security Data / Banco Central
// ============================================

function _signStandard(xml, p12Data, provider) {
  const { pkcs8Bags, issuerAttrs, certificate } = p12Data;

  let pkcs8;

  if (provider === 'BANCO_CENTRAL') {
    const keys = pkcs8Bags[forge.oids.pkcs8ShroudedKeyBag];
    for (let i = 0; i < keys.length; i++) {
      const element = keys[i];
      const friendlyName = element.attributes.friendlyName[0];
      if (/Signing Key/i.test(friendlyName)) {
        pkcs8 = pkcs8Bags[forge.oids.pkcs8ShroudedKeyBag][i];
      }
    }
  } else {
    pkcs8 = pkcs8Bags[forge.oids.pkcs8ShroudedKeyBag][0];
  }

  const currentDate = validateCertificate(certificate);
  const key = pkcs8.key ?? pkcs8.asn1;

  const issuerName = [...issuerAttrs]
    .reverse()
    .map((attr) => `${attr.shortName}=${attr.value}`)
    .join(', ');

  const certData = prepareCertificateData(certificate, key);
  const hash_certificateX509_der = sha1_base64(certData.certificateX509_der);

  xml = xml.replace(/\t|\r/g, '');

  const sha1_xml = sha1_base64(
    xml.replace(/<\?xml[^?]*\?>/i, ''),
    'utf8',
  );

  const namespaces =
    'xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"';

  const Certificate_number = getRandomNumber();
  const Signature_number = getRandomNumber();
  const SignedProperties_number = getRandomNumber();
  const SignedInfo_number = getRandomNumber();
  const SignedPropertiesID_number = getRandomNumber();
  const Reference_ID_number = getRandomNumber();
  const SignatureValue_number = getRandomNumber();
  const Object_number = getRandomNumber();

  const isoDateTime = currentDate.toISOString().slice(0, 19);

  let SignedProperties = '';
  SignedProperties +=
    '<etsi:SignedProperties Id="Signature' +
    Signature_number +
    '-SignedProperties' +
    SignedProperties_number +
    '">';
  SignedProperties += '<etsi:SignedSignatureProperties>';
  SignedProperties += '<etsi:SigningTime>';
  SignedProperties += isoDateTime;
  SignedProperties += '</etsi:SigningTime>';
  SignedProperties += '<etsi:SigningCertificate>';
  SignedProperties += '<etsi:Cert>';
  SignedProperties += '<etsi:CertDigest>';
  SignedProperties +=
    '<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
  SignedProperties += '</ds:DigestMethod>';
  SignedProperties += '<ds:DigestValue>';
  SignedProperties += hash_certificateX509_der;
  SignedProperties += '</ds:DigestValue>';
  SignedProperties += '</etsi:CertDigest>';
  SignedProperties += '<etsi:IssuerSerial>';
  SignedProperties += '<ds:X509IssuerName>';
  SignedProperties += issuerName;
  SignedProperties += '</ds:X509IssuerName>';
  SignedProperties += '<ds:X509SerialNumber>';
  SignedProperties += certData.certificateX509_serialNumber;
  SignedProperties += '</ds:X509SerialNumber>';
  SignedProperties += '</etsi:IssuerSerial>';
  SignedProperties += '</etsi:Cert>';
  SignedProperties += '</etsi:SigningCertificate>';
  SignedProperties += '</etsi:SignedSignatureProperties>';

  SignedProperties += '<etsi:SignedDataObjectProperties>';
  SignedProperties +=
    '<etsi:DataObjectFormat ObjectReference="#Reference-ID-' +
    Reference_ID_number +
    '">';
  SignedProperties += '<etsi:Description>';
  SignedProperties += 'contenido comprobante';
  SignedProperties += '</etsi:Description>';
  SignedProperties += '<etsi:MimeType>';
  SignedProperties += 'text/xml';
  SignedProperties += '</etsi:MimeType>';
  SignedProperties += '</etsi:DataObjectFormat>';
  SignedProperties += '</etsi:SignedDataObjectProperties>';
  SignedProperties += '</etsi:SignedProperties>';

  const sha1_SignedProperties = sha1_base64(
    SignedProperties.replace(
      '<etsi:SignedProperties',
      '<etsi:SignedProperties ' + namespaces,
    ),
  );

  let KeyInfo = '';
  KeyInfo += '<ds:KeyInfo Id="Certificate' + Certificate_number + '">';
  KeyInfo += '\n<ds:X509Data>';
  KeyInfo += '\n<ds:X509Certificate>\n';
  KeyInfo += certData.certificateX509;
  KeyInfo += '\n</ds:X509Certificate>';
  KeyInfo += '\n</ds:X509Data>';
  KeyInfo += '\n<ds:KeyValue>';
  KeyInfo += '\n<ds:RSAKeyValue>';
  KeyInfo += '\n<ds:Modulus>\n';
  KeyInfo += certData.modules;
  KeyInfo += '\n</ds:Modulus>';
  KeyInfo += '\n<ds:Exponent>\n';
  KeyInfo += certData.exponent;
  KeyInfo += '\n</ds:Exponent>';
  KeyInfo += '\n</ds:RSAKeyValue>';
  KeyInfo += '\n</ds:KeyValue>';
  KeyInfo += '\n</ds:KeyInfo>';

  const sha1_KeyInfo = sha1_base64(
    KeyInfo.replace('<ds:KeyInfo', '<ds:KeyInfo ' + namespaces),
  );

  let SignedInfo = '';
  SignedInfo +=
    '<ds:SignedInfo Id="Signature-SignedInfo' + SignedInfo_number + '">';
  SignedInfo +=
    '\n<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315">';
  SignedInfo += '</ds:CanonicalizationMethod>';
  SignedInfo +=
    '\n<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1">';
  SignedInfo += '</ds:SignatureMethod>';
  SignedInfo +=
    '\n<ds:Reference Id="SignedPropertiesID' +
    SignedPropertiesID_number +
    '" Type="http://uri.etsi.org/01903#SignedProperties" URI="#Signature' +
    Signature_number +
    '-SignedProperties' +
    SignedProperties_number +
    '">';
  SignedInfo +=
    '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
  SignedInfo += '</ds:DigestMethod>';
  SignedInfo += '\n<ds:DigestValue>';
  SignedInfo += sha1_SignedProperties;
  SignedInfo += '</ds:DigestValue>';
  SignedInfo += '\n</ds:Reference>';
  SignedInfo += '\n<ds:Reference URI="#Certificate' + Certificate_number + '">';
  SignedInfo +=
    '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
  SignedInfo += '</ds:DigestMethod>';
  SignedInfo += '\n<ds:DigestValue>';
  SignedInfo += sha1_KeyInfo;
  SignedInfo += '</ds:DigestValue>';
  SignedInfo += '\n</ds:Reference>';
  SignedInfo +=
    '\n<ds:Reference Id="Reference-ID-' +
    Reference_ID_number +
    '" URI="#comprobante">';
  SignedInfo += '\n<ds:Transforms>';
  SignedInfo +=
    '\n<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature">';
  SignedInfo += '</ds:Transform>';
  SignedInfo += '\n</ds:Transforms>';
  SignedInfo +=
    '\n<ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1">';
  SignedInfo += '</ds:DigestMethod>';
  SignedInfo += '\n<ds:DigestValue>';
  SignedInfo += sha1_xml;
  SignedInfo += '</ds:DigestValue>';
  SignedInfo += '\n</ds:Reference>';
  SignedInfo += '\n</ds:SignedInfo>';

  const canonicalized_SignedInfo = SignedInfo.replace(
    '<ds:SignedInfo',
    '<ds:SignedInfo ' + namespaces,
  );
  const md = forge.md.sha1.create();
  md.update(canonicalized_SignedInfo, 'utf8');

  const signature = btoa(key.sign(md))
    .match(/.{1,76}/g)
    .join('\n');

  let xades_bes = '';
  xades_bes +=
    '<ds:Signature ' + namespaces + ' Id="Signature' + Signature_number + '">';
  xades_bes += '\n' + SignedInfo;
  xades_bes +=
    '\n<ds:SignatureValue Id="SignatureValue' + SignatureValue_number + '">\n';
  xades_bes += signature;
  xades_bes += '\n</ds:SignatureValue>';
  xades_bes += '\n' + KeyInfo;
  xades_bes +=
    '\n<ds:Object Id="Signature' +
    Signature_number +
    '-Object' +
    Object_number +
    '">';
  xades_bes +=
    '<etsi:QualifyingProperties Target="#Signature' + Signature_number + '">';
  xades_bes += SignedProperties;
  xades_bes += '</etsi:QualifyingProperties>';
  xades_bes += '</ds:Object>';
  xades_bes += '</ds:Signature>';

  return xml.replace(/(<[^<]+)$/, xades_bes + '$1');
}

// ============================================
// Lógica de firma para Uanataca (con C14N real)
// ============================================

function normalizeIssuerAttributeShortName(shortName) {
  if (shortName === 'E') {
    return 'EMAILADDRESS';
  }
  return shortName;
}

function extractIssuerData(certificate) {
  return certificate.issuer.attributes.reverse()
    .filter((attr) => attr.shortName || attr.type)
    .map((attr) => {
      if (attr.shortName) {
        const normalizedShortName = normalizeIssuerAttributeShortName(attr.shortName);
        return `${normalizedShortName}=${attr.value}`;
      } else {
        return `${attr.type}=${attr.value}`;
      }
    })
    .join(',');
}

function extractX509Data(certificate) {
  const serialNumber = new forge.jsbn.BigInteger(
    Array.from(Buffer.from(certificate.serialNumber, 'hex'))
  ).toString();

  const issuerName = extractIssuerData(certificate);

  const certificateAsAsn1 = forge.pki.certificateToAsn1(certificate);
  const contentAsDer = forge.asn1.toDer(certificateAsAsn1);
  const contentHash = forge.util.encode64(
    forge.sha1.create().update(contentAsDer.bytes()).digest().bytes()
  );
  const content = forge.util.encode64(contentAsDer.bytes());

  return {
    content,
    contentHash,
    issuerName,
    serialNumber
  };
}

function extractPrivateKeyData(privateKey) {
  let modulusHex = privateKey.n.toString(16);
  let exponentHex = privateKey.e.toString(16);

  // Pad to even length (required for proper hex-to-bytes conversion)
  if (modulusHex.length % 2 !== 0) modulusHex = '0' + modulusHex;
  if (exponentHex.length % 2 !== 0) exponentHex = '0' + exponentHex;

  const modulus = Buffer.from(modulusHex, 'hex').toString('base64');
  const exponent = Buffer.from(exponentHex, 'hex').toString('base64');
  return { modulus, exponent };
}

function getDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60)).toString().padStart(2, '0');
  const offsetMinutes = Math.abs(offset % 60).toString().padStart(2, '0');
  const sign = offset <= 0 ? '+' : '-';

  return date.toISOString().slice(0, 19) + sign + offsetHours + ':' + offsetMinutes;
}

function _signUanataca(xml, p12Data) {
  const { pkcs8Bags, certificate } = p12Data;

  // Para Uanataca usar la primera clave disponible
  const pkcs8 = pkcs8Bags[forge.oids.pkcs8ShroudedKeyBag][0];
  validateCertificate(certificate);
  const privateKey = pkcs8.key ?? pkcs8.asn1;

  // Extraer datos del certificado
  const { exponent: certificateExponent, modulus: certificateModulus } = extractPrivateKeyData(privateKey);
  const { issuerName: x509IssuerName, serialNumber: x509SerialNumber, content: certificateContent, contentHash: x509Hash } = extractX509Data(certificate);

  const signingTime = getDate();

  // IDs
  const docTagId = 'comprobante';
  const docTagRefId = `DocumentRef-${generateUUID()}`;
  const keyInfoTagId = `Certificate-${generateUUID()}`;
  const keyInfoRefTagId = `CertificateRef-${generateUUID()}`;
  const signedInfoTagId = `SignedInfo-${generateUUID()}`;
  const signedPropertiesRefTagId = `SignedPropertiesRef-${generateUUID()}`;
  const signedPropertiesTagId = `SignedProperties-${generateUUID()}`;
  const signatureTagId = `Signature-${generateUUID()}`;
  const signatureObjectTagId = `SignatureObject-${generateUUID()}`;
  const signatureValueTagId = `SignatureValue-${generateUUID()}`;

  // Namespaces
  const nsDs = 'http://www.w3.org/2000/09/xmldsig#';
  const nsXades = 'http://uri.etsi.org/01903/v1.3.2#';

  // Build KeyInfo tag
  const keyInfoTag = `<ds:KeyInfo Id="${keyInfoTagId}"><ds:X509Data><ds:X509Certificate>${certificateContent}</ds:X509Certificate></ds:X509Data><ds:KeyValue><ds:RSAKeyValue><ds:Modulus>${certificateModulus}</ds:Modulus><ds:Exponent>${certificateExponent}</ds:Exponent></ds:RSAKeyValue></ds:KeyValue></ds:KeyInfo>`;

  // Build SignedProperties tag
  const signedPropertiesTag = `<xades:SignedProperties Id="${signedPropertiesTagId}"><xades:SignedSignatureProperties><xades:SigningTime>${signingTime}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${x509Hash}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName>${x509IssuerName}</ds:X509IssuerName><ds:X509SerialNumber>${x509SerialNumber}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate></xades:SignedSignatureProperties><xades:SignedDataObjectProperties><xades:DataObjectFormat ObjectReference="#${docTagRefId}"><xades:Description>Firma digital</xades:Description><xades:MimeType>text/xml</xades:MimeType><xades:Encoding>UTF-8</xades:Encoding></xades:DataObjectFormat></xades:SignedDataObjectProperties></xades:SignedProperties>`;

  // Calculate hashes with C14N canonicalization
  const docHash = getHashSha1(c14nCanonicalize(xml));
  const signedPropertiesTagHash = getHashSha1(c14nCanonicalize(signedPropertiesTag, {
    inheritedNamespaces: [
      { prefix: 'xades', uri: nsXades },
      { prefix: 'ds', uri: nsDs }
    ]
  }));
  const keyInfoTagHash = getHashSha1(c14nCanonicalize(keyInfoTag, {
    inheritedNamespaces: [
      { prefix: 'ds', uri: nsDs }
    ]
  }));

  // Build SignedInfo tag
  const signedInfoTag = `<ds:SignedInfo Id="${signedInfoTagId}"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><ds:Reference Id="${docTagRefId}" URI="#${docTagId}"><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${docHash}</ds:DigestValue></ds:Reference><ds:Reference Id="${signedPropertiesRefTagId}" Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropertiesTagId}"><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${signedPropertiesTagHash}</ds:DigestValue></ds:Reference><ds:Reference Id="${keyInfoRefTagId}" URI="#${keyInfoTagId}"><ds:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><ds:DigestValue>${keyInfoTagHash}</ds:DigestValue></ds:Reference></ds:SignedInfo>`;

  // Sign the SignedInfo
  const signedSignedInfoTag = signData(c14nCanonicalize(signedInfoTag, {
    inheritedNamespaces: [
      { prefix: 'ds', uri: nsDs }
    ]
  }), privateKey);

  // Build final Signature tag
  const signatureTag = `<ds:Signature xmlns:ds="${nsDs}" Id="${signatureTagId}">${signedInfoTag}<ds:SignatureValue Id="${signatureValueTagId}">${signedSignedInfoTag}</ds:SignatureValue>${keyInfoTag}<ds:Object Id="${signatureObjectTagId}"><xades:QualifyingProperties xmlns:xades="${nsXades}" Target="#${signatureTagId}">${signedPropertiesTag}</xades:QualifyingProperties></ds:Object></ds:Signature>`;

  // Insert signature before closing tag
  const rootTagMatch = xml.match(/<\/([a-zA-Z]+)>\s*$/);
  if (rootTagMatch) {
    const closingTag = rootTagMatch[0];
    return xml.replace(closingTag, `${signatureTag}${closingTag}`);
  }

  return xml.replace(/(<[^<]+)$/, signatureTag + '$1');
}

// ============================================
// Función principal con detección automática
// ============================================

async function sign(p12Path, p12Password, xmlIn) {
  const arrayBuffer = await getP12FromUrl(p12Path);
  let xml = normalizeXml(xmlIn);

  // Extraer datos del certificado P12
  const p12Data = extractP12Data(arrayBuffer, p12Password);

  // Detectar proveedor automáticamente
  const provider = detectProvider(p12Data.friendlyName, p12Data.issuerAttrs);

  // Redirigir a la función de firma correspondiente
  if (provider === 'UANATACA') {
    return _signUanataca(xml, p12Data);
  }

  // Para BANCO_CENTRAL y SECURITY_DATA usar la firma estándar
  return _signStandard(xml, p12Data, provider);
}

// Función específica para Uanataca (exportada por compatibilidad)
async function signUanataca(p12Path, p12Password, xmlIn) {
  const arrayBuffer = await getP12FromUrl(p12Path);
  let xml = normalizeXml(xmlIn);
  const p12Data = extractP12Data(arrayBuffer, p12Password);
  return _signUanataca(xml, p12Data);
}

export { sign, signUanataca };
