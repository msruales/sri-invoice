"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoTributaria = void 0;
var InfoTributaria = /** @class */ (function () {
    function InfoTributaria(_a) {
        var ambiente = _a.ambiente, razonSocial = _a.razonSocial, ruc = _a.ruc, _b = _a.codDoc, codDoc = _b === void 0 ? '01' : _b, secuencial = _a.secuencial, nombreComercial = _a.nombreComercial, dirMatriz = _a.dirMatriz, _c = _a.agenteRetencion, agenteRetencion = _c === void 0 ? null : _c, contribuyenteRIMPE = _a.contribuyenteRIMPE, _d = _a.tipoEmision, tipoEmision = _d === void 0 ? 1 : _d, _e = _a.codEstablecimiento, codEstablecimiento = _e === void 0 ? '001' : _e, _f = _a.codPtoEmision, codPtoEmision = _f === void 0 ? '002' : _f, regimenMicroempresas = _a.regimenMicroempresas;
        this._tipoEmision = 1;
        this._codDoc = '01';
        this._codEstablecimiento = '001';
        this._codPtoEmision = '002';
        this._ambiente = ambiente;
        this._razonSocial = razonSocial;
        this._tipoEmision = tipoEmision;
        this._ruc = ruc;
        this._codDoc = codDoc;
        this._nombreComercial = nombreComercial;
        this._codEstablecimiento = codEstablecimiento;
        this._codPtoEmision = codPtoEmision;
        this._secuencial = secuencial;
        this._dirMatriz = dirMatriz;
        this._agenteRetencion = agenteRetencion !== null && agenteRetencion !== void 0 ? agenteRetencion : undefined;
        this._contribuyenteRIMPE = contribuyenteRIMPE;
        this._regimenMicroempresas = regimenMicroempresas;
    }
    Object.defineProperty(InfoTributaria.prototype, "ambiente", {
        get: function () {
            return this._ambiente;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "regimenMicroempresas", {
        get: function () {
            return this._regimenMicroempresas;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "razonSocial", {
        get: function () {
            return this._razonSocial;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "tipoEmision", {
        get: function () {
            return this._tipoEmision;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "ruc", {
        get: function () {
            return this._ruc;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "secuencial", {
        get: function () {
            return this._secuencial.toString().padStart(9, '0');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "codDoc", {
        get: function () {
            return this._codDoc;
        },
        set: function (codDoc) {
            this._codDoc = codDoc;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "nombreComercial", {
        get: function () {
            return this._nombreComercial;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "codEstablecimiento", {
        get: function () {
            return this._codEstablecimiento;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "codPtoEmision", {
        get: function () {
            return this._codPtoEmision;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "dirMatriz", {
        get: function () {
            return this._dirMatriz;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "agenteRetencion", {
        get: function () {
            return this._agenteRetencion;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(InfoTributaria.prototype, "contribuyenteRimpe", {
        get: function () {
            return this._contribuyenteRIMPE;
        },
        enumerable: false,
        configurable: true
    });
    return InfoTributaria;
}());
exports.InfoTributaria = InfoTributaria;
