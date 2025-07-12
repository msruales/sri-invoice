import { NoteCredit } from '../types';
import {
  ComprobanteElectronico,
  IComprobanteElectronico,
} from '../comprobanteElectronico/comprobanteElectronico';
import { DetalleNotaCredito } from '../detalle/detalleNotaCredito';
import { formatNumber, preciseCalculation } from '../../utils';

export interface INotaCredito extends IComprobanteElectronico {
    rise?: string;
    /*
    FACTURA 01 LIQUIDACIÓN DE COMPRA DEBIENES Y PRESTACIÓN DE SERVICIOS 03 NOTA DE CRÉDITO 04 NOTA DE DÉBITO 05 GUÍA DE REMISIÓN 06 COMPROBANTE DE RETENCIÓN 07
    */
    codDocModificado?: '04' | '05' | '06' | '07' | '01' | '03';
    numDocModificado?: string;
    fechaEmisionDocSustento: string;
    motivo: string;
}

export class NotaCredito extends ComprobanteElectronico {
  private contribuyenteEspecial?: number | null;
  detalles: DetalleNotaCredito[] = [];

  protected rise?: string;
  protected codDocModificado: '04' | '05' | '06' | '07' | '01' | '03';
  protected numDocModificado?: string;
  protected fechaEmisionDocSustento: string;
  protected motivo: string;

  constructor({
    infoTributaria,
    fechaEmision,
    dirEstablecimiento,
    tipoIdentificacionComprador,
    razonSocialComprador,
    identificacionComprador,
    contribuyenteEspecial,
    obligadoContabilidad = false,
    rise,
    codDocModificado = '01',
    numDocModificado,
    fechaEmisionDocSustento,
    moneda = 'DOLAR',
    motivo,
    correoComprador,
    telefonoComprador,
  }: INotaCredito) {
    super({
      correoComprador,
      telefonoComprador,
      moneda,
      dirEstablecimiento,
      fechaEmision,
      contribuyenteEspecial,
      infoTributaria,
      identificacionComprador,
      tipoIdentificacionComprador,
      razonSocialComprador,
      obligadoContabilidad,
    });
    this.correoComprador = correoComprador;
    this.telefonoComprador = telefonoComprador;
    this.codDocModificado = codDocModificado;
    this.rise = rise;
    this.numDocModificado = numDocModificado;
    this.fechaEmisionDocSustento = fechaEmisionDocSustento;
    this.motivo = motivo;
    this.infoTributaria.codDoc = '04';
  }

  get totalDescuento(): string {
    const totalDescuento = this.detalles.reduce((acc, detalle) => {
      return preciseCalculation(acc + Number(detalle.descuento));
    }, 0);
    return formatNumber(totalDescuento);
  }

  get valorModificacion(): string {
    const concatImpuestos = this.concatImpuestos();

    const sumaImpuestos = concatImpuestos.reduce(
      (acc, impuesto) => acc + Number(impuesto.valor),
      0,
    );

    return formatNumber(
      Number(this.totalSinImpuestos) +
            sumaImpuestos -
            Number(this.totalDescuento),
    );
  }

  generateComprobanteXml(): { invoiceXml: string; accessKey: string } {
    const accessKeyGenerated = this.accessKey;
    const invoiceObject: NoteCredit = {
      notaCredito: {
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
        },
        'infoNotaCredito': {
          fechaEmision: this.fechaEmision,
          dirEstablecimiento: this.dirEstablecimiento,
          tipoIdentificacionComprador: this.tipoIdentificacionComprador,
          razonSocialComprador: this.razonSocialComprador,
          identificacionComprador: this.identificacionComprador,
          contribuyenteEspecial: this.contribuyenteEspecial,
          obligadoContabilidad: this.obligadoContabilidad,
          rise: this.rise,
          codDocModificado: this.codDocModificado,
          numDocModificado: this.numDocModificado,
          fechaEmisionDocSustento: this.fechaEmisionDocSustento,
          totalSinImpuestos: this.totalSinImpuestos,
          valorModificacion: this.valorModificacion,
          moneda: this.moneda,
          totalConImpuestos: {
            totalImpuesto: this.calcTotalConImpuestos().map((data) => ({
              codigo: data.codigo,
              codigoPorcentaje: data.codigoPorcentaje,
              baseImponible: data.baseImponible,
              valor: data.valor,
            })),
          },
          motivo: this.motivo,
        },
        'detalles': {
          detalle: this.detalles.map((detalle) => ({
            codigoInterno: detalle.codigoInterno,
            codigoAdicional: detalle.codigoAdicional,
            descripcion: detalle.descripcion,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuento: detalle.descuento,
            precioTotalSinImpuesto: formatNumber(
              detalle.precioTotalSinImpuesto,
            ),
            impuestos: {
              impuesto: detalle.impuestos.map((impuesto) => ({
                codigo: impuesto.codigo,
                codigoPorcentaje: impuesto.codigoPorcentaje,
                tarifa: String(Number(impuesto.tarifa) * 100),
                baseImponible: impuesto.baseImponible,
                valor: impuesto.valor,
              })),
            },
          })),
        },
        // @ts-ignore
        'infoAdicional':
                    this.telefonoComprador || this.correoComprador ?
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
                        ],
                      } :
                      undefined,
      },
    };

    const invoiceXml = this.generateXml(invoiceObject);
    const accessKey = accessKeyGenerated;
    return { invoiceXml, accessKey };
  }
}
