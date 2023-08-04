/**
 * @NAPIVersion 2.x
 * @NScriptType UserEventScript
 */

import { EntryPoints } from 'N/types'
import * as MSR from '../models/jtc_gerar_pdf_file_ue_MSR'
import * as log from 'N/log'

export const beforeLoad: EntryPoints.UserEvent.beforeLoad = (ctx: EntryPoints.UserEvent.beforeLoadContext) => {
    try {
        if (ctx.type == ctx.UserEventType.VIEW) {
            MSR.createButton(ctx.form, ctx.newRecord.id)
        }
    } catch (e) {
        log.error('jtc_gerar_pdf_file_btn_UE.beforeLoad', e)
    }
    
}