/**
 * @NAPIVersion 2.x
 * @NScriptType CLientScript
 */

import {EntryPoints} from "N/types"
import * as MSR from '../models/jtc_gerar_pdf_file_ue_MSR'



export const gerarArquivo = (idTransaction) => {
    try {
        MSR.gerarArquivo(idTransaction)
    } catch (e) {
        console.log('jtc_func_pdf_files_CS.gerarArquivo', e)
    }
}


export const pageInit: EntryPoints.Client.pageInit = (ctx: EntryPoints.Client.pageInitContext) => {

}

