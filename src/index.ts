import {
    DetalleFactura,
    Factura,
    InfoTributaria,
    Pago
} from "./comprobante/core";
import {NotaCredito} from "./comprobante/core/nota-credito/notaCredito";
import {documentAuthorization, documentReception, sign, signUanataca} from "./comprobante/services";

export {
    Factura,
    NotaCredito,
    documentAuthorization,
    documentReception,
    sign,
    signUanataca,
    DetalleFactura,
    InfoTributaria,
    Pago,
}
