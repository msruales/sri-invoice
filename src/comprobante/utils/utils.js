"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessKey = generateAccessKey;
function generateAccessKey(accessKeyData) {
    var accessKey = '';
    accessKey += formatDateToDDMMYYYY(accessKeyData.date); // Fecha de emisión
    accessKey += accessKeyData.codDoc; // Tipo de comprobante
    accessKey += accessKeyData.ruc; // Número de RUC
    accessKey += accessKeyData.environment; // Tipo de ambiente
    accessKey += accessKeyData.establishment; // Establecimiento
    accessKey += accessKeyData.emissionPoint; // Punto de emision
    accessKey += accessKeyData.sequential; // Secuencial
    accessKey += generateRandomEightDigitNumber(); // Código numérico
    accessKey += '1'; // Tipo de emisión
    accessKey += generateVerificatorDigit(accessKey); // Dígito verificador
    return accessKey;
}
function formatDateToDDMMYYYY(dateIn) {
    var _a = dateIn.split('/').map(Number), dayIn = _a[0], monthIn = _a[1], yearIn = _a[2];
    var date = new Date(yearIn, monthIn - 1, dayIn);
    var day = date.getDate();
    var month = date.getMonth() + 1; // getMonth() returns 0-11
    var year = date.getFullYear();
    // Pad day and month with a leading zero if they are less than 10
    var finalDay = day < 10 ? '0' + day : day;
    var finalMonth = month < 10 ? '0' + month : month;
    return "".concat(finalDay).concat(finalMonth).concat(year);
}
function generateRandomEightDigitNumber() {
    var min = 10000000;
    var max = 99999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generateVerificatorDigit(accessKey) {
    var result = 0;
    var addition = 0;
    var multiple = 7;
    for (var i = 0; i < accessKey.length; i++) {
        addition += parseInt(accessKey.charAt(i)) * multiple;
        multiple > 2 ? multiple-- : (multiple = 7);
    }
    result = 11 - (addition % 11);
    result === 10 ? (result = 1) : (result = result);
    result === 11 ? (result = 0) : (result = result);
    return result;
}
