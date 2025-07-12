import { AdditionalInfo } from './additionalInfo';
import { DetailsNoteCredit } from './details';
import { TaxInfo } from './taxInfo';
import { NoteCreditInfo } from './noteCreditInfo';

export type NoteCredit = {
    notaCredito: {
        '@id': string;
        '@version': string;
        infoTributaria: TaxInfo;
        infoNotaCredito: NoteCreditInfo;
        detalles: DetailsNoteCredit;
        maquinaFiscal?: {
            marca: string;
            modelo: string;
            serie: string;
        };
        infoAdicional?: AdditionalInfo | null;
    };
};
