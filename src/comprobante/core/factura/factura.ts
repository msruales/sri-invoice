import { DetalleFactura, Pago } from '../';
import { Invoice } from '../types';
import { formatNumber, preciseCalculation } from '../../utils';
import {
  ComprobanteElectronico,
  IComprobanteElectronico,
} from '../comprobanteElectronico/comprobanteElectronico';

export interface IFactura extends IComprobanteElectronico {
    direccionComprador: string;
    propina?: number;
    observaciones?: string;
}

export class Factura extends ComprobanteElectronico {
  private contribuyenteEspecial?: number | null;
  private direccionComprador: string;
  private observaciones?: string;

  private _propina = 0.0;
  private pagos: Pago[] = [];
  detalles: DetalleFactura[] = [];

  constructor({
    infoTributaria,
    fechaEmision,
    contribuyenteEspecial,
    razonSocialComprador,
    identificacionComprador,
    direccionComprador,
    correoComprador,
    telefonoComprador,
    observaciones,
    obligadoContabilidad = false,
    tipoIdentificacionComprador,
    propina = 0.0,
    moneda = 'DOLAR',
    dirEstablecimiento,
  }: IFactura) {
    super({
      moneda,
      correoComprador,
      telefonoComprador,
      dirEstablecimiento,
      fechaEmision,
      contribuyenteEspecial,
      infoTributaria,
      identificacionComprador,
      tipoIdentificacionComprador,
      razonSocialComprador,
      obligadoContabilidad,
    });

    this.direccionComprador = direccionComprador;
    this._propina = propina;
    this.observaciones = observaciones;
    this.infoTributaria.codDoc = '01';
  }

  get totalDescuento(): string {
    const totalDescuento = this.detalles.reduce((acc, detalle) => {
      return preciseCalculation(acc + Number(detalle.descuento));
    }, 0);
    return formatNumber(totalDescuento);
  }

  checkPago(): void {
    const totalPago = this.pagos.reduce((acc, pago) => {
      return preciseCalculation(acc + Number(pago.total));
    }, 0);
    const importeTotal = preciseCalculation(Number(this.importeTotal));

    // Tolerancia para diferencias de redondeo muy pequeñas (hasta 0.01)
    const diferencia = Math.abs(importeTotal - totalPago);
    const tolerancia = 0.01;

    if (diferencia > tolerancia) {
      throw new Error(`El pago (${totalPago}) no coincide con el importe total (${importeTotal}). Diferencia: ${diferencia.toFixed(4)}`);
    }
  }

  addPago(pago: Pago) {
    this.pagos.push(pago);
  }

  get propina(): string {
    return formatNumber(this._propina);
  }

  get importeTotal(): string {
    const concatImpuestos = this.concatImpuestos();

    const sumaImpuestos = concatImpuestos.reduce(
      (acc, impuesto) => preciseCalculation(acc + Number(impuesto.valor)),
      0,
    );

    const total = preciseCalculation(Number(this.totalSinImpuestos) + sumaImpuestos);
    return formatNumber(total);
  }

  generateComprobanteXml(): { invoiceXml: string; accessKey: string } {
    const accessKeyGenerated = this.accessKey;
    const invoiceObject: Invoice = {
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
            totalImpuesto: this.calcTotalConImpuestos().map((data) => ({
              codigo: data.codigo,
              codigoPorcentaje: data.codigoPorcentaje,
              descuentoAdicional: '0',
              baseImponible: data.baseImponible,
              tarifa: data.tarifa,
              valor: data.valor,
            })),
          },
          propina: this.propina,
          importeTotal: this.importeTotal,
          moneda: this.moneda,
          pagos: {
            pago: this.pagos.map((pago) => ({
              formaPago: pago.formaPago,
              total: pago.total,
              plazo: pago.plazo,
              unidadTiempo: pago.unidadTiempo,
            })),
          },
        },
        'detalles': {
          detalle: this.detalles.map((detalle) => ({
            codigoPrincipal: detalle.codigoPrincipal,
            codigoAuxiliar: detalle.codigoAuxiliar,
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
    const invoiceXml = this.generateXml(invoiceObject);
    const accessKey = accessKeyGenerated;
    return { invoiceXml, accessKey };
  }
}
