import { InfoTributaria } from '../info-tributaria/infoTributaria';
import { Impuesto } from '../impuesto/impuesto';
import { DetalleBase } from '../detalle/detalleBase';
import { formatNumber, generateAccessKey, preciseCalculation } from '../../utils';
import { ExpandObject } from 'xmlbuilder2/lib/interfaces';
import { create } from 'xmlbuilder2';

export interface IComprobanteElectronico {
    infoTributaria: InfoTributaria;
    fechaEmision: string;
    dirEstablecimiento: string;
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
    obligadoContabilidad?: boolean;
    moneda?: string;
    correoComprador?: string;
    telefonoComprador?: string;
}

export class ComprobanteElectronico {
  protected infoTributaria: InfoTributaria;
  protected fechaEmision: string;
  protected dirEstablecimiento?: string;
  protected razonSocialComprador: string;
  protected identificacionComprador: string;
  protected tipoIdentificacionComprador: '04' | '05' | '06' | '07' | '08';
  protected moneda = 'DOLAR';
  protected _obligadoContabilidad = false;

  detalles: DetalleBase[] = [];

  protected _accessKey = '';

  protected correoComprador: string | undefined;
  protected telefonoComprador?: string;

  constructor({
    infoTributaria,
    fechaEmision,
    razonSocialComprador,
    identificacionComprador,
    tipoIdentificacionComprador,
    dirEstablecimiento,
    moneda = 'DOLAR',
    obligadoContabilidad = false,
    telefonoComprador,
    correoComprador,
  }: IComprobanteElectronico) {
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

  get obligadoContabilidad(): 'SI' | 'NO' {
    return this._obligadoContabilidad ? 'SI' : 'NO';
  }

  get totalSinImpuestos(): string {
    const total = this.detalles.reduce((acc, detalle) => {
      return preciseCalculation(acc + Number(detalle.precioTotalSinImpuesto));
    }, 0);
    return formatNumber(total);
  }

  get accessKey(): string {
    this.checkDate();
    const accessKey = generateAccessKey({
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
  }

  concatImpuestos(): Impuesto[] {
    // Concatenar todos los impuestos de los detalles, creando una copia para evitar referencias
    return this.detalles.flatMap((detalle) =>
      detalle.impuestos.map((impuesto) => {
        const newImpuesto = new Impuesto();
        newImpuesto.tarifa = Number(impuesto.tarifa);
        newImpuesto.codigo = Number(impuesto.codigo);
        newImpuesto.codigoPorcentaje = Number(impuesto.codigoPorcentaje);
        newImpuesto.baseImponible = Number(impuesto.baseImponible);
        newImpuesto.valor = Number(impuesto.valor);
        return newImpuesto;
      }),
    );
  }

  calcTotalConImpuestos(): Impuesto[] {
    const concatImpuesto = this.concatImpuestos();
    // Agrupar los impuestos por `codigoPorcentaje` y sumar sus valores
    return concatImpuesto.reduce((acc: Impuesto[], impuesto) => {
      const impuestoExistente = acc.find(
        (item) => item.codigoPorcentaje === impuesto.codigoPorcentaje,
      );

      if (impuestoExistente) {
        // Si el impuesto ya existe, sumar baseImponible y valor al existente
        impuestoExistente.baseImponible = preciseCalculation(
          Number(impuestoExistente.baseImponible) +
          Number(impuesto.baseImponible)
        );
        impuestoExistente.valor = preciseCalculation(
          Number(impuestoExistente.valor) + Number(impuesto.valor)
        );
      } else {
        // Si no existe, agregar una copia del nuevo impuesto
        const newImpuesto = new Impuesto();
        newImpuesto.tarifa = Number(impuesto.tarifa);
        newImpuesto.codigo = Number(impuesto.codigo);
        newImpuesto.codigoPorcentaje = Number(impuesto.codigoPorcentaje);
        newImpuesto.baseImponible = Number(impuesto.baseImponible);
        newImpuesto.valor = Number(impuesto.valor);
        acc.push(newImpuesto);
      }
      return acc;
    }, []);
  }

  addDetalle(detalle: DetalleBase): void {
    this.detalles.push(detalle);
  }

  checkDate(): void {
    const fechaEmision = this.fechaEmision;
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/20[0-9]{2}$/;

    if (!regex.test(fechaEmision)) {
      throw new Error('Formato de fecha invalido');
    }
  }

  protected generateXml(content: string | ExpandObject) {
    const document = create(content);
    const xml = document.end({
      prettyPrint: true,
      headless: true,
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
  }

  // Método abstracto para que las subclases lo implementen
  generateComprobanteXml(): { invoiceXml: string; accessKey: string } {
    throw new Error('Método no implementado.');
  }
}
