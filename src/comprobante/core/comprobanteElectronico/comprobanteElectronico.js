"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComprobanteElectronico = void 0;
var impuesto_1 = require("../impuesto/impuesto");
var utils_1 = require("../../utils");
var xmlbuilder2_1 = require("xmlbuilder2");
var ComprobanteElectronico = /** @class */ (function () {
    function ComprobanteElectronico(_a) {
        var infoTributaria = _a.infoTributaria, fechaEmision = _a.fechaEmision, razonSocialComprador = _a.razonSocialComprador, identificacionComprador = _a.identificacionComprador, tipoIdentificacionComprador = _a.tipoIdentificacionComprador, dirEstablecimiento = _a.dirEstablecimiento, _b = _a.moneda, moneda = _b === void 0 ? 'DOLAR' : _b, _c = _a.obligadoContabilidad, obligadoContabilidad = _c === void 0 ? false : _c, telefonoComprador = _a.telefonoComprador, correoComprador = _a.correoComprador;
        this.moneda = 'DOLAR';
        this._obligadoContabilidad = false;
        this.detalles = [];
        this._accessKey = '';
        this.infoTributaria = infoTributaria;
        this.fechaEmision = fechaEmision;
        this.dirEstablecimiento = dirEstablecimiento;
        this.razonSocialComprador = razonSocialComprador;
        this.identificacionComprador = identificacionComprador;
        this.tipoIdentificacionComprador = tipoIdentificacionComprador;
        this.moneda = moneda;
        this._obligadoContabilidad = obligadoContabilidad;
        this.correoComprador = correoComprador;
        this.telefonoComprador = telefonoComprador;
    }
    Object.defineProperty(ComprobanteElectronico.prototype, "obligadoContabilidad", {
        get: function () {
            return this._obligadoContabilidad ? 'SI' : 'NO';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ComprobanteElectronico.prototype, "totalSinImpuestos", {
        get: function () {
            var total = this.detalles.reduce(function (acc, detalle) {
                return (0, utils_1.preciseCalculation)(acc + Number(detalle.precioTotalSinImpuesto));
            }, 0);
            return (0, utils_1.formatNumber)(total);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ComprobanteElectronico.prototype, "accessKey", {
        get: function () {
            this.checkDate();
            var accessKey = (0, utils_1.generateAccessKey)({
                date: this.fechaEmision,
                codDoc: this.infoTributaria.codDoc,
                ruc: this.infoTributaria.ruc,
                environment: this.infoTributaria.ambiente,
                establishment: this.infoTributaria.codEstablecimiento,
                emissionPoint: this.infoTributaria.codPtoEmision,
                sequential: this.infoTributaria.secuencial,
            });
            this._accessKey = accessKey;
            return accessKey;
        },
        enumerable: false,
        configurable: true
    });
    ComprobanteElectronico.prototype.concatImpuestos = function () {
        // Concatenar todos los impuestos de los detalles, creando una copia para evitar referencias
        return this.detalles.flatMap(function (detalle) {
            return detalle.impuestos.map(function (impuesto) {
                var newImpuesto = new impuesto_1.Impuesto();
                newImpuesto.tarifa = Number(impuesto.tarifa);
                newImpuesto.codigo = Number(impuesto.codigo);
                newImpuesto.codigoPorcentaje = Number(impuesto.codigoPorcentaje);
                newImpuesto.baseImponible = Number(impuesto.baseImponible);
                newImpuesto.valor = Number(impuesto.valor);
                return newImpuesto;
            });
        });
    };
    ComprobanteElectronico.prototype.calcTotalConImpuestos = function () {
        var concatImpuesto = this.concatImpuestos();
        // Agrupar los impuestos por `codigoPorcentaje` y sumar sus valores
        return concatImpuesto.reduce(function (acc, impuesto) {
            var impuestoExistente = acc.find(function (item) { return item.codigoPorcentaje === impuesto.codigoPorcentaje; });
            if (impuestoExistente) {
                // Si el impuesto ya existe, sumar baseImponible y valor al existente
                impuestoExistente.baseImponible =
                    Number(impuestoExistente.baseImponible) +
                        Number(impuesto.baseImponible);
                impuestoExistente.valor =
                    Number(impuestoExistente.valor) + Number(impuesto.valor);
            }
            else {
                // Si no existe, agregar una copia del nuevo impuesto
                var newImpuesto = new impuesto_1.Impuesto();
                newImpuesto.tarifa = Number(impuesto.tarifa);
                newImpuesto.codigo = Number(impuesto.codigo);
                newImpuesto.codigoPorcentaje = Number(impuesto.codigoPorcentaje);
                newImpuesto.baseImponible = Number(impuesto.baseImponible);
                newImpuesto.valor = Number(impuesto.valor);
                acc.push(newImpuesto);
            }
            return acc;
        }, []);
    };
    ComprobanteElectronico.prototype.addDetalle = function (detalle) {
        this.detalles.push(detalle);
    };
    ComprobanteElectronico.prototype.checkDate = function () {
        var fechaEmision = this.fechaEmision;
        var regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/20[0-9]{2}$/;
        if (!regex.test(fechaEmision)) {
            throw new Error('Formato de fecha invalido');
        }
    };
    ComprobanteElectronico.prototype.generateXml = function (content) {
        var document = (0, xmlbuilder2_1.create)(content);
        var xml = document.end({
            prettyPrint: true,
            headless: true,
        });
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n".concat(xml);
    };
    // Método abstracto para que las subclases lo implementen
    ComprobanteElectronico.prototype.generateComprobanteXml = function () {
        throw new Error('Método no implementado.');
    };
    return ComprobanteElectronico;
}());
exports.ComprobanteElectronico = ComprobanteElectronico;
