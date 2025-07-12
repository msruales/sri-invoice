export interface IInfoTributaria {
    ambiente: '1' | '2';
    tipoEmision?: number;
    razonSocial: string;
    ruc: string;
    codDoc?: '04' | '05' | '06' | '07' | '01' | '03';
    nombreComercial: string;
    codEstablecimiento?: string;
    codPtoEmision?: string;
    secuencial: number;
    dirMatriz: string;
    agenteRetencion?: number | null;
    contribuyenteRIMPE?:
        | 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE'
        | 'CONTRIBUYENTE RÉGIMEN RIMPE';
    regimenMicroempresas?: 'CONTRIBUYENTE RÉGIMEN MICROEMPRESAS';
}

export class InfoTributaria {
  private _ambiente: '1' | '2';
  private _tipoEmision = 1;
  private _razonSocial: string;
  private _ruc: string;
  private _codDoc: '04' | '05' | '06' | '07' | '01' | '03' = '01';
  private _nombreComercial: string;
  private _codEstablecimiento = '001';
  private _codPtoEmision = '002';
  private _secuencial: number;
  private _dirMatriz: string;
  private _agenteRetencion?: number;
  private _contribuyenteRIMPE?:
        | 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE'
        | 'CONTRIBUYENTE RÉGIMEN RIMPE';
  private _regimenMicroempresas?: 'CONTRIBUYENTE RÉGIMEN MICROEMPRESAS';

  constructor({
    ambiente,
    razonSocial,
    ruc,
    codDoc = '01',
    secuencial,
    nombreComercial,
    dirMatriz,
    agenteRetencion = null,
    contribuyenteRIMPE,
    tipoEmision = 1,
    codEstablecimiento = '001',
    codPtoEmision = '002',
    regimenMicroempresas,
  }: IInfoTributaria) {
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
    this._agenteRetencion = agenteRetencion ?? undefined;
    this._contribuyenteRIMPE = contribuyenteRIMPE;
    this._regimenMicroempresas = regimenMicroempresas;
  }

  get ambiente(): '1' | '2' {
    return this._ambiente;
  }

  get regimenMicroempresas() {
    return this._regimenMicroempresas;
  }

  get razonSocial(): string {
    return this._razonSocial;
  }

  get tipoEmision(): number {
    return this._tipoEmision;
  }

  get ruc(): string {
    return this._ruc;
  }

  get secuencial(): string {
    return this._secuencial.toString().padStart(9, '0');
  }

  get codDoc(): '04' | '05' | '06' | '07' | '01' | '03' {
    return this._codDoc;
  }

  set codDoc(codDoc: '04' | '05' | '06' | '07' | '01' | '03') {
    this._codDoc = codDoc;
  }

  get nombreComercial(): string {
    return this._nombreComercial;
  }

  get codEstablecimiento(): string {
    return this._codEstablecimiento;
  }

  get codPtoEmision(): string {
    return this._codPtoEmision;
  }

  get dirMatriz(): string {
    return this._dirMatriz;
  }

  get agenteRetencion() {
    return this._agenteRetencion;
  }

  get contribuyenteRimpe():
        | undefined
        | 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE'
        | 'CONTRIBUYENTE RÉGIMEN RIMPE' {
    return this._contribuyenteRIMPE;
  }
}
