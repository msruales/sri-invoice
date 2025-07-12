import { formatNumber } from '../../utils';

export class Impuesto {
  // @ts-ignore
  private _codigo: number;
  // @ts-ignore
  private _codigoPorcentaje: number;
  // @ts-ignore
  private _tarifa: number;
  // @ts-ignore
  private _baseImponible: number;
  // @ts-ignore
  private _valor: number;

  get codigo(): string {
    return this._codigo.toString();
  }

  set codigo(value: string | number) {
    this._codigo = Number(value);
  }

  get codigoPorcentaje(): string {
    return this._codigoPorcentaje.toString();
  }

  set codigoPorcentaje(value: string | number) {
    this._codigoPorcentaje = Number(value);
  }

  get tarifa(): string {
    return this._tarifa.toString();
  }

  set tarifa(value: string | number) {
    this._tarifa = Number(value);
  }

  get baseImponible(): string {
    return formatNumber(this._baseImponible);
  }

  set baseImponible(value: string | number) {
    this._baseImponible = Number(value);
  }

  get valor(): string {
    return formatNumber(this._valor);
  }

  set valor(value: string | number) {
    this._valor = Number(value);
  }
}
