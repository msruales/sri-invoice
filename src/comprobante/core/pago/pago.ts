import { formatNumber } from '../../utils';

export interface IPago {
  /*
   *  01 -> SIN UTILIZACION DEL SISTEMA FINANCIERO
   *  15 -> COMPENSACION DE DEUDAS
   *  16 -> TARJETA DE DEBITO
   *  17 -> DINERO ELECTRONICO
   *  18 -> TARJETA PREPAGO
   *  19 -> TARJETA DE CREDITO
   *  20 -> OTROS CON UTILIZACION DEL SISTEMA FINANCIERO
   *  21 -> ENDOSO DE TITULOS
   */
  formaPago: '01' | '15' | '16' | '17' | '18' | '19' | '20' | '21';
  total: number;
  plazo?: number;
  unidadTiempo?: string;
}

export class Pago {
  private _formaPago: '01' | '15' | '16' | '17' | '18' | '19' | '20' | '21';
  private _total: number;
  private _plazo = 0;
  private _unidadTiempo = 'dias';

  constructor({ formaPago = '01', total, plazo = 0, unidadTiempo = 'dias' }: IPago) {
    this._formaPago = formaPago;
    this._total = total;
    this._plazo = plazo;
    this._unidadTiempo = unidadTiempo;
  }

  get formaPago(): '01' | '15' | '16' | '17' | '18' | '19' | '20' | '21' {
    return this._formaPago;
  }

  get total(): string {
    return formatNumber(this._total);
  }

  get plazo(): string {
    return String(this._plazo);
  }

  get unidadTiempo(): string {
    return this._unidadTiempo;
  }
}
