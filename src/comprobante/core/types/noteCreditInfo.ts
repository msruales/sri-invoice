import { Compensations, TotalWithTaxes } from './invoiceInfo';

export type NoteCreditInfo = {
    fechaEmision: string;
    dirEstablecimiento: string | undefined;
    /*
   RUC 04
   CÉDULA 05
   PASAPORTE 06
   VENTA A CONSUMIDOR FINAL* 07
   IDENTIFICACIÓN DELEXTERIOR* 08
   */
    tipoIdentificacionComprador: '04' | '05' | '06' | '07' | '08';
    razonSocialComprador: string;
    identificacionComprador: string;
    contribuyenteEspecial?: number | null;
    obligadoContabilidad: 'SI' | 'NO';
    rise?: string;
    /*
  FACTURA 01
  LIQUIDACIÓN DE COMPRA DEBIENES Y PRESTACIÓN DE SERVICIOS 03
  NOTA DE CRÉDITO 04
  NOTA DE DÉBITO 05
  GUÍA DE REMISIÓN 06
  COMPROBANTE DE RETENCIÓN 07
  */
    codDocModificado: '01' | '03' | '04' | '05' | '06' | '07';
    numDocModificado?: string;
    fechaEmisionDocSustento: string;

    totalSinImpuestos: string;
    totalDescuento?: string;
    compensaciones?: Compensations;
    valorModificacion: string;
    moneda: string;
    totalConImpuestos: TotalWithTaxes;
    motivo: string;
};
