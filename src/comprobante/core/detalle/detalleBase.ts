import { Impuesto } from '../impuesto/impuesto';
import { arrayImpuestos } from '../data-impuestos';
import { formatNumber, preciseCalculation } from '../../utils';

export interface IDetalleBase {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
}

export class DetalleBase {
  private _descripcion: string;
  private _cantidad: number;
  private _precioUnitario: number;
  private _descuento = 0;
  private _precioTotalSinImpuesto: number | undefined;

  public _impuestos: Impuesto[] = [];

  constructor({
    descripcion,
    cantidad,
    descuento = 0,
    precioUnitario,
  }: IDetalleBase) {
    this._descripcion = descripcion;
    this._cantidad = cantidad;
    this._precioUnitario = precioUnitario;
    this._descuento = descuento;
  }

  get descripcion(): string {
    return this._descripcion;
  }

  get cantidad(): number {
    return this._cantidad;
  }

  get precioUnitario(): string {
    return formatNumber(this._precioUnitario);
  }

  get descuento(): string {
    return formatNumber(this._descuento);
  }

  get impuestos(): Impuesto[] {
    return this._impuestos;
  }

  get precioTotalSinImpuesto(): number {
    // Usar cálculo preciso para evitar errores de precisión decimal
    const subtotal = preciseCalculation(this._precioUnitario * this._cantidad);
    this._precioTotalSinImpuesto = preciseCalculation(subtotal - this._descuento);
    return this._precioTotalSinImpuesto;
  }

  public addImpuesto(
    codigo: number,
    codigoPorcentaje: number,
    tarifa?: number,
  ) {
    if (
      this._impuestos.find(
        (impuesto) =>
          Number(impuesto.codigo) == codigo &&
                    Number(impuesto.codigoPorcentaje) == codigoPorcentaje,
      )
    ) {
      throw new Error('El descuento ya está aplicado');
    }

    const impuesto = arrayImpuestos.find(
      (impuesto) =>
        impuesto.codigo === codigo &&
                impuesto.codigoPorcentaje === codigoPorcentaje,
    );

    if (impuesto) {
      const newImpuesto = new Impuesto();
      newImpuesto.codigo = impuesto.codigo;
      newImpuesto.codigoPorcentaje = impuesto.codigoPorcentaje;
      newImpuesto.tarifa = (tarifa ? tarifa : impuesto.tarifa) / 100;
      const valorImpuesto = preciseCalculation(this.precioTotalSinImpuesto * Number(newImpuesto.tarifa));
      newImpuesto.valor = valorImpuesto;
      newImpuesto.baseImponible = this.precioTotalSinImpuesto;
      this._impuestos = [...this.impuestos, newImpuesto];
    }
    if (!impuesto && tarifa) {
      const newImpuesto = new Impuesto();
      newImpuesto.codigo = codigo;
      newImpuesto.codigoPorcentaje = codigoPorcentaje;
      newImpuesto.tarifa = tarifa / 100;
      const valorImpuestoCustom = preciseCalculation(this.precioTotalSinImpuesto * (tarifa / 100));
      newImpuesto.valor = valorImpuestoCustom;
      newImpuesto.baseImponible = this.precioTotalSinImpuesto;
      this._impuestos = [...this.impuestos, newImpuesto];
    }
  }

  public tieneImpuestoBase(): boolean {
    return Boolean(
      this.impuestos.find(
        (impuesto) =>
          Number(impuesto.codigo) == 2 &&
                    Number(impuesto.codigoPorcentaje) == 0,
      ),
    );
  }
}
