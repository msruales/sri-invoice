export type Arrival = {
  motivoTraslado: string;
  docAduaneroUnico: string;
  codEstabDestino: string;
  ruta: string;
};

export type Arrivals = {
  destino: Arrival[];
};

export type RemisionGuideSustitutiveInfo = {
  dirPartida: string;
  dirDestinatario: string;
  fechaIniTransporte: string;
  fechaFinTransporte: string;
  razonSocialTransportista: string;
  tipoIdentificacionTransportista: string;
  rucTransportista: string;
  placa: string;
  destinos: Arrivals;
};
