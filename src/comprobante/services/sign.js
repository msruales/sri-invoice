import * as forge from 'node-forge';
import { readFileSync } from 'fs';
import * as https from 'node:https';
import * as crypto from 'crypto';

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
// Funciones auxiliares comunes
// ============================================

function sha1_base64(txt, encoding) {
  const md = forge.md.sha1.create();
  md.update(txt, encoding);
  const HASH = md.digest().toHex();
  const BUFFER = Buffer.from(HASH, 'hex');
  return BUFFER.toString('base64');
}

function sha256_base64(txt, encoding) {
  const md = forge.md.sha256.create();
  md.update(txt, encoding);
  const HASH = md.digest().toHex();
  const BUFFER = Buffer.from(HASH, 'hex');
  return BUFFER.toString('base64');
}

function generateUUID() {
  return crypto.randomUUID();
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
  // Detectar por friendlyName
  if (/BANCO CENTRAL/i.test(friendlyName)) {
    return 'BANCO_CENTRAL';
  }
  if (/SECURITY DATA/i.test(friendlyName)) {
    return 'SECURITY_DATA';
  }

  // Detectar por issuerName (para Uanataca)
  const issuerString = issuerAttrs.map(attr => attr.value).join(' ');
  if (/UANATACA/i.test(issuerString)) {
    return 'UANATACA';
  }

  // Default: intentar con Security Data (comportamiento más común)
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
  const { pkcs8Bags, cert, issuerAttrs, certificate } = p12Data;

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
    // SECURITY_DATA
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
// Lógica de firma para Uanataca
// ============================================

// Decodifica valores hexadecimales ASN.1 (como el OID 2.5.4.97 de Uanataca)
function decodeAsn1Value(value) {
  if (typeof value !== 'string') return value;

  // Si el valor comienza con #, está en formato hexadecimal ASN.1
  if (value.startsWith('#')) {
    try {
      const hex = value.substring(1);
      // El formato es: tag (1 byte) + length (1+ bytes) + value
      // Para UTF8String (tag 0x0c), extraemos el valor después del tag y length
      const tag = parseInt(hex.substring(0, 2), 16);
      const length = parseInt(hex.substring(2, 4), 16);
      const valueHex = hex.substring(4);

      // Decodificar el valor hexadecimal a string
      let decoded = '';
      for (let i = 0; i < valueHex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(valueHex.substring(i, i + 2), 16));
      }
      return decoded;
    } catch (e) {
      return value;
    }
  }
  return value;
}

