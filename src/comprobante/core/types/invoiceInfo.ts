export type InvoiceInfo = {
    fechaEmision: string;
    dirEstablecimiento: string | undefined;
    contribuyenteEspecial?: number | null;
    obligadoContabilidad: 'SI' | 'NO';
    comercioExterior?: string;
    incoTermFactura?: string;
    lugarIncoTerm?: string;
    paisOrigen?: string;
    puertoEmbarque?: string;
    puertoDestino?: string;
    paisDestino?: string;
    paisAdquisicion?: string;
    /*
    RUC 04
    CÉDULA 05
    PASAPORTE 06
    VENTA A CONSUMIDOR FINAL* 07
    IDENTIFICACIÓN DEL EXTERIOR* 08
    */
    tipoIdentificacionComprador: '04' | '05' | '06' | '07' | '08';
    guiaRemision?: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador: string;
    totalSinImpuestos: string;
    totalSubsidio?: string;
    incoTermTotalSinImpuestos?: string;
    totalDescuento: string;
    codDocReembolso?: string;
    totalComprobantesReembolso?: string;
    totalBaseImponibleReembolso?: string;
    totalImpuestoReembolso?: string;
    totalConImpuestos: TotalWithTaxes;
    compensaciones?: Compensations;
    propina?: string;
    fleteInternacional?: string;
    seguroInternacional?: string;
    gastosAduaneros?: string;
    gastosTransporteOtros?: string;
    importeTotal: string;
    moneda: string;
    placa?: string;
    pagos: Payments;
    valorRetIva?: string;
    valorRetRenta?: string;
};

export type TotalWithTax = {
    /*
    IVA 2
    ICE 3
    IRBPNR 5
    */
    codigo: string;
    /*
    IVA
    0% 0
    12% 2
    14% 3
    No Objeto de Impuesto 6
    Exento de IVA 7
    IVA diferenciado4 8

    ICE - Ver tabla 18 de la ficha tecnica de comprobantes electronicos
    */
    codigoPorcentaje: string;
    // descuentoAdicional: string;
    baseImponible: string;
    tarifa?: string;
    valor: string;
    valorDevolucionIva?: string;
};

export type TotalWithTaxes = {
    totalImpuesto: TotalWithTax[];
};

export type Compensation = {
    codigo: string;
    tarifa: string;
    valor: string;
};

export type Compensations = {
    compensacion: Compensation[];
};

export type Payment = {
    formaPago: string;
    total: string;
    plazo: string;
    unidadTiempo: string;
};

export type Payments = {
    pago: Payment[];
};
