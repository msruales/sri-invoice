import { IDetalleBase, DetalleBase } from './detalleBase';

export interface IDetalleFactura extends IDetalleBase {
    codigoInterno: string;
    codigoAdicional?: string;
}

export class DetalleNotaCredito extends DetalleBase {
  private _codigoInterno: string;
  private _codigoAdicional?: string;

  constructor({
    codigoInterno,
    codigoAdicional,
    descripcion,
    cantidad,
    descuento = 0,
    precioUnitario,
  }: IDetalleFactura) {
    super({ descripcion, cantidad, descuento, precioUnitario });
    this._codigoInterno = codigoInterno;
    this._codigoAdicional = codigoAdicional;
  }

  get codigoInterno(): string {
    return this._codigoInterno;
  }

  get codigoAdicional() {
    return this._codigoAdicional;
  }
}
