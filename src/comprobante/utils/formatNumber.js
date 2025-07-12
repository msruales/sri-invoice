"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNumber = formatNumber;
exports.preciseCalculation = preciseCalculation;
function formatNumber(baseImponible) {
    // Redondear a 2 decimales para evitar problemas de precisión
    var rounded = Math.round((baseImponible + Number.EPSILON) * 100) / 100;
    return rounded.toFixed(2).replace(',', '.');
}
// Función auxiliar para cálculos precisos
function preciseCalculation(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
