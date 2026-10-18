import { readFile } from 'node:fs/promises';
import { it, expect } from 'vitest';
import JSZip from 'jszip';
import { Packer } from 'docx';
import { PDFDocument, PDFDict, PDFName, PDFRawStream, PDFArray, decodePDFRawStream } from 'pdf-lib';
import { createAvisoPdf } from '@/lib/formatos/aviso-pdf';
import { documentoDocx } from '@/lib/formatos/documento/docx';
import { DOCUMENTOS } from '@/lib/formatos/documento';
import { renderDocumentoPdf } from '@/lib/formatos/documento/pdf';
import type { Block } from '@/lib/formatos/documento/modelo';

const load = (file:string) => readFile(`public/${file}`);
it('usa los dos gráficos del Plan de negocio en cada página del aviso público y capturado', async () => {
  for(const publicTemplate of [true,false]) {
    const pdf=await PDFDocument.load(await createAvisoPdf({folio:'EJEMPLO',titular:'Persona de ejemplo'},{publicTemplate}));
    for(const page of pdf.getPages()) {
      const images=page.node.Resources()?.lookup(PDFName.of('XObject'),PDFDict);
      const dimensions=images?.entries().map(([,ref])=>pdf.context.lookup(ref)).filter((item):item is PDFRawStream=>item instanceof PDFRawStream).map(image=>`${image.dict.get(PDFName.of('Width'))}x${image.dict.get(PDFName.of('Height'))}`);
      expect(dimensions).toContain('1870x363');
      expect(dimensions).toContain('1870x330');
    }
  }
});

it.each(['form','grid','table'] as const)('pagina una celda extensa de %s sin escribir sobre el pie',async kind=>{
  const long='Dato de ejemplo verificable '.repeat(350)+'Final de la celda';
  const block:Block=kind==='form'?{kind,rows:[[{q:'Referencia',a:long,w:1}]]}:kind==='grid'?{kind,widths:[1],header:['Referencia'],rows:[[long]]}:{kind,widths:[1],header:['Referencia'],rows:[[long]]};
  const assets={encabezado:await load('brand/membrete-encabezado.png'),pie:await load('brand/membrete-pie.png'),regular:await load('fonts/Archivo-Regular.ttf'),bold:await load('fonts/Archivo-SemiBold.ttf')};
  const pdf=await PDFDocument.load(await renderDocumentoPdf({title:'Prueba de paginación',blocks:[block]},assets));
  expect(pdf.getPageCount()).toBeGreaterThan(1);
  for(const page of pdf.getPages()) {
    const contents=page.node.Contents();
    const refs=contents instanceof PDFArray?contents.asArray():[contents];
    const raw=refs.map(ref=>pdf.context.lookup(ref)).filter((item):item is PDFRawStream=>item instanceof PDFRawStream).map(stream=>new TextDecoder().decode(decodePDFRawStream(stream).decode())).join('\n');
    for(const match of raw.matchAll(/1 0 0 1 [\d.-]+ ([\d.-]+) Tm/g)) expect(Number(match[1])).toBeGreaterThanOrEqual(108);
  }
});
it('conserva los dos gráficos en encabezado y pie de Word con espacio para el cuerpo', async () => {
  const encabezado=await load('brand/membrete-encabezado.png'), pie=await load('brand/membrete-pie.png');
  const assets={encabezado,pie};
  const zip=await JSZip.loadAsync(await Packer.toBuffer(documentoDocx(DOCUMENTOS['01']!({}),assets)));
  const xml=await zip.file('word/document.xml')!.async('string');
  expect(xml).toMatch(/w:top="25[0-9]{2}"/);
  expect(xml).toMatch(/w:bottom="2[3-5][0-9]{2}"/);
  const header=await zip.file('word/header1.xml')!.async('string');
  const footer=await zip.file('word/footer1.xml')!.async('string');
  expect(header).toContain('cx="7772400" cy="1508760"');
  expect(footer).toContain('cx="7772400" cy="1371600"');
});
