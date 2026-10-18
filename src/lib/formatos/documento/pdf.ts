import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import { COLORS, type Block, type Documento } from "./modelo";
import { letterheadBounds, type LetterheadAssets } from "@/lib/letterhead";
import { drawFortiusLetterhead, embedFortiusLetterhead, type PdfLetterhead } from "@/lib/pdf-letterhead";

/*
  Cuerpo de las plantillas en Carta con el membrete aprobado del Plan de negocio.
  Los márgenes laterales y la tipografía del contenido se conservan.
*/

export type DocumentoAssets = LetterheadAssets & { regular: Uint8Array; bold: Uint8Array };
type Fonts = { regular: PDFFont; bold: PDFFont };

const PAGE: [number, number] = [612, 792];
const LEFT = 50.4, RIGHT = 50.4, { top: TOP, bottom: BOTTOM } = letterheadBounds();
const WIDTH = PAGE[0] - LEFT - RIGHT;
const hex = (value: string) => rgb(parseInt(value.slice(0, 2), 16) / 255, parseInt(value.slice(2, 4), 16) / 255, parseInt(value.slice(4, 6), 16) / 255);
const NAVY = hex(COLORS.navy), GREEN = hex(COLORS.green), WINE = hex(COLORS.wine), WHITE = hex(COLORS.white);
const FILLS = [hex(COLORS.band2), hex(COLORS.band1)], BLACK = hex(COLORS.black), RULE = hex(COLORS.rule), HEAD = hex(COLORS.head);
const BODY = 11, CELL = 9.5;
type Style = { body: number; leading: number; after: number; ink: ReturnType<typeof rgb>; cell: number; h2?: { size: number; bold: boolean } };
const STYLES: Record<"marca" | "contrato" | "opinion" | "aviso", Style> = {
  aviso: { body: 10.5, leading: 1.15, after: 5, ink: NAVY, cell: 9.5, h2: { size: 12, bold: true } },
  opinion: { body: 10.5, leading: 1.25, after: 6, ink: BLACK, cell: 9.5, h2: { size: 11, bold: true } },
  marca: { body: BODY, leading: 1.22, after: 6, ink: NAVY, cell: CELL },
  contrato: { body: 10.5, leading: 1.1, after: 7, ink: BLACK, cell: 10.5 },
};
type Token = { word: string; font: PDFFont };

/** Parte un texto en líneas que caben en el ancho; respeta saltos de línea explícitos. */
export function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/ +/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next, size) > width) { lines.push(line); line = word; }
      else line = next;
      // Palabras más largas que la línea (folios, correos): se cortan por caracteres.
      while (font.widthOfTextAtSize(line, size) > width && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--;
        lines.push(line.slice(0, cut)); line = line.slice(cut);
      }
    }
    lines.push(line);
  }
  return lines;
}

