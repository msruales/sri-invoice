export type TaxDetail = {
  codigo: string;
  codigoPorcentaje: string;
  tarifa: string;
  baseImponibleReembolso: string;
  impuestoReembolso: string;
};

export type TaxDetails = {
  detalleImpuesto: TaxDetail[];
};

export type ReimbursementCompensation = {
  codigo: string;
  tarifa: string;
  valor: string;
};

export type ReimbursementCompensations = {
  compensacionesReembolso: ReimbursementCompensation[];
};

export type ReimbursementDetail = {
  tipoIdentificacionProveedorReembolso: string;
  identificacionProveedorReembolso: string;
  codPaisPagoProveedorReembolso: string;
  tipoProveedorReembolso: string;
  codDocReembolso: string;
  estabDocReembolso: string;
  ptoEmiDocReembolso: string;
  secuencialDocReembolso: string;
  fechaEmisionDocReembolso: string;
  numeroautorizacionDocReemb: string;
  detalleImpuestos: TaxDetails;
  compensacionesReembolso: ReimbursementCompensations;
};

export type Reimbursements = {
  reembolsoDetalle: ReimbursementDetail[];
};
