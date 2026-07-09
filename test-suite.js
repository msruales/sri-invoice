// Suite completa de tests para verificar funcionamiento
const { preciseCalculation, formatNumber } = require('./dist/comprobante/utils/formatNumber');
const { Factura } = require('./dist/comprobante/core/factura/factura');
const { NotaCredito } = require('./dist/comprobante/core/nota-credito/notaCredito');
const { DetalleFactura } = require('./dist/comprobante/core/detalle/detalleFactura');
const { DetalleNotaCredito } = require('./dist/comprobante/core/detalle/detalleNotaCredito');
const { Pago } = require('./dist/comprobante/core/pago/pago');

console.log('🧪 === SUITE DE TESTS COMPLETA ===\n');

let testsPassados = 0;
let testsTotales = 0;

function test(nombre, callback) {
  testsTotales++;
  console.log(`🔍 TEST ${testsTotales}: ${nombre}`);
  try {
    callback();
    console.log(`✅ PASÓ\n`);
    testsPassados++;
  } catch (error) {
    console.log(`❌ FALLÓ: ${error.message}\n`);
  }
}

// ========================================
// TEST 1: Función de precisión decimal
// ========================================
test('Función preciseCalculation maneja decimales correctamente', () => {
  const resultado1 = preciseCalculation(0.1 + 0.2);
  if (resultado1 !== 0.3) {
    throw new Error(`Esperado 0.3, obtenido ${resultado1}`);
  }
  
  const resultado2 = preciseCalculation(1.25 * 128);
  if (resultado2 !== 160) {
    throw new Error(`Esperado 160, obtenido ${resultado2}`);
  }
  
  const resultado3 = preciseCalculation(0.7 * 120);
  if (resultado3 !== 84) {
    throw new Error(`Esperado 84, obtenido ${resultado3}`);
  }
});

// ========================================
// TEST 2: Función formatNumber
// ========================================
test('Función formatNumber formatea correctamente', () => {
  const resultado1 = formatNumber(123.456789);
  if (resultado1 !== '123.46') {
    throw new Error(`Esperado '123.46', obtenido '${resultado1}'`);
  }
  
  const resultado2 = formatNumber(0.1 + 0.2);
  if (resultado2 !== '0.30') {
    throw new Error(`Esperado '0.30', obtenido '${resultado2}'`);
  }
});

// ========================================
// TEST 3: Detalle de factura - cálculos básicos
// ========================================
test('DetalleFactura calcula precios correctamente', () => {
  const detalle = new DetalleFactura({
    descripcion: 'Producto Test',
    cantidad: 10,
    precioUnitario: 1.25,
    descuento: 2.5,
    codigoPrincipal: 'TEST001'
  });
  
  const esperado = preciseCalculation(10 * 1.25 - 2.5); // 10.0
  if (Number(detalle.precioTotalSinImpuesto) !== esperado) {
    throw new Error(`Esperado ${esperado}, obtenido ${detalle.precioTotalSinImpuesto}`);
  }
});

// ========================================
// TEST 4: Detalle con impuestos
// ========================================
test('DetalleFactura calcula impuestos correctamente', () => {
  const detalle = new DetalleFactura({
    descripcion: 'Producto con IVA',
    cantidad: 5,
    precioUnitario: 2.0,
    descuento: 0,
    codigoPrincipal: 'IVA001'
  });
  
  detalle.addImpuesto(2, 3, 15); // IVA 15%
  
  const baseEsperada = 10.0; // 5 * 2.0 - 0
  const ivaEsperado = preciseCalculation(baseEsperada * 0.15); // 1.5
  
  if (Number(detalle.precioTotalSinImpuesto) !== baseEsperada) {
    throw new Error(`Base esperada ${baseEsperada}, obtenida ${detalle.precioTotalSinImpuesto}`);
  }
  
  if (detalle.impuestos.length !== 1) {
    throw new Error(`Esperado 1 impuesto, obtenidos ${detalle.impuestos.length}`);
  }
  
  if (Number(detalle.impuestos[0].valor) !== ivaEsperado) {
    throw new Error(`IVA esperado ${ivaEsperado}, obtenido ${detalle.impuestos[0].valor}`);
  }
});

