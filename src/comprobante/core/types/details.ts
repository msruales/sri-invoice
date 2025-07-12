export type AdditionalDetail = {
  '@nombre': string;
  '@valor': string;
};

export type AdditionalDetails = {
  detAdicional: AdditionalDetail[];
};

export type Tax = {
  codigo: string;
  codigoPorcentaje: string;
  tarifa: string;
  baseImponible: string;
  valor: string;
};

export type Taxes = {
  impuesto: Tax[];
};

export type DetailInvoice = {
  codigoPrincipal: string;
  codigoAuxiliar?: string;
  descripcion: string;
  unidadMedida?: string;
  cantidad: number;
  precioUnitario: string;
  precioSinSubsidio?: string;
  descuento: string;
  precioTotalSinImpuesto: string;
  detallesAdicionales?: AdditionalDetails;
  impuestos: Taxes;
};

export type DetailNoteCredit = {
  codigoInterno: string;
  codigoAdicional?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: string;
  descuento: string;
  precioTotalSinImpuesto: string;
  detallesAdicionales?: AdditionalDetails;
  impuestos: Taxes;
};

export type DetailsInvoice = {
  detalle: DetailInvoice[];
};
export type DetailsNoteCredit = {
  detalle: DetailNoteCredit[];
};
