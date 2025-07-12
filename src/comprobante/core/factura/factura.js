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
exports.Factura = void 0;
var utils_1 = require("../../utils");
var comprobanteElectronico_1 = require("../comprobanteElectronico/comprobanteElectronico");
var Factura = /** @class */ (function (_super) {
    __extends(Factura, _super);
    function Factura(_a) {
        var infoTributaria = _a.infoTributaria, fechaEmision = _a.fechaEmision, contribuyenteEspecial = _a.contribuyenteEspecial, razonSocialComprador = _a.razonSocialComprador, identificacionComprador = _a.identificacionComprador, direccionComprador = _a.direccionComprador, correoComprador = _a.correoComprador, telefonoComprador = _a.telefonoComprador, observaciones = _a.observaciones, _b = _a.obligadoContabilidad, obligadoContabilidad = _b === void 0 ? false : _b, tipoIdentificacionComprador = _a.tipoIdentificacionComprador, _c = _a.propina, propina = _c === void 0 ? 0.0 : _c, _d = _a.moneda, moneda = _d === void 0 ? 'DOLAR' : _d, dirEstablecimiento = _a.dirEstablecimiento;
        var _this = _super.call(this, {
            moneda: moneda,
            correoComprador: correoComprador,
            telefonoComprador: telefonoComprador,
            dirEstablecimiento: dirEstablecimiento,
            fechaEmision: fechaEmision,
            contribuyenteEspecial: contribuyenteEspecial,
            infoTributaria: infoTributaria,
            identificacionComprador: identificacionComprador,
            tipoIdentificacionComprador: tipoIdentificacionComprador,
            razonSocialComprador: razonSocialComprador,
            obligadoContabilidad: obligadoContabilidad,
        }) || this;
        _this._propina = 0.0;
        _this.pagos = [];
        _this.detalles = [];
        _this.direccionComprador = direccionComprador;
        _this._propina = propina;
        _this.observaciones = observaciones;
        _this.infoTributaria.codDoc = '01';
        return _this;
    }
    Object.defineProperty(Factura.prototype, "totalDescuento", {
        get: function () {
            var totalDescuento = this.detalles.reduce(function (acc, detalle) {
                return (0, utils_1.preciseCalculation)(acc + Number(detalle.descuento));
            }, 0);
            return (0, utils_1.formatNumber)(totalDescuento);
        },
        enumerable: false,
        configurable: true
    });
    Factura.prototype.checkPago = function () {
        var totalPago = this.pagos.reduce(function (acc, pago) {
            return (0, utils_1.preciseCalculation)(acc + Number(pago.total));
        }, 0);
        var importeTotal = (0, utils_1.preciseCalculation)(Number(this.importeTotal));
        if (importeTotal !== totalPago) {
            throw new Error("El pago (".concat(totalPago, ") no coincide con el importe total (").concat(importeTotal, ")"));
        }
    };
    Factura.prototype.addPago = function (pago) {
        this.pagos.push(pago);
    };
    Object.defineProperty(Factura.prototype, "propina", {
        get: function () {
            return (0, utils_1.formatNumber)(this._propina);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Factura.prototype, "importeTotal", {
        get: function () {
            var concatImpuestos = this.concatImpuestos();
            var sumaImpuestos = concatImpuestos.reduce(function (acc, impuesto) { return (0, utils_1.preciseCalculation)(acc + Number(impuesto.valor)); }, 0);
            var total = (0, utils_1.preciseCalculation)(Number(this.totalSinImpuestos) + sumaImpuestos);
            return (0, utils_1.formatNumber)(total);
        },
        enumerable: false,
        configurable: true
    });
    Factura.prototype.generateComprobanteXml = function () {
        var accessKeyGenerated = this.accessKey;
        var invoiceObject = {
            factura: {
                '@id': 'comprobante',
                '@version': '1.1.0',
                'infoTributaria': {
                    ambiente: this.infoTributaria.ambiente,
                    tipoEmision: this.infoTributaria.tipoEmision,
                    razonSocial: this.infoTributaria.razonSocial,
                    nombreComercial: this.infoTributaria.nombreComercial,
                    ruc: this.infoTributaria.ruc,
                    claveAcceso: accessKeyGenerated,
                    codDoc: this.infoTributaria.codDoc,
                    estab: this.infoTributaria.codEstablecimiento,
                    ptoEmi: this.infoTributaria.codPtoEmision,
                    secuencial: this.infoTributaria.secuencial,
                    dirMatriz: this.infoTributaria.dirMatriz,
                    agenteRetencion: this.infoTributaria.agenteRetencion,
                    contribuyenteRimpe: this.infoTributaria.contribuyenteRimpe,
                    regimenMicroempresas: this.infoTributaria.regimenMicroempresas,
                },
                'infoFactura': {
                    fechaEmision: this.fechaEmision,
                    dirEstablecimiento: this.dirEstablecimiento,
                    contribuyenteEspecial: this.contribuyenteEspecial,
                    obligadoContabilidad: this.obligadoContabilidad,
                    tipoIdentificacionComprador: this.tipoIdentificacionComprador,
                    razonSocialComprador: this.razonSocialComprador,
                    identificacionComprador: this.identificacionComprador,
                    direccionComprador: this.direccionComprador,
                    totalSinImpuestos: this.totalSinImpuestos,
                    totalDescuento: this.totalDescuento,
                    totalConImpuestos: {
                        totalImpuesto: this.calcTotalConImpuestos().map(function (data) { return ({
                            codigo: data.codigo,
                            codigoPorcentaje: data.codigoPorcentaje,
                            descuentoAdicional: '0',
                            baseImponible: data.baseImponible,
                            tarifa: data.tarifa,
                            valor: data.valor,
                        }); }),
                    },
                    propina: this.propina,
                    importeTotal: this.importeTotal,
                    moneda: this.moneda,
                    pagos: {
                        pago: this.pagos.map(function (pago) { return ({
                            formaPago: pago.formaPago,
                            total: pago.total,
                            plazo: pago.plazo,
                            unidadTiempo: pago.unidadTiempo,
                        }); }),
                    },
                },
                'detalles': {
                    detalle: this.detalles.map(function (detalle) { return ({
                        codigoPrincipal: detalle.codigoPrincipal,
                        codigoAuxiliar: detalle.codigoAuxiliar,
                        descripcion: detalle.descripcion,
                        cantidad: detalle.cantidad,
                        precioUnitario: detalle.precioUnitario,
                        descuento: detalle.descuento,
                        precioTotalSinImpuesto: (0, utils_1.formatNumber)(detalle.precioTotalSinImpuesto),
                        impuestos: {
                            impuesto: detalle.impuestos.map(function (impuesto) { return ({
                                codigo: impuesto.codigo,
                                codigoPorcentaje: impuesto.codigoPorcentaje,
                                tarifa: String(Number(impuesto.tarifa) * 100),
                                baseImponible: impuesto.baseImponible,
                                valor: impuesto.valor,
                            }); }),
                        },
                    }); }),
                },
                // @ts-ignore
                'infoAdicional': 
                // eslint-disable-next-line max-len
                this.telefonoComprador || this.correoComprador || this.observaciones ?
                    {
                        campoAdicional: [
                            this.telefonoComprador && {
                                '@nombre': 'Telefono',
                                '#': this.telefonoComprador,
                            },
                            this.correoComprador && {
                                '@nombre': 'Email',
                                '#': this.correoComprador,
                            },
                            this.observaciones && {
                                '@nombre': 'Observaciones',
                                '#': this.observaciones,
                            },
                        ],
                    } :
                    undefined,
            },
        };
        this.checkPago();
        var invoiceXml = this.generateXml(invoiceObject);
        var accessKey = accessKeyGenerated;
        return { invoiceXml: invoiceXml, accessKey: accessKey };
    };
    return Factura;
}(comprobanteElectronico_1.ComprobanteElectronico));
exports.Factura = Factura;