// ========================================
// TEST 5: Factura completa sin errores
// ========================================
test('Factura completa se calcula sin errores de precisión', () => {
  const factura = new Factura({
    infoTributaria: {
      ambiente: 1,
      tipoEmision: 1,
      razonSocial: 'Test Company',
      ruc: '1234567890001',
      dirMatriz: 'Dirección Test',
      codEstablecimiento: '001',
      codPtoEmision: '001',
      secuencial: '000000001'
    },
    fechaEmision: '01/01/2024',
    razonSocialComprador: 'Cliente Test',
    identificacionComprador: '1234567890',
    direccionComprador: 'Dirección',
    tipoIdentificacionComprador: '05'
  });
  
  // Agregar detalle
  const detalle = new DetalleFactura({
    descripcion: 'Producto Test',
    cantidad: 8,
    precioUnitario: 1.25,
    descuento: 0.50,
    codigoPrincipal: 'TEST'
  });
  factura.addDetalle(detalle);
  
  // Agregar pago exacto
  const totalEsperado = Number(factura.importeTotal);
  factura.addPago({ total: totalEsperado, formaPago: '01' });
  
  // Verificar que no lanza error
  factura.checkPago(); // Si no lanza error, el test pasa
});

// ========================================
// TEST 6: Tolerancia en checkPago
// ========================================
test('checkPago acepta diferencias dentro de tolerancia', () => {
  const factura = new Factura({
    infoTributaria: {
      ambiente: 1,
      tipoEmision: 1,
      razonSocial: 'Test Company',
      ruc: '1234567890001',
      dirMatriz: 'Dirección Test',
      codEstablecimiento: '001',
      codPtoEmision: '001',
      secuencial: '000000001'
    },
    fechaEmision: '01/01/2024',
    razonSocialComprador: 'Cliente Test',
    identificacionComprador: '1234567890',
    direccionComprador: 'Dirección',
    tipoIdentificacionComprador: '05'
  });
  
  const detalle = new DetalleFactura({
    descripcion: 'Producto',
    cantidad: 1,
    precioUnitario: 10.0,
    descuento: 0,
    codigoPrincipal: 'TOL001'
  });
  factura.addDetalle(detalle);
  
  // Pago con diferencia mínima (dentro de tolerancia)
  const totalCalculado = Number(factura.importeTotal);
  factura.addPago({ total: totalCalculado - 0.005, formaPago: '01' }); // 0.005 < 0.01
  
  factura.checkPago(); // No debería lanzar error
});

// ========================================
// TEST 6.1: Límite exacto de tolerancia
// ========================================
test('checkPago acepta diferencia exacta de 0.01', () => {
  const factura = new Factura({
    infoTributaria: {
      ambiente: 1,
      tipoEmision: 1,
      razonSocial: 'Test Company',
      ruc: '1234567890001',
      dirMatriz: 'Dirección Test',
      codEstablecimiento: '001',
      codPtoEmision: '001',
      secuencial: '000000001'
    },
    fechaEmision: '01/01/2024',
    razonSocialComprador: 'Cliente Test',
    identificacionComprador: '1234567890',
    direccionComprador: 'Dirección',
    tipoIdentificacionComprador: '05'
  });

  const detalle = new DetalleFactura({
    descripcion: 'Producto',
    cantidad: 1,
    precioUnitario: 10.0,
    descuento: 0,
    codigoPrincipal: 'TOL002'
  });
  factura.addDetalle(detalle);

  const totalCalculado = Number(factura.importeTotal);
  factura.addPago({ total: totalCalculado - 0.01, formaPago: '01' });

  factura.checkPago(); // No debería lanzar error
});

