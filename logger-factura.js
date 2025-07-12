// Logger para capturar datos de facturación y debugging
const fs = require('fs');
const path = require('path');

class FacturaLogger {
  constructor() {
    this.logsDir = path.join(__dirname, 'logs');
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Registra los datos que vienen del frontend antes de procesar
   */
  logIncomingData(requestData, source = 'frontend') {
    const timestamp = new Date().toISOString();
    const filename = `incoming-${timestamp.replace(/[:.-]/g, '')}.json`;
    
    const logEntry = {
      timestamp,
      source,
      requestId: this.generateRequestId(),
      data: requestData,
      metadata: {
        userAgent: process.env.USER_AGENT || 'unknown',
        ip: process.env.CLIENT_IP || 'unknown'
      }
    };

    this.writeLog(filename, logEntry);
    console.log(`📥 [LOGGER] Datos registrados: ${filename}`);
    return logEntry.requestId;
  }

  /**
   * Registra el resultado del procesamiento y cualquier error
   */
  logProcessingResult(requestId, result, error = null) {
    const timestamp = new Date().toISOString();
    const filename = `result-${requestId}-${timestamp.replace(/[:.-]/g, '')}.json`;
    
    const logEntry = {
      timestamp,
      requestId,
      success: !error,
      error: error ? {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      } : null,
      result: result || null
    };

    this.writeLog(filename, logEntry);
    console.log(`📤 [LOGGER] Resultado registrado: ${filename}`);
  }

  /**
   * Log específico para errores de diferencias de pago
   */
  logPaymentDiscrepancy(requestId, calculated, received, details) {
    const timestamp = new Date().toISOString();
    const filename = `payment-discrepancy-${requestId}-${timestamp.replace(/[:.-]/g, '')}.json`;
    
    const logEntry = {
      timestamp,
      requestId,
      type: 'PAYMENT_DISCREPANCY',
      discrepancy: {
        calculatedTotal: calculated,
        receivedPayment: received,
        difference: Math.abs(calculated - received),
        tolerance: 0.01,
        shouldPass: Math.abs(calculated - received) <= 0.01
      },
      details: details || {}
    };

    this.writeLog(filename, logEntry);
    console.log(`⚠️  [LOGGER] Discrepancia registrada: ${filename}`);
    console.log(`   Calculado: ${calculated}, Recibido: ${received}, Diferencia: ${Math.abs(calculated - received).toFixed(6)}`);
  }

  /**
   * Crear un debug completo de una factura
   */
  async debugFactura(requestId, facturaData, detallesData, pagosData) {
    const timestamp = new Date().toISOString();
    const filename = `debug-${requestId}-${timestamp.replace(/[:.-]/g, '')}.json`;
    
    console.log(`🔍 [DEBUG] Iniciando debugging para request ${requestId}`);
    
    try {
      // Importar las clases necesarias
      const { Factura, DetalleFactura } = require('./dist');
      
      const debugInfo = {
        timestamp,
        requestId,
        input: {
          factura: facturaData,
          detalles: detallesData,
          pagos: pagosData
        },
        processing: {
          steps: [],
          calculations: {}
        }
      };

      // Crear factura
      const factura = new Factura(facturaData);
      debugInfo.processing.steps.push('Factura creada');

      // Procesar cada detalle
      detallesData.forEach((detalle, i) => {
        const stepInfo = {
          step: `detalle_${i + 1}`,
          input: detalle,
          calculations: {}
        };

        const detalleFactura = new DetalleFactura(detalle);
        
        stepInfo.calculations.precioTotalSinImpuesto = detalleFactura.precioTotalSinImpuesto;
        
        // Agregar impuestos
        if (detalle.impuestos) {
          detalle.impuestos.forEach(imp => {
            detalleFactura.addImpuesto(imp.codigo, imp.codigoPorcentaje, imp.tarifa);
          });
        }
        
        stepInfo.calculations.impuestos = detalleFactura.impuestos.map(imp => ({
          codigo: imp.codigo,
          valor: imp.valor,
          baseImponible: imp.baseImponible,
          tarifa: imp.tarifa
        }));

        factura.addDetalle(detalleFactura);
        debugInfo.processing.steps.push(stepInfo);
      });

      // Agregar pagos
      pagosData.forEach(pago => {
        factura.addPago(pago);
      });

      // Cálculos finales
      debugInfo.processing.calculations = {
        totalSinImpuestos: factura.totalSinImpuestos,
        totalDescuento: factura.totalDescuento,
        impuestosCalculados: factura.calcTotalConImpuestos().map(imp => ({
          codigo: imp.codigo,
          baseImponible: imp.baseImponible,
          tarifa: imp.tarifa,
          valor: imp.valor
        })),
        importeTotal: factura.importeTotal,
        totalPagos: factura.pagos.reduce((acc, pago) => acc + Number(pago.total), 0),
        diferencia: Math.abs(Number(factura.importeTotal) - factura.pagos.reduce((acc, pago) => acc + Number(pago.total), 0))
      };

      // Intentar validación
      try {
        factura.checkPago();
        debugInfo.validation = { success: true };
        console.log(`✅ [DEBUG] Validación exitosa para request ${requestId}`);
      } catch (error) {
        debugInfo.validation = { 
          success: false, 
          error: error.message 
        };
        console.log(`❌ [DEBUG] Validación falló para request ${requestId}: ${error.message}`);
        
        // Log de discrepancia
        this.logPaymentDiscrepancy(
          requestId,
          Number(factura.importeTotal),
          factura.pagos.reduce((acc, pago) => acc + Number(pago.total), 0),
          debugInfo.processing.calculations
        );
      }

      this.writeLog(filename, debugInfo);
      console.log(`🔍 [DEBUG] Debug completo guardado: ${filename}`);
      
      return debugInfo;

    } catch (error) {
      const errorLog = {
        timestamp,
        requestId,
        error: {
          message: error.message,
          stack: error.stack
        }
      };
      
      this.writeLog(`debug-error-${requestId}-${timestamp.replace(/[:.-]/g, '')}.json`, errorLog);
      console.error(`💥 [DEBUG] Error durante debugging: ${error.message}`);
      throw error;
    }
  }

  generateRequestId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  writeLog(filename, data) {
    const filepath = path.join(this.logsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  /**
   * Lista todos los logs disponibles
   */
  listLogs() {
    if (!fs.existsSync(this.logsDir)) {
      return [];
    }
    return fs.readdirSync(this.logsDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => fs.statSync(path.join(this.logsDir, b)).mtime - fs.statSync(path.join(this.logsDir, a)).mtime);
  }

  /**
   * Lee un log específico
   */
  readLog(filename) {
    const filepath = path.join(this.logsDir, filename);
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
    return null;
  }
}

module.exports = { FacturaLogger };

// Ejemplo de uso directo
if (require.main === module) {
  console.log('=== FACTURA LOGGER ===');
  console.log('Para usar el logger en tu aplicación:');
  console.log('');
  console.log('const { FacturaLogger } = require("./logger-factura");');
  console.log('const logger = new FacturaLogger();');
  console.log('');
  console.log('// En tu endpoint de creación de factura:');
  console.log('const requestId = logger.logIncomingData(req.body);');
  console.log('');
  console.log('// Para debugging completo:');
  console.log('await logger.debugFactura(requestId, facturaData, detalles, pagos);');
}