function _signUanataca(xml, p12Data) {
  const { pkcs8Bags, cert, issuerAttrs, certificate } = p12Data;

  // Para Uanataca usar la primera clave disponible
  const pkcs8 = pkcs8Bags[forge.oids.pkcs8ShroudedKeyBag][0];

  const currentDate = validateCertificate(certificate);
  const key = pkcs8.key ?? pkcs8.asn1;

  // Formatear issuerName para Uanataca con OID.2.5.4.97
  // Decodificar valores hexadecimales si es necesario
  const issuerName = [...issuerAttrs]
    .reverse()
    .map((attr) => {
      const value = decodeAsn1Value(attr.value);
      if (attr.type === '2.5.4.97') {
        return `OID.2.5.4.97=${value}`;
      }
      return `${attr.shortName}=${value}`;
    })
    .join(', ');

  const certData = prepareCertificateData(certificate, key);
  const hash_certificateX509_der = sha256_base64(certData.certificateX509_der);

  xml = xml.replace(/\t|\r/g, '');

  const sha256_xml = sha256_base64(
    xml.replace(/<\?xml[^?]*\?>/i, ''),
    'utf8',
  );

  // Namespaces separados - como en la firma válida de Uanataca
  const nsDs = 'xmlns:ds="http://www.w3.org/2000/09/xmldsig#"';
  const nsXades = 'xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"';
  const nsBoth = `${nsDs} ${nsXades}`;

  // Generar UUIDs para Uanataca
  const signatureUUID = generateUUID();
  const referenceUUID = generateUUID();
  const objectUUID = generateUUID();
  const qualifyingPropertiesUUID = generateUUID();

  // Fecha con zona horaria para Ecuador (-05:00)
  const tzOffset = -5;
  const tzString = tzOffset < 0 ? `-0${Math.abs(tzOffset)}:00` : `+0${tzOffset}:00`;
  const isoDateTime = currentDate.toISOString().slice(0, 19) + tzString;

  let SignedProperties = '';
  SignedProperties += `<xades:SignedProperties Id="SignedProperties-Signature-${signatureUUID}">`;
  SignedProperties += '<xades:SignedSignatureProperties>';
  SignedProperties += '<xades:SigningTime>';
  SignedProperties += isoDateTime;
  SignedProperties += '</xades:SigningTime>';
  SignedProperties += '<xades:SigningCertificate>';
  SignedProperties += '<xades:Cert>';
  SignedProperties += '<xades:CertDigest>';
  SignedProperties += '<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />';
  SignedProperties += '<ds:DigestValue>';
  SignedProperties += hash_certificateX509_der;
  SignedProperties += '</ds:DigestValue>';
  SignedProperties += '</xades:CertDigest>';
  SignedProperties += '<xades:IssuerSerial>';
  SignedProperties += '<ds:X509IssuerName>';
  SignedProperties += issuerName;
  SignedProperties += '</ds:X509IssuerName>';
  SignedProperties += '<ds:X509SerialNumber>';
  SignedProperties += certData.certificateX509_serialNumber;
  SignedProperties += '</ds:X509SerialNumber>';
  SignedProperties += '</xades:IssuerSerial>';
  SignedProperties += '</xades:Cert>';
  SignedProperties += '</xades:SigningCertificate>';
  SignedProperties += '</xades:SignedSignatureProperties>';

  SignedProperties += '<xades:SignedDataObjectProperties>';
  SignedProperties += `<xades:DataObjectFormat ObjectReference="#Reference-${referenceUUID}">`;
  SignedProperties += '<xades:MimeType>';
  SignedProperties += 'text/xml';
  SignedProperties += '</xades:MimeType>';
  SignedProperties += '<xades:Encoding>';
  SignedProperties += 'UTF-8';
  SignedProperties += '</xades:Encoding>';
  SignedProperties += '</xades:DataObjectFormat>';
  SignedProperties += '</xades:SignedDataObjectProperties>';
  SignedProperties += '</xades:SignedProperties>';

  // Para el hash de SignedProperties, usar ambos namespaces (ds y xades)
  const sha256_SignedProperties = sha256_base64(
    SignedProperties.replace(
      '<xades:SignedProperties',
      `<xades:SignedProperties ${nsBoth}`,
    ),
  );

  let KeyInfo = '';
  KeyInfo += `<ds:KeyInfo Id="KeyInfoId-Signature-${signatureUUID}">`;
  KeyInfo += '<ds:X509Data>';
  KeyInfo += '<ds:X509Certificate>';
  KeyInfo += certData.certificateX509.replace(/\n/g, '');
  KeyInfo += '</ds:X509Certificate>';
  KeyInfo += '</ds:X509Data>';
  KeyInfo += '<ds:KeyValue>';
  KeyInfo += '<ds:RSAKeyValue>';
  KeyInfo += '<ds:Modulus>';
  KeyInfo += certData.modules.replace(/\n/g, '');
  KeyInfo += '</ds:Modulus>';
  KeyInfo += '<ds:Exponent>';
  KeyInfo += certData.exponent;
  KeyInfo += '</ds:Exponent>';
  KeyInfo += '</ds:RSAKeyValue>';
  KeyInfo += '</ds:KeyValue>';
  KeyInfo += '</ds:KeyInfo>';

  // Para el hash de KeyInfo, solo usar xmlns:ds (como en firma válida)
  const sha256_KeyInfo = sha256_base64(
    KeyInfo.replace('<ds:KeyInfo', `<ds:KeyInfo ${nsDs}`),
  );

  let SignedInfo = '';
  SignedInfo += '<ds:SignedInfo>';
  SignedInfo += '<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />';
  SignedInfo += '<ds:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />';
  SignedInfo += `<ds:Reference Id="Reference-${referenceUUID}" URI="#comprobante">`;
  SignedInfo += '<ds:Transforms>';
  SignedInfo += '<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />';
  SignedInfo += '</ds:Transforms>';
  SignedInfo += '<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />';
  SignedInfo += '<ds:DigestValue>';
  SignedInfo += sha256_xml;
  SignedInfo += '</ds:DigestValue>';
  SignedInfo += '</ds:Reference>';
  SignedInfo += `<ds:Reference Id="ReferenceKeyInfo" URI="#KeyInfoId-Signature-${signatureUUID}">`;
  SignedInfo += '<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />';
  SignedInfo += '<ds:DigestValue>';
  SignedInfo += sha256_KeyInfo;
  SignedInfo += '</ds:DigestValue>';
  SignedInfo += '</ds:Reference>';
  SignedInfo += `<ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#SignedProperties-Signature-${signatureUUID}">`;
  SignedInfo += '<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />';
  SignedInfo += '<ds:DigestValue>';
  SignedInfo += sha256_SignedProperties;
  SignedInfo += '</ds:DigestValue>';
  SignedInfo += '</ds:Reference>';
  SignedInfo += '</ds:SignedInfo>';

  // Para la firma del SignedInfo, solo usar xmlns:ds
  const canonicalized_SignedInfo = SignedInfo.replace(
    '<ds:SignedInfo',
    `<ds:SignedInfo ${nsDs}`,
  );
  const md = forge.md.sha1.create();
  md.update(canonicalized_SignedInfo, 'utf8');

  const signature = btoa(key.sign(md));

  // Construir la firma final - solo xmlns:ds en Signature (como firma válida)
  let xades_bes = '';
  xades_bes += `<ds:Signature ${nsDs} Id="Signature-${signatureUUID}">`;
  xades_bes += SignedInfo;
  xades_bes += `<ds:SignatureValue Id="SignatureValue-${signatureUUID}">`;
  xades_bes += signature;
  xades_bes += '</ds:SignatureValue>';
  xades_bes += KeyInfo;
  xades_bes += `<ds:Object Id="XadesObjectId-${objectUUID}">`;
  xades_bes += `<xades:QualifyingProperties ${nsXades} Id="QualifyingProperties-${qualifyingPropertiesUUID}" Target="#Signature-${signatureUUID}">`;
  xades_bes += SignedProperties;
  xades_bes += '</xades:QualifyingProperties>';
  xades_bes += '</ds:Object>';
  xades_bes += '</ds:Signature>';

  return xml.replace(/(<[^<]+)$/, xades_bes + '$1');
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