// ========================================
// TEST 7: checkPago rechaza diferencias grandes
// ========================================
test('checkPago rechaza diferencias mayores a tolerancia', () => {
  const factura = new Factura({
    infoTributaria: {
      ambiente: 1,
      tipoEmision: 1,
      razonSocial: 'Test Company',
      ruc: '1234567890001',
      dirMatriz: 'Dirección Test',
      codEstablecimiento: '001',
      codPtoEmision: '001',
      secuencial: '000000001'
    },
    fechaEmision: '01/01/2024',
    razonSocialComprador: 'Cliente Test',
    identificacionComprador: '1234567890',
    direccionComprador: 'Dirección',
    tipoIdentificacionComprador: '05'
  });
  
  const detalle = new DetalleFactura({
    descripcion: 'Producto',
    cantidad: 1,
    precioUnitario: 10.0,
    descuento: 0,
    codigoPrincipal: 'ERR001'
  });
  factura.addDetalle(detalle);
  
  // Pago con diferencia grande (fuera de tolerancia)
  const totalCalculado = Number(factura.importeTotal);
  factura.addPago({ total: totalCalculado - 0.05, formaPago: '01' }); // 0.05 > 0.01
  
  let errorLanzado = false;
  try {
    factura.checkPago();
  } catch (error) {
    errorLanzado = true;
    if (!error.message.includes('no coincide')) {
      throw new Error(`Error inesperado: ${error.message}`);
    }
  }
  
  if (!errorLanzado) {
    throw new Error('Debería haber lanzado error por diferencia mayor a tolerancia');
  }
});

// ========================================
// TEST 8: Factura completa CON IVA - Caso realista
// ========================================
test('Factura completa con IVA calcula correctamente totales', () => {
  const factura = new Factura({
    infoTributaria: {
      ambiente: 1,
      tipoEmision: 1,
      razonSocial: 'Empresa Test S.A.',
      ruc: '1234567890001',
      dirMatriz: 'Av. Principal 123',
      codEstablecimiento: '001',
      codPtoEmision: '001',
      secuencial: '000000001'
    },
    fechaEmision: '12/01/2024',
    razonSocialComprador: 'Cliente Premium',
    identificacionComprador: '0987654321',
    direccionComprador: 'Calle Secundaria 456',
    tipoIdentificacionComprador: '05'
  });
  
  // Producto 1: Con IVA 15%
  const detalle1 = new DetalleFactura({
    descripcion: 'Laptop HP Pavilion',
    cantidad: 2,
    precioUnitario: 750.00,
    descuento: 50.00, // Descuento total
    codigoPrincipal: 'LAP001'
  });
  detalle1.addImpuesto(2, 3, 15); // IVA 15%
  factura.addDetalle(detalle1);
  
  // Producto 2: Con IVA 15%
  const detalle2 = new DetalleFactura({
    descripcion: 'Mouse Inalámbrico',
    cantidad: 3,
    precioUnitario: 25.99,
    descuento: 2.97, // 3 * 0.99 descuento
    codigoPrincipal: 'MOU001'
  });
  detalle2.addImpuesto(2, 3, 15); // IVA 15%
  factura.addDetalle(detalle2);
  
  // Verificar cálculos paso a paso
  // Detalle 1: (2 * 750.00) - 50.00 = 1450.00 base
  // IVA Detalle 1: 1450.00 * 0.15 = 217.50
  // Detalle 2: (3 * 25.99) - 2.97 = 75.00 base
  // IVA Detalle 2: 75.00 * 0.15 = 11.25
  
  const baseEsperada1 = preciseCalculation(2 * 750.00 - 50.00); // 1450.00
  const ivaEsperado1 = preciseCalculation(baseEsperada1 * 0.15); // 217.50
  
  const baseEsperada2 = preciseCalculation(3 * 25.99 - 2.97); // 75.00
  const ivaEsperado2 = preciseCalculation(baseEsperada2 * 0.15); // 11.25
  
  const totalSinImpuestosEsperado = baseEsperada1 + baseEsperada2; // 1525.00
  const totalIvaEsperado = ivaEsperado1 + ivaEsperado2; // 228.75
  const importeTotalEsperado = totalSinImpuestosEsperado + totalIvaEsperado; // 1753.75
  
  // Verificar totales de la factura
  if (Number(factura.totalSinImpuestos) !== totalSinImpuestosEsperado) {
    throw new Error(`Total sin impuestos esperado ${totalSinImpuestosEsperado}, obtenido ${factura.totalSinImpuestos}`);
  }
  
  if (Number(factura.importeTotal) !== importeTotalEsperado) {
    throw new Error(`Importe total esperado ${importeTotalEsperado}, obtenido ${factura.importeTotal}`);
  }
  
  // Agregar pago exacto
  factura.addPago({ total: Number(factura.importeTotal), formaPago: '20' });
  
  // Verificar que acepta el pago
  factura.checkPago(); // Si no lanza error, el test pasa
  
  console.log(`✅ Factura con IVA calculada correctamente:`);
  console.log(`  - Base imponible: $${factura.totalSinImpuestos}`);
  console.log(`  - IVA total: $${preciseCalculation(Number(factura.importeTotal) - Number(factura.totalSinImpuestos))}`);
  console.log(`  - Total final: $${factura.importeTotal}`);
});

