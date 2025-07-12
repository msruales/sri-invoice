"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetalleBase = void 0;
var impuesto_1 = require("../impuesto/impuesto");
var data_impuestos_1 = require("../data-impuestos");
var utils_1 = require("../../utils");
var DetalleBase = /** @class */ (function () {
    function DetalleBase(_a) {
        var descripcion = _a.descripcion, cantidad = _a.cantidad, _b = _a.descuento, descuento = _b === void 0 ? 0 : _b, precioUnitario = _a.precioUnitario;
        this._descuento = 0;
        this._impuestos = [];
        this._descripcion = descripcion;
        this._cantidad = cantidad;
        this._precioUnitario = precioUnitario;
        this._descuento = descuento;
    }
    Object.defineProperty(DetalleBase.prototype, "descripcion", {
        get: function () {
            return this._descripcion;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DetalleBase.prototype, "cantidad", {
        get: function () {
            return this._cantidad;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DetalleBase.prototype, "precioUnitario", {
        get: function () {
            return (0, utils_1.formatNumber)(this._precioUnitario);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DetalleBase.prototype, "descuento", {
        get: function () {
            return (0, utils_1.formatNumber)(this._descuento);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DetalleBase.prototype, "impuestos", {
        get: function () {
            return this._impuestos;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DetalleBase.prototype, "precioTotalSinImpuesto", {
        get: function () {
            // Usar cálculo preciso para evitar errores de precisión decimal
            var subtotal = (0, utils_1.preciseCalculation)(this._precioUnitario * this._cantidad);
            this._precioTotalSinImpuesto = (0, utils_1.preciseCalculation)(subtotal - this._descuento);
            return this._precioTotalSinImpuesto;
        },
        enumerable: false,
        configurable: true
    });
    DetalleBase.prototype.addImpuesto = function (codigo, codigoPorcentaje, tarifa) {
        if (this._impuestos.find(function (impuesto) {
            return Number(impuesto.codigo) == codigo &&
                Number(impuesto.codigoPorcentaje) == codigoPorcentaje;
        })) {
            throw new Error('El descuento ya está aplicado');
        }
        var impuesto = data_impuestos_1.arrayImpuestos.find(function (impuesto) {
            return impuesto.codigo === codigo &&
                impuesto.codigoPorcentaje === codigoPorcentaje;
        });
        if (impuesto) {
            var newImpuesto = new impuesto_1.Impuesto();
            newImpuesto.codigo = impuesto.codigo;
            newImpuesto.codigoPorcentaje = impuesto.codigoPorcentaje;
            newImpuesto.tarifa = (tarifa ? tarifa : impuesto.tarifa) / 100;
            var valorImpuesto = (0, utils_1.preciseCalculation)(this.precioTotalSinImpuesto * (impuesto.tarifa / 100));
            newImpuesto.valor = valorImpuesto;
            newImpuesto.baseImponible = this.precioTotalSinImpuesto;
            this._impuestos = __spreadArray(__spreadArray([], this.impuestos, true), [newImpuesto], false);
        }
        if (!impuesto && tarifa) {
            var newImpuesto = new impuesto_1.Impuesto();
            newImpuesto.codigo = codigo;
            newImpuesto.codigoPorcentaje = codigoPorcentaje;
            newImpuesto.tarifa = tarifa / 100;
            var valorImpuestoCustom = (0, utils_1.preciseCalculation)(this.precioTotalSinImpuesto * (tarifa / 100));
            newImpuesto.valor = valorImpuestoCustom;
            newImpuesto.baseImponible = this.precioTotalSinImpuesto;
            this._impuestos = __spreadArray(__spreadArray([], this.impuestos, true), [newImpuesto], false);
        }
    };
    DetalleBase.prototype.tieneImpuestoBase = function () {
        return Boolean(this.impuestos.find(function (impuesto) {
            return Number(impuesto.codigo) == 2 &&
                Number(impuesto.codigoPorcentaje) == 0;
        }));
    };
    return DetalleBase;
}());
exports.DetalleBase = DetalleBase;
