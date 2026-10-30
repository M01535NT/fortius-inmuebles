import { rgb, type PDFDocument, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import { letterheadBounds, type LetterheadAssets } from './letterhead';

export type PdfLetterhead = { encabezado: PDFImage; pie: PDFImage };
export async function embedFortiusLetterhead(pdf: PDFDocument, assets: LetterheadAssets): Promise<PdfLetterhead> {
  const [encabezado, pie] = await Promise.all([pdf.embedPng(assets.encabezado), pdf.embedPng(assets.pie)]);
  return { encabezado, pie };
}

/** Sólo arte, título del documento y paginación; no modifica datos de negocio. */
export function drawFortiusLetterhead(page: Pick<PDFPage, 'getSize' | 'drawImage' | 'drawText'>, art: PdfLetterhead, font: PDFFont, title: string, pageNumber: number, totalPages: number) {
  const { width, height } = page.getSize();
  const bounds = letterheadBounds(width, height), scale = width / 612;
  const navy = rgb(6 / 255, 31 / 255, 63 / 255);
  page.drawImage(art.encabezado, { x: 0, y: height - bounds.header, width, height: bounds.header });
  page.drawImage(art.pie, { x: 0, y: 0, width, height: bounds.footer });
  const available = 245 * scale, right = width - 61.2 * scale;
  let size = 12 * scale;
  const lines: string[] = [];
  let line = '';
  const supported=new Set(font.getCharacterSet());
  const label=[...title.normalize('NFC')].map(char=>supported.has(char.codePointAt(0)!)?char:' ').join('').trim();
  for(const word of label.split(/\s+/)) {
    if(line && font.widthOfTextAtSize(`${line} ${word}`,size)>available) { lines.push(line); line=word; }
    else line=line?`${line} ${word}`:word;
  }
  if(line) lines.push(line);
  if(lines.length>2) size=Math.max(8*scale, size*2/lines.length);
  const leading=size*1.15, center=height-67*scale;
  lines.forEach((text,index)=>page.drawText(text,{x:right-font.widthOfTextAtSize(text,size),y:center+(lines.length-1)*leading/2-index*leading,size,font,color:navy}));
  const count=`${pageNumber} / ${totalPages}`;
  page.drawText(count, { x: right-font.widthOfTextAtSize(count,8), y: bounds.footer+6, size:8, font, color:navy });
}