// ========================================
// TEST 9: Nota de crédito usa la misma base de cálculo que factura
// ========================================
test('NotaCredito calcula valorModificacion igual que factura con descuentos e IVA', () => {
  const infoTributaria = {
    ambiente: 1,
    tipoEmision: 1,
    razonSocial: 'Empresa Test S.A.',
    ruc: '1234567890001',
    dirMatriz: 'Av. Principal 123',
    codEstablecimiento: '001',
    codPtoEmision: '001',
    secuencial: '000000002'
  };

  const factura = new Factura({
    infoTributaria: {...infoTributaria, secuencial: '000000001'},
    fechaEmision: '12/01/2024',
    razonSocialComprador: 'Cliente Premium',
    identificacionComprador: '0987654321',
    direccionComprador: 'Calle Secundaria 456',
    tipoIdentificacionComprador: '05'
  });

  const notaCredito = new NotaCredito({
    infoTributaria,
    fechaEmision: '12/01/2024',
    dirEstablecimiento: 'Sucursal Centro',
    razonSocialComprador: 'Cliente Premium',
    identificacionComprador: '0987654321',
    tipoIdentificacionComprador: '05',
    codDocModificado: '01',
    numDocModificado: '001-001-000000001',
    fechaEmisionDocSustento: '12/01/2024',
    motivo: 'Anulación total'
  });

  const facturaDetalle = new DetalleFactura({
    descripcion: 'Producto con descuento',
    cantidad: 3,
    precioUnitario: 25.99,
    descuento: 2.97,
    codigoPrincipal: 'MOU001'
  });
  facturaDetalle.addImpuesto(2, 3, 15);
  factura.addDetalle(facturaDetalle);

  const notaDetalle = new DetalleNotaCredito({
    descripcion: 'Producto con descuento',
    cantidad: 3,
    precioUnitario: 25.99,
    descuento: 2.97,
    codigoInterno: 'MOU001'
  });
  notaDetalle.addImpuesto(2, 3, 15);
  notaCredito.addDetalle(notaDetalle);

  const baseEsperada = preciseCalculation(3 * 25.99 - 2.97); // 75.00
  const ivaEsperado = preciseCalculation(baseEsperada * 0.15); // 11.25
  const totalEsperado = preciseCalculation(baseEsperada + ivaEsperado); // 86.25

  if (Number(notaCredito.totalSinImpuestos) !== baseEsperada) {
    throw new Error(`Total sin impuestos esperado ${baseEsperada}, obtenido ${notaCredito.totalSinImpuestos}`);
  }

  if (Number(factura.importeTotal) !== totalEsperado) {
    throw new Error(`Importe total factura esperado ${totalEsperado}, obtenido ${factura.importeTotal}`);
  }

  if (Number(notaCredito.valorModificacion) !== Number(factura.importeTotal)) {
    throw new Error(`Nota de crédito ${notaCredito.valorModificacion} no coincide con factura ${factura.importeTotal}`);
  }
});

// ========================================
// RESUMEN FINAL
// ========================================
console.log('📊 === RESUMEN DE TESTS ===');
console.log(`Tests ejecutados: ${testsTotales}`);
console.log(`Tests pasados: ✅ ${testsPassados}`);
console.log(`Tests fallidos: ❌ ${testsTotales - testsPassados}`);
console.log(`Porcentaje éxito: ${Math.round((testsPassados / testsTotales) * 100)}%`);

if (testsPassados === testsTotales) {
  console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
  console.log('✅ El sistema está funcionando correctamente');
  console.log('✅ La precisión decimal está implementada');
  console.log('✅ La tolerancia funciona como esperado');
  console.log('✅ Seguro para hacer cambios futuros');
} else {
  console.log('\n⚠️  ALGUNOS TESTS FALLARON');
  console.log('❌ Revisar implementación antes de hacer cambios');
  process.exit(1);
}
