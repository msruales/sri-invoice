import {
    DetalleFactura,
    Factura,
    InfoTributaria,
    Pago
} from "./comprobante/core";
import {NotaCredito} from "./comprobante/core/nota-credito/notaCredito";
import {documentAuthorization, documentReception, sign, signUanataca, signLazzate} from "./comprobante/services";

export {
    Factura,
    NotaCredito,
    documentAuthorization,
    documentReception,
    sign,
    signUanataca,
    signLazzate,
    DetalleFactura,
    InfoTributaria,
    Pago,
}
