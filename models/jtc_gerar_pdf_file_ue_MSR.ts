/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */


import { Form } from "N/ui/serverWidget"
import { constantes as CTS} from '../module/jtc_gerar_pdf_file_CTS'
import * as https from 'N/https'
import * as log from 'N/log'
import * as record from 'N/record';
import * as search from 'N/search'
import { EntryPoints } from 'N/types'
import * as runtime from 'N/runtime'

export const createButton = (form: Form, idTransaction, ctx: EntryPoints.UserEvent.beforeLoadContext) => {
    try {
        const curr = ctx.newRecord
        const impre = curr.getValue(CTS.INVOICE.IMPRESSO)
        const link = form.getField({id: CTS.INVOICE.LINK_NF})
        const vi =  form.getField({id: 'custbody_enl_viewdanfe'})
        const subsidiary = curr.getValue("subsidiary")
        
        
        if ((impre == "T" || impre == true) && subsidiary == 3) {
            const currUSer = runtime.getCurrentUser().role
            if (currUSer != 3 && currUSer != 1024) {
                link.updateDisplayType({displayType: "HIDDEN"})
                vi.updateDisplayType({displayType: "HIDDEN"})
            }
        } else {
            form.clientScriptModulePath = '../controllers/jtc_func_gerar_pdf_file_CS.js'
            form.addButton({
                id: CTS.FORM.BUTTON_PDF.ID,
                label: CTS.FORM.BUTTON_PDF.LABEL,
                functionName: "gerarArquivo("+idTransaction +")"
            })
        }  
        

        

    } catch (error) {
        log.error('jtc_gerar_pdf_file_ue_MSR.createButton', error)
    }
   
}


export const gerarArquivo = (idTransaction) => {

    try {
        
        const fieldsSearch = search.lookupFields({
            id: idTransaction,
            type: search.Type.INVOICE,
            columns: [
                CTS.INVOICE.LINK_NF,
                CTS.INVOICE.NF
            ]
        })
   

        const urlNF = fieldsSearch.custbody_enl_linknotafiscal
        const nf = fieldsSearch.custbody_enl_fiscaldocnumber

        const searchXML = search.create({
            type: search.Type.FOLDER,
            filters: [
                [CTS.FOLDER.FILE_NAME, search.Operator.CONTAINS, nf],
                "AND",
                ["file.filetype", search.Operator.ANYOF, "XMLDOC"]
            ],
            columns: [
                search.createColumn({
                    name: CTS.FOLDER.URL,
                    join: CTS.FOLDER.TYPE_FILE
                })
            ]
        }).run().getRange({start: 0, end:1})

        console.log(searchXML)
        

         
        const url_prod = 'https://7414781.app.netsuite.com'
        const url_sb = 'https://7414781-sb1.app.netsuite.com'
        const suietlet_prod = '/app/site/hosting/scriptlet.nl?script=1400&deploy=1'
        const suitelet_sb = '/app/site/hosting/scriptlet.nl?script=1392&deploy=1'

        const responseSuielet = https.post({
            url: `${url_prod}${suietlet_prod}`,
            body: JSON.stringify({id: idTransaction})
        });

        const urlxmlNf = searchXML[0].getValue({
            name: CTS.FOLDER.URL,
            join: CTS.FOLDER.TYPE_FILE
        })
        console.log(responseSuielet.body)
        window.open(`${url_prod}${responseSuielet.body}`, '_blank');

        sleep(1000)

        window.open(String(urlNF), '_blank')

        sleep(1000)

        window.open(`${url_prod}${urlxmlNf}&_xd=T`, '_blank')

    } catch (error) {
        console.log('jtc_gerar_pdf_file_ue_MSR.gerarArquivo',error)
    }
    
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
