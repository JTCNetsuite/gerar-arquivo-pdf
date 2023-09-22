/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */


import {EntryPoints} from 'N/types'
import * as log from 'N/log'
import * as file from 'N/file'
import * as search from 'N/search'
import {constantes as CTS} from '../module/jtc_gerar_pdf_file_CTS'
import * as record from 'N/record'




export const onRequest = (ctx:EntryPoints.Suitelet.onRequestContext) => {
   try {
          const BODY = JSON.parse(ctx.request.body)
          const idTransaction = BODY.id
          log.debug('dTransaction', idTransaction)

        record.submitFields({
            id:idTransaction, type: record.Type.INVOICE, values: {custbody_jtc_impresso_files: true},
            options: {
                ignoreMandatoryFields: true
            }
        })


          let content_body = ''

          const searchParcela = search.create({
               type: CTS.CNAB_PARCELA.ID,
               filters: [CTS.CNAB_PARCELA.TRANSACTION, search.Operator.ANYOF, idTransaction],
               columns: [
                    search.createColumn({name: CTS.CNAB_PARCELA.NOSSO_NUMERO})
               ]
          }).run().each(res=> {

               log.debug('res', res)

               const nossoNumero = res.getValue(CTS.CNAB_PARCELA.NOSSO_NUMERO)


                const searchFileBoleto = search.create({
                    type: search.Type.FOLDER,
                    filters: [CTS.FOLDER.FILE_NAME, search.Operator.HASKEYWORDS, nossoNumero],
                    columns:[
                        search.createColumn({
                            name: CTS.FOLDER.NAME,
                            join: CTS.FOLDER.TYPE_FILE
                        }),
                        search.createColumn({
                            name: CTS.FOLDER.INTERNALID,
                            join: CTS.FOLDER.TYPE_FILE
                        }),
                        search.createColumn({
                            name: CTS.FOLDER.URL,
                            join: CTS.FOLDER.TYPE_FILE
                        })
                    ]
                }).run().getRange({start: 0, end: 1})

                log.debug("searchFileBoleto", searchFileBoleto)
                if (searchFileBoleto.length > 0) {
                    const idFile = String(searchFileBoleto[0].getValue({name: CTS.FOLDER.INTERNALID, join: CTS.FOLDER.TYPE_FILE}))

                    log.debug('idFile', idFile)
    
                    const contentfile = file.load({id: idFile}).getContents();
    
                    content_body += contentfile + "\n"
                    content_body += "<br></br>"
                    content_body += "<br></br>"
                    content_body += "<br></br>"
                    content_body += "<br></br>"
                    content_body += "<br></br>"
                    content_body += "<br></br>"
                    content_body += "<br></br>"
                }
                

               return true
          })

          log.debug("content_body", content_body)


          const newFile = file.create({
               name: `boleto.html`,
               fileType: file.Type.HTMLDOC,
               contents: content_body,
               folder: 952,
          }).save()

          const urlFile = file.load({id: newFile}).url

          log.debug('file Id', newFile)
          log.debug('file URL', urlFile)


          ctx.response.write(String(urlFile))

   } catch (error) {
        log.error("error", error)
   }
}