"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pago = void 0;
var utils_1 = require("../../utils");
var Pago = /** @class */ (function () {
    function Pago(_a) {
        var _b = _a.formaPago, formaPago = _b === void 0 ? '01' : _b, total = _a.total, _c = _a.plazo, plazo = _c === void 0 ? 0 : _c, _d = _a.unidadTiempo, unidadTiempo = _d === void 0 ? 'dias' : _d;
        this._plazo = 0;
        this._unidadTiempo = 'dias';
        this._formaPago = formaPago;
        this._total = total;
        this._plazo = plazo;
        this._unidadTiempo = unidadTiempo;
    }
    Object.defineProperty(Pago.prototype, "formaPago", {
        get: function () {
            return this._formaPago;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pago.prototype, "total", {
        get: function () {
            return (0, utils_1.formatNumber)(this._total);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pago.prototype, "plazo", {
        get: function () {
            return String(this._plazo);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Pago.prototype, "unidadTiempo", {
        get: function () {
            return this._unidadTiempo;
        },
        enumerable: false,
        configurable: true
    });
    return Pago;
}());
exports.Pago = Pago;
