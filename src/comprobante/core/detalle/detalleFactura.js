"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetalleFactura = void 0;
var detalleBase_1 = require("./detalleBase");
var DetalleFactura = /** @class */ (function (_super) {
    __extends(DetalleFactura, _super);
    function DetalleFactura(_a) {
        var codigoPrincipal = _a.codigoPrincipal, codigoAuxiliar = _a.codigoAuxiliar, descripcion = _a.descripcion, cantidad = _a.cantidad, _b = _a.descuento, descuento = _b === void 0 ? 0 : _b, precioUnitario = _a.precioUnitario;
        var _this = _super.call(this, { descripcion: descripcion, cantidad: cantidad, descuento: descuento, precioUnitario: precioUnitario }) || this;
        _this._codigoPrincipal = codigoPrincipal;
        _this._codigoAuxiliar = codigoAuxiliar;
        return _this;
    }
    Object.defineProperty(DetalleFactura.prototype, "codigoPrincipal", {
        get: function () {
            return this._codigoPrincipal;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DetalleFactura.prototype, "codigoAuxiliar", {
        get: function () {
            return this._codigoAuxiliar;
        },
        enumerable: false,
        configurable: true
    });
    return DetalleFactura;
}(detalleBase_1.DetalleBase));
exports.DetalleFactura = DetalleFactura;
