import * as forge from 'node-forge';
import { readFileSync } from 'fs';
import * as https from 'node:https';

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

function sha1_base64(txt, encoding) {
  const md = forge.md.sha1.create();
  md.update(txt, encoding);
  const HASH = md.digest().toHex();
  const BUFFER = Buffer.from(HASH, 'hex');
  return BUFFER.toString('base64');
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

async function sign(p12Path, p12Password, xmlIn) {
  const ARRAYBUFFER = await getP12FromUrl(p12Path);
  let xml = xmlIn;

  xml = xml
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios en blanco por un solo espacio
    .trim() // Eliminar espacios al principio y al final
    .replace(/(?<=>)(\r?\n)|(\r?\n)(?=<\/)/g, '') // Eliminar saltos de línea entre etiquetas
    .trim() // Volver a eliminar espacios
    .replace(/(?<=>)(\s*)/g, '');

  const ARRAYUINT8 = new Uint8Array(ARRAYBUFFER);
  const DER = forge.util.decode64(forge.util.binary.base64.encode(ARRAYUINT8));
  const ASN1 = forge.asn1.fromDer(DER);
  const P12 = forge.pkcs12.pkcs12FromAsn1(ASN1, p12Password);

  const PKCS8BAGS = P12.getBags({
    bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
  });

  const CERTBAGS = P12.getBags({
    bagType: forge.pki.oids.certBag,
  });

  const CERTBAG = CERTBAGS[forge.oids.certBag];

  const FRIENDLYNAME = CERTBAG[1].attributes.friendlyName[0];

  let certificate;
  let pkcs8;
  let issuerName = '';

  const cert = CERTBAG.reduce((prev, curr) => {
    // const attributes = curr.cert.extensions;
    return curr.cert.extensions.length > prev.cert.extensions.length ?
      curr :
      prev;
  });
  const issuerAttrs = cert.cert.issuer.attributes;

  issuerName = issuerAttrs
    .reverse()
    .map((attr) => {
      return `${attr.shortName}=${attr.value}`;
    })
    .join(', ');

  if (/BANCO CENTRAL/i.test(FRIENDLYNAME)) {
    const keys = PKCS8BAGS[forge.oids.pkcs8ShroudedKeyBag];

    for (let i = 0; i < keys.length; i++) {
      const element = keys[i];
      const friendlyName = element.attributes.friendlyName[0];
      if (/Signing Key/i.test(friendlyName)) {
        pkcs8 = PKCS8BAGS[forge.oids.pkcs8ShroudedKeyBag][i];
      }
    }
  }

  if (/SECURITY DATA/i.test(FRIENDLYNAME)) {
    pkcs8 = PKCS8BAGS[forge.oids.pkcs8ShroudedKeyBag][0];
  }

  certificate = cert.cert;

  const notBefore = certificate.validity['notBefore'];
  const notAfter = certificate.validity['notAfter'];

  const currentDate = new Date();

  if (currentDate < notBefore || currentDate > notAfter) {
    throw new Error('Invalid certificatem certificate has expired');
  }

  const key = pkcs8.key ?? pkcs8.asn1;

  const certificateX509_pem = forge.pki.certificateToPem(certificate);

  let certificateX509 = certificateX509_pem.substring(
    certificateX509_pem.indexOf('\n') + 1,
    certificateX509_pem.indexOf('\n-----END CERTIFICATE-----'),
  );

  certificateX509 = certificateX509
    .replace(/\r?\n|\r/g, '') // Elimina todos los saltos de línea y retornos de carro
    .replace(/([^\0]{76})/g, '$1\n'); // Inserta un salto de línea cada 76 caracteres

  const certificateX509_asn1 = forge.pki.certificateToAsn1(certificate);
  const certificateX509_der = forge.asn1.toDer(certificateX509_asn1).getBytes();
  const hash_certificateX509_der = sha1_base64(certificateX509_der);
  const certificateX509_serialNumber = parseInt(certificate.serialNumber, 16);

  const exponent = hexToBase64(key.e.data[0].toString(16));
  const modules = bigIntToBase64(key.n);

  xml = xml.replace(/\t|\r/g, '');

  const sha1_xml = sha1_base64(
    xml.replace('<?xml version="1.0" encoding="UTF-8"?>', ''),
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
  SignedProperties += certificateX509_serialNumber;
  SignedProperties += '</ds:X509SerialNumber>';
  SignedProperties += '</etsi:IssuerSerial>';
  SignedProperties += '</etsi:Cert>';
  SignedProperties += '</etsi:SigningCertificate>';
  SignedProperties += '</etsi:SignedSignatureProperties>';

  SignedProperties += '<etsi:SignedDataObjectProperties>';
  SignedProperties +=
    '<etsi:DataObjectFormat ObjectReference="#Reference-ID=' +
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
  KeyInfo += certificateX509;
  KeyInfo += '\n</ds:X509Certificate>';
  KeyInfo += '\n</ds:X509Data>';
  KeyInfo += '\n<ds:KeyValue>';
  KeyInfo += '\n<ds:RSAKeyValue>';
  KeyInfo += '\n<ds:Modulus>\n';
  KeyInfo += modules;
  KeyInfo += '\n</ds:Modulus>';
  KeyInfo += '\n<ds:Exponent>\n';
  KeyInfo += exponent;
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
  SignedInfo += '\n</ds:DigestValue>';
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

export { sign };
