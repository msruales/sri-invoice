export type TaxInfo = {
    /*
    pruebas 1
    produccion 2
    */
    ambiente: '1' | '2';
    tipoEmision: number;
    razonSocial: string;
    nombreComercial: string;
    ruc: string;
    claveAcceso: string;
    /*
    FACTURA 01
    LIQUIDACIÓN DE COMPRA DE
    BIENES Y PRESTACIÓN DE
    SERVICIOS 03
    NOTA DE CRÉDITO 04
    NOTA DE DÉBITO 05
    GUÍA DE REMISIÓN 06
    COMPROBANTE DE RETENCIÓN 07
    */
    codDoc: '01' | '03' | '04' | '05' | '06' | '07';
    estab: string;
    ptoEmi: string;
    secuencial: string;
    dirMatriz: string;
    regimenMicroempresas?: 'CONTRIBUYENTE RÉGIMEN MICROEMPRESAS';
    agenteRetencion?: number;
    contribuyenteRimpe?:
        | 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE'
        | 'CONTRIBUYENTE RÉGIMEN RIMPE';
};
