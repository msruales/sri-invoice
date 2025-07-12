export function formatNumber(baseImponible: number): string {
  // Redondear a 2 decimales para evitar problemas de precisión
  const rounded = Math.round((baseImponible + Number.EPSILON) * 100) / 100;
  return rounded.toFixed(2).replace(',', '.');
}

// Función auxiliar para cálculos precisos
export function preciseCalculation(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
