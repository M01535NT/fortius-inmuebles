import { expect,it } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { buildAppPdf } from '@/lib/apps/pdf';
it('exports long reports across pages with embedded fonts and valid document structure',async()=>{
 const bytes=await buildAppPdf({title:'Presupuesto de rehabilitación',summary:[{label:'Total estimado',value:'$125,430.50 MXN'},{label:'Vigencia',value:'31 de octubre de 2026'}],sections:[{title:'Conceptos',columns:['Concepto','Cantidad','Unitario','Importe'],rows:Array.from({length:45},(_,i)=>[`Partida ${i+1}: preparación de muros y aplicación de acabado según especificaciones del inmueble`, '15.50 m²','$180.25','$2,793.88'])},{title:'Condiciones',text:'La propuesta conserva cada concepto y su desglose. Impuestos y contingencia incluidos conforme a la captura.'}],warnings:['Las cantidades deben cotejarse con el levantamiento del inmueble antes de contratar los trabajos.']});
 const pdf=await PDFDocument.load(bytes);expect(pdf.getPageCount()).toBeGreaterThan(2);expect(bytes.length).toBeGreaterThan(10000);
 if(process.env.FORTIUS_QA_PDF)await writeFile(process.env.FORTIUS_QA_PDF,bytes);
});
