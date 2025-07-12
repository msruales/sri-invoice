# Proyecto de Facturación Electrónica

Este proyecto implementa un sistema de facturación electrónica utilizando TypeScript. Proporciona clases y métodos para generar facturas electrónicas, gestionar pagos y calcular impuestos.

## Características

- Generación de facturas electrónicas en formato XML.
- Gestión de pagos y validación de importes.
- Cálculo de impuestos y descuentos con **precisión decimal**.
- Formateo de números y manejo de datos tributarios.
- **Tolerancia automática** para diferencias menores de redondeo (≤0.01).
- **Sistema de logging** integrado para debugging.
- **Suite de tests automatizados** para garantizar calidad.

## Instalación

Para instalar las dependencias del proyecto, ejecuta:

```bash
npm install
```

## Ejemplo

```


import { Factura } from './src/comprobante/core/factura/factura';
import { Pago, DetalleFactura } from './src/comprobante/core';

// Crear una nueva factura
const nuevaFactura = new Factura({
infoTributaria: { /* datos tributarios */ },
fechaEmision: '2023-10-01',
direccionComprador: '123 Calle Principal',
razonSocialComprador: 'Empresa XYZ',
identificacionComprador: '1234567890',
correoComprador: 'cliente@empresa.com',
telefonoComprador: '123456789',
observaciones: 'Ninguna',
propina: 0.0,
moneda: 'DOLAR',
dirEstablecimiento: 'Sucursal 1',
tipoIdentificacionComprador: '05',
obligadoContabilidad: false,
});

// Agregar detalles a la factura
nuevaFactura.detalles.push(new DetalleFactura({
codigoPrincipal: '001',
descripcion: 'Producto A',
cantidad: 2,
precioUnitario: 10.0,
descuento: 0.0,
impuestos: [/* datos de impuestos */],
}));

// Agregar un pago
nuevaFactura.addPago(new Pago({
formaPago: '01',
total: 20.0,
plazo: '30',
unidadTiempo: 'dias',
}));

// Generar el XML de la factura
const { invoiceXml, accessKey } = nuevaFactura.generateComprobanteXml();
console.log(invoiceXml);
console.log(accessKey);
```

## Desarrollo y Testing

### Compilar el proyecto
```bash
npm run build
```

### Ejecutar tests
```bash
npm test
```

### Herramientas de desarrollo incluidas

- **`test-suite.js`**: Suite completa de tests automatizados
- **`debug-factura.js`**: Herramienta para debugging de facturas específicas
- **`logger-factura.js`**: Sistema de logging para capturar y analizar errores

### Funcionalidades de precisión

- **Cálculos con precisión decimal**: Evita errores de punto flotante
- **Tolerancia automática**: Acepta diferencias ≤0.01 centavos por redondeo
- **Validación robusta**: Rechaza diferencias significativas (>0.01)
- **Logging detallado**: Captura datos de entrada y cálculos paso a paso