class Writer {
  pages: PDFPage[] = [];
  page!: PDFPage;
  y = 0;
  constructor(public pdf: PDFDocument, private fonts: Fonts, private art: PdfLetterhead, private title: string, private style: Style, private headerFont: PDFFont, private compact = false) { this.newPage(); }
  newPage() {
    this.page = this.pdf.addPage(PAGE);
    this.pages.push(this.page);
    this.y = PAGE[1] - TOP;
  }
  ensure(height: number) { if (this.y - height < BOTTOM) this.newPage(); }
  /** Una fila mayor que la caja de texto continúa sin quedar cubierta por el membrete. */
  splitRow<T>(cells: T[][], leading: number, overhead: number, draw: (part:T[][],height:number)=>void, restart:()=>void, minimum=0, freshHeight=PAGE[1]-TOP-BOTTOM) {
    const count=Math.max(...cells.map(cell=>cell.length));
    const fullHeight=Math.max(minimum,count*leading+overhead);
    if(fullHeight<=freshHeight && this.y-fullHeight<BOTTOM) restart();
    for(let offset=0;offset<count;) {
      if(this.y-BOTTOM<Math.max(minimum,leading+overhead)) restart();
      const amount=Math.min(count-offset,Math.floor((this.y-BOTTOM-overhead)/leading));
      if(amount<1) throw new Error('El encabezado de la tabla excede el área imprimible');
      const part=cells.map(cell=>cell.slice(offset,offset+amount));
      draw(part,Math.max(minimum,amount*leading+overhead));
      offset+=amount;
      if(offset<count) restart();
    }
  }
  /** Párrafo justificado con encabezado opcional en negritas (la última línea queda a la izquierda). */
  paragraph(text: string, lead = "", options: { indent?: boolean; strong?: boolean } = {}) {
    const { body: size, ink: color, after } = this.style, leading = size * this.style.leading;
    const body = options.strong ? this.fonts.bold : this.fonts.regular;
    const tokens: Token[] = [...(lead ? lead.split(/ +/).map(word => ({ word, font: this.fonts.bold })) : []), ...text.split(/ +/).filter(Boolean).map(word => ({ word, font: body }))];
    const space = this.fonts.regular.widthOfTextAtSize(" ", size), width = (t: Token) => t.font.widthOfTextAtSize(t.word, size);
    const lines: Token[][] = [];
    let line: Token[] = [], used = 0;
    const firstIndent = options.indent ? 18 : 0;
    for (const token of tokens) {
      const w = width(token);
      if (line.length && used + space + w > WIDTH - (lines.length === 0 ? firstIndent : 0)) { lines.push(line); line = []; used = 0; }
      used += (line.length ? space : 0) + w; line.push(token);
    }
    if (line.length) lines.push(line);
    const indent = options.indent ? 18 : 0;
    this.ensure(Math.min(2,lines.length)*leading);
    lines.forEach((words, index) => {
      this.ensure((index===lines.length-2?2:1)*leading);
      const last = index === lines.length - 1 || words.length < 2;
      const start = index === 0 ? indent : 0;
      const gap = last ? space : (WIDTH - start - words.reduce((sum, t) => sum + width(t), 0)) / (words.length - 1);
      let x = LEFT + start;
      for (const t of words) { this.page.drawText(t.word, { x, y: this.y - size, size, font: t.font, color }); x += width(t) + gap; }
      this.y -= leading;
    });
    this.y -= after;
  }
  centered(text: string, size: number, before: number, after: number, font = this.fonts.bold) {
    this.ensure(before + size * 2 + this.style.body * 3);
    this.y -= before;
    const w = font.widthOfTextAtSize(text, size);
    this.page.drawText(text, { x: LEFT + (WIDTH - w) / 2, y: this.y - size, size, font, color: this.style.ink });
    this.y -= size * 1.2 + after;
  }
  /** Formulario: celdas con borde fino, pregunta en negritas y respuesta debajo; altura mínima para escribir a mano. */
  form(label: string | undefined, rows: Array<Array<{ q: string; a: string; w: number }>>, filled = false, tailHeight = 0) {
    const pad = 4, qSize = filled ? 8 : 9, aSize = 10, qLead = qSize * 1.18, aLead = aSize * 1.22, minHeight = filled ? 34 : 30;
    const measure = (row: Array<{ q: string; a: string; w: number }>) => {
      const total = row.reduce((s, c) => s + c.w, 0);
      const qFont = filled ? this.fonts.regular : this.fonts.bold;
      const cells = row.map(c => { const width = c.w / total * WIDTH; return { ...c, width, ql: wrap(c.q, qFont, qSize, width - pad * 2), al: c.a ? wrap(c.a, this.fonts.regular, aSize, width - pad * 2) : [] }; });
      const height = Math.max(minHeight, ...cells.map(c => pad * 2 + c.ql.length * qLead + (c.al.length ? 3 + c.al.length * aLead : 0)));
      return { cells, height };
    };
    const measured = rows.map(measure);
    if (label) {
      const firstHeight=measured[0]?.height??70;
      this.ensure(22 + (firstHeight>PAGE[1]-TOP-BOTTOM?70:firstHeight));
      this.y -= 8;
      this.page.drawText(label, { x: LEFT, y: this.y - 10, size: 10, font: this.fonts.bold, color: NAVY });
      this.y -= 15;
    }
    for (const [index,{ cells, height }] of measured.entries()) {
      if(height>PAGE[1]-TOP-BOTTOM) {
        const leading=Math.max(qLead,aLead);
        const content=cells.map(cell=>[...cell.ql.map(text=>({text,size:qSize,font:filled?this.fonts.regular:this.fonts.bold})),...cell.al.map(text=>({text,size:aSize,font:this.fonts.regular}))]);
        this.splitRow(content,leading,pad*2,(part,h)=>{
          let x=LEFT;
          part.forEach((lines,i)=>{
            this.page.drawRectangle({x,y:this.y-h,width:cells[i].width,height:h,...(filled?{color:hex(COLORS.cell)}:{borderColor:RULE,borderWidth:0.5})});
            lines.forEach((line,n)=>this.page.drawText(line.text,{x:x+pad,y:this.y-pad-line.size-n*leading,size:line.size,font:line.font,color:NAVY}));
            x+=cells[i].width;
          });
          this.y-=h;
        },()=>this.newPage(),minHeight);
        continue;
      }
      if (this.y - height - (index===measured.length-1?tailHeight:0) < BOTTOM) this.newPage();
      let x = LEFT;
      for (const cell of cells) {
        if (filled) this.page.drawRectangle({ x: x + (x > LEFT ? 3 : 0), y: this.y - height + 3, width: cell.width - (x > LEFT ? 3 : 0), height: height - 3, color: hex(COLORS.cell) });
        else this.page.drawRectangle({ x, y: this.y - height, width: cell.width, height, borderColor: RULE, borderWidth: 0.5 });
        let y = this.y - pad;
        for (const line of cell.ql) { this.page.drawText(line, { x: x + pad + (filled && x > LEFT ? 3 : 0), y: y - qSize, size: qSize, font: filled ? this.fonts.regular : this.fonts.bold, color: NAVY }); y -= qLead; }
        y -= 3;
        for (const line of cell.al) { this.page.drawText(line, { x: x + pad + (filled && x > LEFT ? 3 : 0), y: y - aSize, size: aSize, font: this.fonts.regular, color: NAVY }); y -= aLead; }
        x += cell.width;
      }
      this.y -= height;
    }
    this.y -= 4;
  }
  /** Recuadro verde claro como en la plantilla: con la imagen ajustada y centrada, o con su leyenda si aún no hay imagen. */
  async image(label: string, image: import("./imagen").ImagenDocumento | undefined, height: number) {
    this.ensure(height + 4);
    this.page.drawRectangle({ x: LEFT, y: this.y - height, width: WIDTH, height, color: HEAD, borderColor: RULE, borderWidth: 0.5 });
    if (!image) {
      const text = label.toUpperCase(), w = this.fonts.bold.widthOfTextAtSize(text, 11);
      this.page.drawText(text, { x: LEFT + (WIDTH - w) / 2, y: this.y - height / 2 - 4, size: 11, font: this.fonts.bold, color: NAVY });
    } else {
      const embedded = image.tipo === "png" ? await this.pdf.embedPng(image.bytes) : await this.pdf.embedJpg(image.bytes);
      const scale = Math.min((WIDTH - 12) / embedded.width, (height - 12) / embedded.height);
      const w = embedded.width * scale, h = embedded.height * scale;
      this.page.drawImage(embedded, { x: LEFT + (WIDTH - w) / 2, y: this.y - height + (height - h) / 2, width: w, height: h });
    }
    this.y -= height + 4;
  }
  /** Tabla de levantamiento: encabezado claro, bordes finos y celdas vacías para escribir a mano. */
  grid(widths: number[], header: string[], rows: string[][]) {
    const total = widths.reduce((a, b) => a + b, 0), cols = widths.map(w => w / total * WIDTH);
    const pad = this.compact ? 3 : 4, size = 9, leading = size * 1.2, minHeight = this.compact ? 16 : 18;
    const drawLines = (lines:string[][],font:PDFFont,height:number,fill?:ReturnType<typeof rgb>) => {
      let x = LEFT;
      lines.forEach((ls, i) => {
        this.page.drawRectangle({ x, y: this.y - height, width: cols[i], height, borderColor: RULE, borderWidth: 0.5, ...(fill ? { color: fill } : {}) });
        ls.forEach((line, n) => this.page.drawText(line, { x: x + pad, y: this.y - pad - size - n * leading + 1, size, font, color: NAVY }));
        x += cols[i];
      });
      this.y -= height;
    };
    const headLines=header.map((cell,i)=>wrap(cell,this.fonts.bold,size,cols[i]-pad*2));
    const headHeight=Math.max(minHeight,...headLines.map(lines=>lines.length*leading+pad*2));
    const restart=()=>{this.newPage();drawLines(headLines,this.fonts.bold,headHeight,HEAD);};
    this.ensure(minHeight * 2);
    drawLines(headLines,this.fonts.bold,headHeight,HEAD);
    for (const row of rows) this.splitRow(row.map((cell,i)=>wrap(cell,this.fonts.regular,size,cols[i]-pad*2)),leading,pad*2,(part,height)=>drawLines(part,this.fonts.regular,height),restart,minHeight,PAGE[1]-TOP-BOTTOM-headHeight);
    this.y -= 6;
  }
  /** Pregunta con opciones en casillas dibujadas; la elegida lleva una X. */
  checks(q: string, options: Array<{ value: string; label: string }>, selected: unknown) {
    const size = 9.5, box = 8, gap = 14;
    this.ensure(36);
    this.y -= 4;
    this.page.drawText(q, { x: LEFT, y: this.y - size, size, font: this.fonts.regular, color: NAVY });
    this.y -= size + 6;
    let x = LEFT;
    for (const option of options) {
      const w = box + 4 + this.fonts.regular.widthOfTextAtSize(option.label, size) + gap;
      if (x + w > LEFT + WIDTH) { x = LEFT; this.y -= size + 6; }
      this.page.drawRectangle({ x, y: this.y - box, width: box, height: box, borderColor: NAVY, borderWidth: 0.7 });
      if (option.value === selected) {
        this.page.drawLine({ start: { x: x + 1.5, y: this.y - box + 1.5 }, end: { x: x + box - 1.5, y: this.y - 1.5 }, thickness: 1, color: NAVY });
        this.page.drawLine({ start: { x: x + 1.5, y: this.y - 1.5 }, end: { x: x + box - 1.5, y: this.y - box + 1.5 }, thickness: 1, color: NAVY });
      }
      this.page.drawText(option.label, { x: x + box + 4, y: this.y - box + 0.5, size, font: option.value === selected ? this.fonts.bold : this.fonts.regular, color: NAVY });
      x += w;
    }
    this.y -= size + 8;
  }
  /** Barra azul marino de hoja de cálculo con texto en mayúsculas y, si hay, un dato a la derecha sobre gris. */
  bar(text: string, right?: string, big = false, raw = false, center = false) {
    const height = big ? 26 : this.compact ? 16 : 18, size = big ? 13 : 9.5;
    this.ensure(height + 40);
    this.y -= 4;
    const split = right !== undefined ? WIDTH * 8 / 12 : WIDTH;
    this.page.drawRectangle({ x: LEFT, y: this.y - height, width: split, height, color: NAVY });
    const label = raw ? text : text.toUpperCase(), labelWidth = this.fonts.bold.widthOfTextAtSize(label, size);
    this.page.drawText(label, { x: center ? LEFT + (split - labelWidth) / 2 : LEFT + 6, y: this.y - height / 2 - size / 2 + 1.5, size, font: this.fonts.bold, color: WHITE });
    if (right !== undefined) {
      this.page.drawRectangle({ x: LEFT + split, y: this.y - height, width: WIDTH - split, height, color: hex(COLORS.band2) });
      const rsize = big ? 15 : 10, w = this.fonts.bold.widthOfTextAtSize(right, rsize);
      this.page.drawText(right, { x: LEFT + WIDTH - 6 - w, y: this.y - height / 2 - rsize / 2 + 1.5, size: rsize, font: big ? this.fonts.bold : this.fonts.regular, color: NAVY });
    }
    this.y -= height + (this.compact ? 2 : 3);
  }
  /** Renglones de hoja de cálculo: etiquetas en negritas sin fondo y valores sobre gris claro. */
  sheet(rows: Array<Array<{ label?: string; value?: string; w: number; strong?: boolean; big?: boolean }>>) {
    const pad = 4;
    for (const row of rows) {
      const total = row.reduce((s, c) => s + c.w, 0) || 12;
      const cells = row.map(c => {
        const width = c.w / Math.max(total, 12) * WIDTH, isLabel = c.label !== undefined, size = c.big ? 14 : isLabel ? 9 : 10;
        const font = isLabel || c.strong || c.big ? this.fonts.bold : this.fonts.regular;
        return { ...c, width, size, font, lines: wrap((isLabel ? c.label : c.value) ?? "", font, size, width - pad * 2) };
      });
      const height = Math.max(18, ...cells.map(c => c.lines.length * c.size * 1.2 + pad * 2));
      if (this.y - height < BOTTOM) this.newPage();
      let x = LEFT;
      for (const c of cells) {
        if (c.label === undefined) this.page.drawRectangle({ x: x + 1, y: this.y - height + 1, width: c.width - 2, height: height - 2, color: hex(COLORS.band2) });
        c.lines.forEach((line, n) => this.page.drawText(line, { x: x + pad, y: this.y - pad - c.size - n * c.size * 1.2 + 1, size: c.size, font: c.font, color: NAVY }));
        x += c.width;
      }
      this.y -= height;
    }
    this.y -= 3;
  }
  note(text: string) {
    const size = 8.5, leading = size * 1.25;
    const lines = wrap(text, this.fonts.regular, size, WIDTH);
    if(lines.length*leading<PAGE[1]-TOP-BOTTOM) this.ensure(lines.length*leading+4);
    for (const line of lines) { this.ensure(leading); this.page.drawText(line, { x: LEFT, y: this.y - size, size, font: this.fonts.regular, color: NAVY }); this.y -= leading; }
    this.y -= 4;
  }
  signatures(parties: Array<{ role: string; name: string }>, line = false) {
    // Una sola firma: línea corta a la izquierda, como en las cartas; varias: columnas iguales.
    const col = parties.length === 1 ? 240 : WIDTH / parties.length, size = this.style.body;
    const gap = this.compact ? 20 : 36;
    this.ensure(gap + size * 4);
    this.y -= gap;
    parties.forEach((party, i) => {
      const center = LEFT + col * i + col / 2;
      // Línea de firma sobre el cargo, como en las actas.
      if (line) this.page.drawLine({ start: { x: center - col / 2 + 20, y: this.y + 4 }, end: { x: center + col / 2 - 20, y: this.y + 4 }, thickness: 0.6, color: this.style.ink });
      const role = this.fonts.bold.widthOfTextAtSize(party.role, size);
      this.page.drawText(party.role, { x: center - role / 2, y: this.y - size, size, font: this.fonts.bold, color: this.style.ink });
      wrap(party.name, this.fonts.regular, size, col - 20).forEach((line, n) => {
        const w = this.fonts.regular.widthOfTextAtSize(line, size);
        this.page.drawText(line, { x: center - w / 2, y: this.y - size * 2.6 - n * size * 1.2, size, font: this.fonts.regular, color: this.style.ink });
      });
    });
    this.y -= size * 5;
  }
  heading(text: string, size: number, color: typeof NAVY, before: number, after: number, font = this.fonts.regular) {
    const lines = wrap(text, font, size, WIDTH);
    this.ensure(before + lines.length * size * 1.2 + BODY * 3); // no dejar un título solo al pie
    this.y -= before;
    for (const line of lines) { this.page.drawText(line, { x: LEFT, y: this.y - size, size, font, color }); this.y -= size * 1.2; }
    this.y -= after;
  }
  /** Tabla de ancho completo: celdas con relleno, texto en 9.5 pt y encabezado repetido al cambiar de página. */
  table(widths: number[], header: string[] | undefined, rows: string[][], band = false, labels = false, dark = false, small = false) {
    const total = widths.reduce((a, b) => a + b, 0), cols = widths.map(w => w / total * WIDTH);
    const CELL = small ? 7.5 : this.style.cell, pad = 3.75, leading = CELL * (labels ? 1.12 : 1.25);
    const layout = (cells: string[], font: PDFFont) => cells.map((cell, i) => wrap(cell, labels && i === 0 ? this.fonts.bold : font, CELL, cols[i] - pad * 2));
    const height = (lines: string[][]) => Math.max(...lines.map(l => l.length)) * leading + pad * 2 + (labels ? 3 : 7);
    const drawRow = (cells: string[][], fill: ReturnType<typeof rgb>, color: ReturnType<typeof rgb>, font: PDFFont, rowHeight: number) => {
      let x = LEFT;
      cells.forEach((lines, i) => {
        this.page.drawRectangle({ x, y: this.y - rowHeight, width: cols[i], height: rowHeight, color: labels ? (i === 0 ? hex(dark ? COLORS.ink2 : COLORS.band2) : hex(dark ? COLORS.value2 : COLORS.band3)) : fill, ...(dark ? { borderColor: hex("D7DEE8"), borderWidth: 0.5 } : {}) });
        lines.forEach((line, n) => this.page.drawText(line, { x: x + pad, y: this.y - pad - (labels ? 1 : 3) - CELL - n * leading, size: dark && i === 0 ? 8 : CELL, font: labels && i === 0 ? this.fonts.bold : font, color: dark && i === 0 ? WHITE : color }));
        x += cols[i];
      });
      this.y -= rowHeight;
    };
    const head = header && layout(header, this.fonts.bold), headHeight = head ? height(head) : 0;
    const drawHead = () => { if (head) drawRow(head, NAVY, WHITE, this.fonts.bold, headHeight); };
    const first = rows[0] ? height(layout(rows[0], this.fonts.regular)) : 0;
    this.ensure(headHeight + first);
    drawHead();
    rows.forEach((row, index) => {
      const lines = layout(row, this.fonts.regular);
      this.splitRow(lines,leading,pad*2+(labels?3:7),(part,rowHeight)=>drawRow(part,FILLS[(band ? index + 1 : index) % 2],this.style.ink,this.fonts.regular,rowHeight),()=>{this.newPage();drawHead();},0,PAGE[1]-TOP-BOTTOM-headHeight);
    });
    this.y -= 8;
  }
  footers() {
    const total = this.pages.length;
    this.pages.forEach((page, index) => {
      drawFortiusLetterhead(page, this.art, this.headerFont, this.title, index + 1, total);
    });
  }
  async render(block: Block, next?: Block, afterNext?: Block, lastNext = false) {
    const paragraphHeight=(text:string)=>wrap(text,this.fonts.regular,this.style.body,WIDTH).length*this.style.body*this.style.leading+this.style.after;
    const signatureHeight=(this.compact?20:36)+this.style.body*5;
    if(block.kind==='p') {
      if(next?.kind==='signatures') this.ensure(paragraphHeight(block.text)+signatureHeight);
      else if(next?.kind==='bar' && afterNext?.kind==='signatures') this.ensure(paragraphHeight(block.text)+30+signatureHeight);
      else if(lastNext && next?.kind==='p') this.ensure(paragraphHeight(block.text)+paragraphHeight(next.text));
    }
    if(block.kind==='bar' && next?.kind==='signatures') this.ensure(30+signatureHeight);
    switch (block.kind) {
      case "image": await this.image(block.label, block.image, block.height); break;
      case "bar": this.bar(block.text, block.right, block.big, block.raw, block.center); break;
      case "right": {
        const size = this.style.body;
        for (const line of wrap(block.text, this.fonts.regular, size, WIDTH)) { this.ensure(size * 1.3); const w = this.fonts.regular.widthOfTextAtSize(line, size); this.page.drawText(line, { x: LEFT + WIDTH - w, y: this.y - size, size, font: this.fonts.regular, color: this.style.ink }); this.y -= size * 1.3; }
        this.y -= 8; break;
      }
      case "label": this.heading(block.text, block.size ?? this.style.body, this.style.ink, 6, 4, this.fonts.bold); break;
      case "h3": this.heading(block.text, 13, this.style.ink, 8, 4); break;
      case "checks": this.checks(block.q, block.options, block.selected); break;
      case "sheet": this.sheet(block.rows); break;
      case "grid": this.grid(block.widths, block.header, block.rows); break;
      // Salto de página de la plantilla; si la página apenas empezó (solo arrastra una nota), se continúa en ella.
      case "pagebreak": if (block.force ? this.y < PAGE[1] - TOP - 1 : this.y < PAGE[1] / 2) this.newPage(); break;
      case "title": if (block.bold) { const size = block.size ?? 22; this.ensure(110); this.y -= this.y < PAGE[1] - TOP - 1 ? 10 : 2; this.page.drawText(block.text, { x: LEFT, y: this.y - size, size, font: this.fonts.bold, color: NAVY }); this.y -= size + 8; } else this.heading(block.text, 27, NAVY, 0, 8); break;
      case "form": this.form(block.label, block.rows, block.filled,next?.kind==='note'?wrap(next.text,this.fonts.regular,8.5,WIDTH).length*8.5*1.25+8:0); break;
      case "subtitle": this.centered(block.text, 12, 10, 2); break;
      case "note": this.note(block.text); break;
      case "h1": this.heading(block.text, 21, NAVY, 12, 6); break;
      case "h2": if (this.style.h2) this.heading(block.text, this.style.h2.size, this.style.ink, 6, 4, this.fonts.bold); else this.heading(block.text, 13, GREEN, 8, 4); break;
      case "p": this.paragraph(block.text, "", { indent: block.indent, strong: block.strong }); break;
      case "clause": this.paragraph(block.text, block.lead); break;
      case "center": this.centered(block.text, this.style.body, 4, 6); break;
      case "fields": this.table(block.widths, undefined, block.dark ? block.rows.map(([l, v]) => [l.toUpperCase(), v]) : block.rows, false, true, !!block.dark); break;
      case "numbered": {
        this.ensure(14 + 13 + this.style.body * 4);
        this.y -= 12;
        const num = `${block.num}  `, w = this.fonts.bold.widthOfTextAtSize(num, 9);
        this.page.drawText(num, { x: LEFT, y: this.y - 12, size: 9, font: this.fonts.bold, color: WINE });
        this.page.drawText(block.text.toUpperCase(), { x: LEFT + w + 2, y: this.y - 12, size: 12, font: this.fonts.bold, color: BLACK });
        this.y -= 20; break;
      }
      case "caption": this.heading(block.text, 9.5, hex(COLORS.gray), -4, 8); break;
      case "signatures": this.signatures(block.parties, block.line); break;
      case "band": this.table(block.widths, undefined, block.rows.map(row => row.map(cell => `${cell.label.toUpperCase()}\n${cell.value}`)), true); break;
      case "table": this.table(block.widths, block.header, block.rows, false, false, false, !!block.small); break;
    }
  }
}

