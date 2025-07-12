"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Impuesto = void 0;
var utils_1 = require("../../utils");
var Impuesto = /** @class */ (function () {
    function Impuesto() {
    }
    Object.defineProperty(Impuesto.prototype, "codigo", {
        get: function () {
            return this._codigo.toString();
        },
        set: function (value) {
            this._codigo = Number(value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Impuesto.prototype, "codigoPorcentaje", {
        get: function () {
            return this._codigoPorcentaje.toString();
        },
        set: function (value) {
            this._codigoPorcentaje = Number(value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Impuesto.prototype, "tarifa", {
        get: function () {
            return this._tarifa.toString();
        },
        set: function (value) {
            this._tarifa = Number(value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Impuesto.prototype, "baseImponible", {
        get: function () {
            return (0, utils_1.formatNumber)(this._baseImponible);
        },
        set: function (value) {
            this._baseImponible = Number(value);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Impuesto.prototype, "valor", {
        get: function () {
            return (0, utils_1.formatNumber)(this._valor);
        },
        set: function (value) {
            this._valor = Number(value);
        },
        enumerable: false,
        configurable: true
    });
    return Impuesto;
}());
exports.Impuesto = Impuesto;
