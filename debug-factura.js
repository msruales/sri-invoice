// Script de debugging para identificar diferencias en cálculos de factura
const { Factura, DetalleFactura } = require('./dist');

function debugFactura(facturaData, detallesData, pagosData) {
  console.log('=== DEBUGGING FACTURA ===\n');
  
  try {
    // Crear factura
    const factura = new Factura(facturaData);
    
    // Agregar detalles
    detallesData.forEach((detalle, i) => {
      console.log(`--- DETALLE ${i + 1} ---`);
      console.log(`Descripción: ${detalle.descripcion}`);
      console.log(`Cantidad: ${detalle.cantidad}`);
      console.log(`Precio Unitario: ${detalle.precioUnitario}`);
      console.log(`Descuento: ${detalle.descuento || 0}`);
      
      const detalleFactura = new DetalleFactura(detalle);
      
      // Agregar impuestos si existen
      if (detalle.impuestos) {
        detalle.impuestos.forEach(imp => {
          console.log(`Agregando impuesto: código ${imp.codigo}, codigoPorcentaje ${imp.codigoPorcentaje}, tarifa ${imp.tarifa}`);
          detalleFactura.addImpuesto(imp.codigo, imp.codigoPorcentaje, imp.tarifa);
        });
      }
      
      console.log(`Precio Total Sin Impuesto: ${detalleFactura.precioTotalSinImpuesto}`);
      console.log(`Impuestos aplicados: ${detalleFactura.impuestos.length}`);
      detalleFactura.impuestos.forEach(imp => {
        console.log(`  - Código: ${imp.codigo}, Valor: ${imp.valor}, Base: ${imp.baseImponible}`);
      });
      
      factura.addDetalle(detalleFactura);
      console.log('');
    });
    
    // Agregar pagos
    pagosData.forEach(pago => {
      factura.addPago(pago);
    });
    
    // Mostrar cálculos finales
    console.log('=== CÁLCULOS FINALES ===');
    console.log(`Total Sin Impuestos: ${factura.totalSinImpuestos}`);
    console.log(`Total Descuento: ${factura.totalDescuento}`);
    
    // Desglose de impuestos
    const impuestosCalculados = factura.calcTotalConImpuestos();
    console.log('\n--- IMPUESTOS CALCULADOS ---');
    impuestosCalculados.forEach(imp => {
      console.log(`Código ${imp.codigo}: Base ${imp.baseImponible}, Tarifa ${imp.tarifa}, Valor ${imp.valor}`);
    });
    
    console.log(`\nImporte Total: ${factura.importeTotal}`);
    
    // Mostrar pagos
    console.log('\n--- PAGOS ---');
    const totalPagos = factura.pagos.reduce((acc, pago) => acc + Number(pago.total), 0);
    factura.pagos.forEach((pago, i) => {
      console.log(`Pago ${i + 1}: ${pago.total} (${pago.formaPago})`);
    });
    console.log(`Total Pagos: ${totalPagos}`);
    
    // Verificar diferencia
    const diferencia = Math.abs(Number(factura.importeTotal) - totalPagos);
    console.log(`\n=== VERIFICACIÓN ===`);
    console.log(`Diferencia: ${diferencia.toFixed(6)}`);
    console.log(`Tolerancia: 0.01`);
    console.log(`¿Debería pasar?: ${diferencia <= 0.01 ? 'SÍ' : 'NO'}`);
    
    // Intentar validar
    try {
      factura.checkPago();
      console.log('✅ Validación: PASÓ');
    } catch (error) {
      console.log(`❌ Validación: FALLÓ - ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error al crear factura:', error.message);
  }
}

// Ejemplo de uso (reemplaza con tus datos reales)
const ejemploFactura = {
  infoTributaria: {
    ambiente: "1", // o "2" para producción
    tipoEmision: "1",
    razonSocial: "MI EMPRESA",
    nombreComercial: "MI EMPRESA",
    ruc: "1234567890001",
    claveAcceso: "",
    codDoc: "01",
    estab: "001",
    ptoEmi: "001",
    secuencial: "000000001",
    dirMatriz: "DIRECCION MATRIZ"
  },
  fechaEmision: "11/07/2025",
  razonSocialComprador: "CLIENTE EJEMPLO",
  identificacionComprador: "1234567890",
  direccionComprador: "DIRECCION CLIENTE",
  tipoIdentificacionComprador: "05",
  dirEstablecimiento: "DIRECCION ESTABLECIMIENTO"
};

console.log('=== INSTRUCCIONES DE USO ===');
console.log('1. Reemplaza "ejemploFactura" con los datos reales de tu factura');
console.log('2. Agrega los detalles reales en un array llamado "detalles"');
console.log('3. Agrega los pagos reales en un array llamado "pagos"');
console.log('4. Ejecuta: debugFactura(ejemploFactura, detalles, pagos)');
console.log('\nEjemplo de detalle:');
console.log(`const detalles = [{
  descripcion: "PRODUCTO EJEMPLO",
  cantidad: 1,
  precioUnitario: 100,
  descuento: 0,
  impuestos: [{ codigo: 2, codigoPorcentaje: 2, tarifa: 12 }] // IVA 12%
}];`);
console.log('\nEjemplo de pago:');
console.log(`const pagos = [{ formaPago: "20", total: 112.00 }];`);

module.exports = { debugFactura };