export async function renderDocumentoPdf(doc: Documento, assets: DocumentoAssets): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(doc.title); pdf.setAuthor("Fortius Inmuebles"); pdf.setCreator("Panel Fortius · Formatos exclusivos");
  if (doc.subject) pdf.setSubject(doc.subject);
  pdf.registerFontkit(fontkit);
  const contrato = doc.estilo === "contrato" || doc.estilo === "aviso";
  const estilo = doc.estilo ?? "marca";
  const [regular, bold, art] = await Promise.all([
    contrato ? pdf.embedFont(StandardFonts.TimesRoman) : pdf.embedFont(assets.regular, { subset: true }),
    contrato ? pdf.embedFont(StandardFonts.TimesRomanBold) : pdf.embedFont(assets.bold, { subset: true }),
    embedFortiusLetterhead(pdf, assets),
  ]);
  const headerFont = contrato ? await pdf.embedFont(assets.bold, { subset:true }) : bold;
  const compact = doc.subject?.startsWith('Formato 18 ·') ?? false;
  const style = compact ? {...STYLES[estilo],leading:1.15,after:3.5} : STYLES[estilo];
  const writer = new Writer(pdf, { regular, bold }, art, doc.title, style, headerFont, compact);
  for (const [index,block] of doc.blocks.entries()) await writer.render(block,doc.blocks[index+1],doc.blocks[index+2],index===doc.blocks.length-2);
  writer.footers();
  return pdf.save();
}
