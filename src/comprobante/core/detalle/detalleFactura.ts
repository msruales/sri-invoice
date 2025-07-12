import { IDetalleBase, DetalleBase } from './detalleBase';

export interface IDetalleFactura extends IDetalleBase {
    codigoPrincipal: string;
    codigoAuxiliar?: string;
}

export class DetalleFactura extends DetalleBase {
  private _codigoPrincipal: string;
  private _codigoAuxiliar?: string;

  constructor({
    codigoPrincipal,
    codigoAuxiliar,
    descripcion,
    cantidad,
    descuento = 0,
    precioUnitario,
  }: IDetalleFactura) {
    super({ descripcion, cantidad, descuento, precioUnitario });
    this._codigoPrincipal = codigoPrincipal;
    this._codigoAuxiliar = codigoAuxiliar;
  }

  get codigoPrincipal(): string {
    return this._codigoPrincipal;
  }

  get codigoAuxiliar() {
    return this._codigoAuxiliar;
  }
}
