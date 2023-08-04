/**
 * @NAPIVersion 2.x
 * @NScriptType Suitelet
 */


import {EntryPoints} from 'N/types'
import * as MSR from '../models/jtc_gerar_pdf_file_st_MSR'
import * as log from 'N/log'

export const onRequest: EntryPoints.Suitelet.onRequest = (ctx: EntryPoints.Suitelet.onRequestContext) =>{
    try {
        if(ctx.request.method == "POST") {
            MSR.onRequest(ctx)
        }
    } catch (error) {
        log.error('jtc_gerar_pdf_file_ST.onRequest', error)
    }
}