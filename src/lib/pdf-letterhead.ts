import { rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';

/** Shared stationery for Fortius public notices; stays outside the text area. */
export function drawFortiusLetterhead(page: PDFPage, logo: PDFImage, regular: PDFFont, bold: PDFFont, pageNumber: number, totalPages: number) {
  const { width, height } = page.getSize();
  const margin = 51;
  const navy = rgb(6 / 255, 31 / 255, 63 / 255);
  const burgundy = rgb(138 / 255, 22 / 255, 52 / 255);
  page.drawRectangle({ x: 0, y: height - 7, width, height: 7, color: navy });
  page.drawRectangle({ x: width - 115, y: height - 7, width: 115, height: 7, color: burgundy });
  page.drawImage(logo, { x: margin, y: height - 70, width: 175, height: 175 * logo.height / logo.width });
  const right = (text: string, y: number, size: number, font = regular) => page.drawText(text, { x: width - margin - font.widthOfTextAtSize(text, size), y, size, font, color: navy });
  right('FORTIUS INMUEBLES', height - 36, 9, bold);
  right('fortiusinmuebles.com', height - 50, 9);
  right('tonala.mn@gmail.com', height - 63, 8.5);
  page.drawLine({ start: { x: margin, y: 52 }, end: { x: width - margin, y: 52 }, thickness: 0.7, color: burgundy });
  page.drawText('C. Dos, 4063, Benedetti B45, Villa Fontana', { x: margin, y: 38, size: 8, font: regular, color: navy });
  page.drawText('C.P. 22205, Tijuana, B. C. · fortiusinmuebles.com', { x: margin, y: 25, size: 8, font: regular, color: navy });
  right(`${pageNumber} / ${totalPages}`, 25, 8);
}
