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
import * as format from 'N/format'




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
          let num = 0

          const searchParcela = search.create({
               type: CTS.CNAB_PARCELA.ID,
               filters: [CTS.CNAB_PARCELA.TRANSACTION, search.Operator.ANYOF, idTransaction],
               columns: [
                    search.createColumn({name: CTS.CNAB_PARCELA.NOSSO_NUMERO})
               ]
          }).run().each(res=> {

               const id = res.id
               
               content_body += bankSlipHTML(id, num)

               content_body += "<br></br>"
               content_body += "<br></br>"
               content_body += "<br></br>"
               content_body += "<br></br>"
               content_body += "<br></br>"
               content_body += "<br></br>"
               content_body += "<br></br>"
               num += 1 

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



const bankSlipHTML = (idRec: string | number, num: number) =>  {
    try {

        const setBankSlip = search.lookupFields({
            type: 'customrecord_dk_cnab_aux_parcela',
            id: idRec,
            columns: [
                "custrecord_dk_cnab_line_digitable", "custrecord_dk_cnab_dt_vencimento",
                "custrecord_dk_cnab_benficiario_nome", "custrecord_dk_cnab_benfic_num_inscricao",
                "custrecord_dk_cnab_dt_emiss", "custrecord_dk_cnab_num_titbeneficiario",
                "custrecord_dk_cnab_descricao_titulo", "custrecord_dk_cnab_codigo_aceite",
                "custrecord_dk_cnab_nosso_numero", "custrecord_dk_cnab_numero_convenio",
                "custrecord_dk_cnab_val_orig", "custrecord_dk_cnab_mensagem_bloqueto",
                "custrecord_dk_cnab_jurosmora_porcentagem", "custrecord_dk_cnab_carteira",
                "custrecord_dk_cnab_pagador_nome", "custrecord_dk_cnab_pagador_num_inscricao",
                "custrecord_dk_cnab_pagador_endereco", "custrecord_dk_cnab_pagador_cidade",
                "custrecord_dk_cnab_pagador_uf", "custrecord_dk_cnab_pagador_bairro",
                "custrecord_dk_cnab_pagador_cep", "custrecord_dk_cnab_barcode"
                


            ]
        })

        const digitableLine = setBankSlip.custrecord_dk_cnab_line_digitable
        const dueDate = setBankSlip.custrecord_dk_cnab_dt_vencimento
        const beneficiaryName = String(setBankSlip.custrecord_dk_cnab_benficiario_nome).toUpperCase()
        const beneficiaryCnpj = setBankSlip.custrecord_dk_cnab_benfic_num_inscricao
        const beneficiaryAgency = '452' //*TROCAR PELO NÚMERO DA AGÊNCIA
        const invoiceDate = setBankSlip.custrecord_dk_cnab_dt_emiss
        const invoiceNumber = setBankSlip.custrecord_dk_cnab_num_titbeneficiario
        const kindDocument = setBankSlip.custrecord_dk_cnab_descricao_titulo
        const bankSlipAcceptance = setBankSlip.custrecord_dk_cnab_codigo_aceite
        const processingDate = setBankSlip.custrecord_dk_cnab_dt_emiss
        const ourBankSlipNumber = setBankSlip.custrecord_dk_cnab_nosso_numero
        const bankAccountNumber = setBankSlip.custrecord_dk_cnab_numero_convenio //*TROCAR PELO NÚMERO DA CONTA BANCÁRIA
        const amountDue = Number(setBankSlip.custrecord_dk_cnab_val_orig).toFixed(2)
        const installment = setBankSlip.custrecord_dk_cnab_mensagem_bloqueto
        const interestRate = setBankSlip.custrecord_dk_cnab_jurosmora_porcentagem //*taxa de juros a.m.
        const billingWallet = setBankSlip.custrecord_dk_cnab_carteira
        const payerName = String(setBankSlip.custrecord_dk_cnab_pagador_nome).toUpperCase()
        const payerCnpj = setBankSlip.custrecord_dk_cnab_pagador_num_inscricao
        const payerStreet = String(setBankSlip.custrecord_dk_cnab_pagador_endereco).toUpperCase()
        const payerCity = String(setBankSlip.custrecord_dk_cnab_pagador_cidade).toUpperCase()
        const payerUf = String(setBankSlip.custrecord_dk_cnab_pagador_uf).toUpperCase()
        const payerNeighborhood = String(setBankSlip.custrecord_dk_cnab_pagador_bairro).toUpperCase()
        const payerZipCode = setBankSlip.custrecord_dk_cnab_pagador_cep
        const barsCode = String(setBankSlip.custrecord_dk_cnab_barcode).toString()
        const formatDigitableLine = formattedDigitableLine(digitableLine)

        const beneficiaryCnpjString = formatCNPJ(beneficiaryCnpj)
        const payerCnpjString = formatCNPJ(payerCnpj)
        const realBR = formatBRL(amountDue)

        log.debug({
            title: ' cnpj convertidos em string',
            details: 'JTC - cnpj: ' + beneficiaryCnpjString + '  >> Pagador cnpj: ' + payerCnpjString + '  >> R$ ' + realBR
        })


        var bankSlip = "<!DOCTYPE html>"
        bankSlip += "<html>"
        bankSlip += "<head>"
        bankSlip += "<script src=\"https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js\"></script>"
        bankSlip += "<meta charset=\"utf-8\">"
        bankSlip += "<!--Configurar para português - Produzio RGR -->"
        bankSlip += "<title>Boleto Bancário</title>"
        bankSlip += "<link rel=\"stylesheet\" href=\"boleto_bancario.css\">"
        bankSlip += "<!---Página - Boleto Bancário -->"
        bankSlip += "</head>"
        bankSlip += "<body style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">"
        bankSlip += "<h3>Ficha de Compensação</h3>"
        bankSlip += "<div>"
        bankSlip += "<table style=\"line-height: 250%;\">"
        bankSlip += "<tr style=\"width: 100%;\" class=\"tam_fonte\">"
        bankSlip += "<th style= \"border: 1px solid black;\ line-height: 250%; height: 70px;\"  colspan=\"2\"><img src=\"https://7414781.app.netsuite.com/core/media/media.nl?id=19580&c=7414781&h=8vnvtehOlslhPRNq6-AIuNA9Oz1eCVIj6tAe2aZdiZ0ThKjK\" alt=\"Banco do Brasil\" width=\"100%\" height=\"100%\"></th>"
        bankSlip += "<th style= \"border: 1px solid black; height: 30px;\"  class=\"head_fonts\">001-9</th>"
        bankSlip += "<th style= \"border: 1px solid black; height: 30px;\"  colspan=\"4\" class=\"head_fonts\">" + formatDigitableLine + "</th>"
        bankSlip += "</tr>"
        bankSlip += "<tr style=\"line-height: 0.2;  height: 20px;\">" //* alterado a altura pra 20 px
        bankSlip += "<td style= \"border: 1px solid black; height: 50px; width: 75%;\" colspan=\"5\" >" //* height modified
        bankSlip += "<label  style=\"font-size: 9px;\">Local de pagamento</label><br></br>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">Pagável em qualquer banco.</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black; width: 25%\" colspan=\"2\">"
        bankSlip += "<label  style=\"font-size: 9px;\">Data de vencimento</label><br></br>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + dueDate + "</p>"
        bankSlip += "</td>"
        bankSlip += "</tr>"

        bankSlip += "<tr style=\"line-height: 0.2;  height: 30px;\">"
        bankSlip += "<td style= \"border: 1px solid black; width: 75%;\"  colspan=\"5\">"
        bankSlip += "<label style=\"font-size: 9px;\">Nome do Beneficiário/CNPJ/CPF</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + beneficiaryName + "/" + beneficiaryCnpjString + "</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black; width: 25%\"  colspan=\"2\">"
        bankSlip += "<label style=\"font-size: 9px;\">AGÊNCIA/CÓDIGO BENEFICIÁRIO</label> "
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + beneficiaryAgency + "/" + bankAccountNumber + "</p>"
        bankSlip += "</td>"
        bankSlip += "</tr>"

        bankSlip += "<tr style=\"line-height: 0.2;  height: 30px;\">"
        bankSlip += "<td style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label style=\"font-size: 9px;\">Data do Documento</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + invoiceDate + "</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black;\" colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label style=\"font-size: 9px;\">Número do Documento</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\"> NFE: " + invoiceNumber + "</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label  style=\"font-size: 9px;\">Espécie Documento</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + kindDocument + "</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label style=\"font-size: 9px;\">Aceite</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + bankSlipAcceptance + "</p>"
        bankSlip += "</td>"
        bankSlip += "<td  style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\" >"
        bankSlip += "<label style=\"font-size: 9px;\">Data Processamento</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + processingDate + "</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black; width: 25%\"  colspan=\"1\" >"
        bankSlip += "<label style=\"font-size: 9px;\">Nosso Número</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + ourBankSlipNumber + "</p>"
        bankSlip += "</td>"
        bankSlip += "</tr>"

        bankSlip += "<tr style=\"line-height: 0.2; height: 30px;\">"
        bankSlip += "<td style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label style=\"font-size: 9px;\">Uso do Banco</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\"><br></p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label style=\"font-size: 9px;\">Carteira</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + billingWallet + "</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label style=\"font-size: 9px;\">Espécie Moeda</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">R$</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label style=\"font-size: 9px;\">Quantidade de Moeda</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\"><br>  </p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black;\"  colspan=\"1\" class=\"col-10\">"
        bankSlip += "<label style=\"font-size: 9px;\">X Valor</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\"><br> </p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black; width: 25%\"  colspan=\"1\">"
        bankSlip += "<label style=\"font-size: 9px;\">Valor do Documento</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">R$" + realBR + "</p>"
        bankSlip += "</td></tr>"

        bankSlip += "<tr style=\"line-height: 0.2;  height: 30px;\">"
        bankSlip += "<td style= \"border: 1px solid black; width: 75%;\"  colspan=\"5\">"
        bankSlip += "<label style=\"font-size: 9px;\">Informações de Responsabilidade do Beneficiário</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + installment + "</p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black; width: 25%\"  colspan=\"2\">"
        bankSlip += "<label style=\"font-size: 9px;\">Desconto/Abatimento</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">R$ </p>"
        bankSlip += "</td></tr>"

        bankSlip += "<tr style=\"line-height: 0.2;  height: 30px;\">"
        bankSlip += "<td style= \"border: 1px solid black; width: 75%;\"  colspan=\"5\" >"
        bankSlip += "<label style=\"font-size: 9px;\">Informações de Responsabilidade do Beneficiário</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\"><br></p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black; width: 25%\" colspan=\"2\">"
        bankSlip += "<label style=\"font-size: 9px;\">Juros/Multa: </label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + interestRate + "% a.m. </p>"
        bankSlip += "</td></tr>"

        bankSlip += "<tr style=\"line-height: 0.2;  height: 30px;\">"
        bankSlip += "<td style= \"border: 1px solid black; width: 75%;\"  colspan=\"5\">"
        bankSlip += "<label style=\"font-size: 9px;\">Informações de Responsabilidade do Beneficiário</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\"><br></p>"
        bankSlip += "</td>"
        bankSlip += "<td style= \"border: 1px solid black; width: 25%\"  colspan=\"2\">"
        bankSlip += "<label style=\"font-size: 9px;\">Valor Cobrado</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">R$</p>"
        bankSlip += "</td></tr>"

        bankSlip += "<tr style=\"line-height: 0.2;  height: 70px;\">"
        bankSlip += "<td style= \"border: 1px solid black; width: 100%;\" colspan=\"6\" >"
        bankSlip += "<label style=\"font-size: 9px;\">Nome do Pagador/CNPJ/CPF/Endereço</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + payerName + " - " + payerCnpjString + "</p>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + payerStreet + " - " + payerNeighborhood + "</p>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\">" + payerCity + " - " + payerUf + " - " + payerZipCode + "</p>"
        bankSlip += "</td></tr>"

        bankSlip += "<tr style=\"line-height: 0.2; height: 10px;\">"
        bankSlip += "<td style= \"border: 1px solid black; line-height: 250%; line-height: 0.2;\"  colspan=\"6\">"
        bankSlip += "<label style=\"font-size: 9px;\">Código de Barras</label>"
        bankSlip += "<p style= \"font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: bold;\"> <br></p>"
        bankSlip += "<barcode codetype=\"code128\" showtext=\"'" + digitableLine.toString() + "'\"/>" //*atenção ao barcode

        //* bankSlip += "<barcode codetype=\"code128\" showtext=\"false\" height=\"15px\" width=\"420px\" value=\"" + barsCode + "\"/>" //*atenção ao barcode
        bankSlip += "<svg id=\"barcode"+num+"\" ></svg>"
        bankSlip += "<script>"
        bankSlip += "JsBarcode(\"#barcode"+num+"\",'" + digitableLine.toString() + "', {"
        bankSlip += "format: \"CODE128\" ,"
        bankSlip += "displayValue: true,"
        bankSlip += "width: 1.5,"
        bankSlip += "height: 40,"
        bankSlip += "fontSize: 15,"
        bankSlip += "margin: 15"
        bankSlip += "})"
        bankSlip += "</script >"
        bankSlip += "</td></tr>"

        bankSlip += "</table>"
        bankSlip += "</div></body>"
        bankSlip += "</html>"

        return bankSlip


    }
    catch (error) {
        log.debug({
            title: 'erro',
            details: 'O ERRO É:   ' + error.message
        })
    }

} 


const formattedDigitableLine = (digitableLine) => {


    var concatDigitableLine
    var linhaDigitavel = digitableLine



    const field_1_1 = linhaDigitavel.substr(0, 5)
    const field_1_2 = linhaDigitavel.substr(5, 5)
    const field_2_1 = linhaDigitavel.substr(10, 5)
    const field_2_2 = linhaDigitavel.substr(15, 6)
    const field_3_1 = linhaDigitavel.substr(21, 5)
    const field_3_2 = linhaDigitavel.substr(26, 6)
    const field_4 = linhaDigitavel.substr(32, 1)
    const field_5 = linhaDigitavel.substring(33)

    concatDigitableLine = field_1_1 + '.' + field_1_2 + ' ' + field_2_1 + '.' + field_2_2 + ' ' + field_3_1 + '.' + field_3_2
        + ' ' + field_4 + ' ' + field_5

    log.debug({
        title: ' linha 771 - function formattedDigitableLine',
        details: 'Linha digitável formatada = ' + concatDigitableLine
    })

    return concatDigitableLine

} 

const formatCNPJ = (cnpj) => {

    var cnpjStr = cnpj.toString()
    const cnpjSize = cnpjStr.length
    if (cnpjSize == 13) {

        cnpjStr = '0' + cnpjStr
    }

    return cnpjStr
} 

const formatBRL = (valor) => {

    const real = valor
    return format.format({ value: real, type: format.Type.FLOAT })
}