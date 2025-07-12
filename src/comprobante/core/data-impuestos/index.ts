import jsonImpuestos from './impuestos.json';

interface Impuesto {
  codigo: number;
  codigoPorcentaje: number;
  tarifa: number;
  descripción: string;
}

export const arrayImpuestos: Impuesto[] = jsonImpuestos;
