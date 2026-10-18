import {
  PDFDocument,
  PDFName,
  PDFString,
  PDFHexString,
  type PDFFont,
  type PDFPage,
  rgb,
} from "pdf-lib";
import {
  FINANCIAL_REVIEW_DATE,
  FINANCIAL_VERSION,
} from "@/data/financial-rules";
import { money } from "./money";
import { letterheadBounds } from '../letterhead';
import { drawFortiusLetterhead, type PdfLetterhead } from '../pdf-letterhead';
import type {
  FinancialReport,
  ReportOverview,
  ReportTable,
} from "./report-model";
const ink = rgb(6 / 255, 31 / 255, 63 / 255),
  muted = rgb(82 / 255, 97 / 255, 118 / 255),
  burgundy = rgb(138 / 255, 22 / 255, 52 / 255),
  pale = rgb(0.95, 0.96, 0.98),
  rule = rgb(0.82, 0.85, 0.9);
type Fonts = { regular: PDFFont; bold: PDFFont; mono: PDFFont };
/** Coordinates use the top of each text line; all pagination reserves the footer. */
export class FinancialLayout {
  private page!: PDFPage;
  private y = 0;
  private margin = 44;
  private landscape = false;
  private marks: { title: string; page: PDFPage; y: number }[] = [];
  private readonly date: string;
  private charsets = new Map<PDFFont, Set<number>>();
  constructor(
    private pdf: PDFDocument,
    private fonts: Fonts,
    private report: FinancialReport,
    private art: PdfLetterhead,
  ) {
    this.date = new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Los_Angeles",
    }).format(new Date(report.issuedAt ?? Date.now()));
  }
  private clean(value: string, font = this.fonts.regular) {
    let supported = this.charsets.get(font);
    if (!supported) {
      supported = new Set(font.getCharacterSet());
      this.charsets.set(font, supported);
    }
    return [...value.normalize("NFC").replace(/[\t\r]/g, " ")]
      .map((char) =>
        supported.has(char.codePointAt(0)!) || char === "\n"
          ? char
          : char === "–" || char === "—"
            ? "-"
            : "?",
      )
      .join("");
  }
  private width() {
    return this.page.getWidth() - this.margin * 2;
  }
  private text(
    value: string,
    x: number,
    top: number,
    size = 10,
    font = this.fonts.regular,
    color = ink,
  ) {
    this.page.drawText(this.clean(value, font), {
      x,
      y: top - size,
      size,
      font,
      color,
    });
  }
  private fit(value: string, width: number, size: number, font: PDFFont) {
    const measured = font.widthOfTextAtSize(this.clean(value, font), size);
    // Leave a small inset so font floating-point rounding cannot wrap the last digit.
    return Math.min(size, measured ? (size * (width - 0.5)) / measured : size);
  }
  private wrap(
    value: string,
    width: number,
    size = 10,
    font = this.fonts.regular,
  ) {
    const result: string[] = [];
    for (const paragraph of this.clean(value, font).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (!word) continue;
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) {
          line = candidate;
          continue;
        }
        if (line) {
          result.push(line);
          line = "";
        }
        for (const char of word) {
          if (line && font.widthOfTextAtSize(line + char, size) > width) {
            result.push(line);
            line = "";
          }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  }
  private newPage(landscape = false) {
    this.landscape = landscape;
    this.margin = landscape ? 36 : 44;
    this.page = this.pdf.addPage(landscape ? [792, 612] : [612, 792]);
    const top = letterheadBounds(this.page.getWidth(),this.page.getHeight()).bodyTop;
    const dateSize = 8;
    this.text(
      this.date,
      this.page.getWidth() -
        this.margin -
        this.fonts.regular.widthOfTextAtSize(this.date, dateSize),
      top - 3,
      dateSize,
      this.fonts.regular,
      muted,
    );
    this.y = top - 24;
  }
  private bottom() { return letterheadBounds(this.page.getWidth(),this.page.getHeight()).bottom; }
  private ensure(height: number) {
    if (this.y - height < this.bottom()) this.newPage(this.landscape);
  }
  private mark(title: string) {
    this.marks.push({ title, page: this.page, y: this.y });
  }
  private heading(title: string, size = 18, reserve = 45) {
    const lines = this.wrap(title, this.width(), size, this.fonts.bold);
    this.ensure(lines.length * (size + 4) + 10 + reserve);
    this.mark(title);
    for (const line of lines) {
      this.text(line, this.margin, this.y, size, this.fonts.bold);
      this.y -= size + 4;
    }
    this.y -= 10;
  }
  private paragraph(value: string, size = 10, color = muted) {
    const lines = this.wrap(value, this.width(), size);
    for (const line of lines) {
      this.ensure(size + 5);
      this.text(line, this.margin, this.y, size, this.fonts.regular, color);
      this.y -= size + 5;
    }
    this.y -= 8;
  }
  private overview(o: ReportOverview) {
    this.text(o.primary.label, this.margin, this.y, 11, this.fonts.bold);
    this.y -= 21;
    const size = this.fit(o.primary.value, this.width(), 32, this.fonts.mono);
    this.text(o.primary.value, this.margin, this.y, size, this.fonts.mono);
    this.y -= size + 12;
    this.paragraph(o.primary.note, 9.5);
    this.y -= 8;
    const cell = this.width() / 3;
    for (let row = 0; row < o.metrics.length; row += 3) {
      const group = o.metrics.slice(row, row + 3);
      const labels = group.map((m) => this.wrap(m.label, cell - 18, 9));
      const labelHeight = Math.max(...labels.map((l) => l.length)) * 12;
      this.ensure(labelHeight + 44);
      group.forEach((m, index) => {
        const x = this.margin + cell * index;
        labels[index].forEach((line, j) =>
          this.text(line, x, this.y - j * 12, 9, this.fonts.regular, muted),
        );
        this.text(
          m.value,
          x,
          this.y - labelHeight - 6,
          this.fit(m.value, cell - 18, 16, this.fonts.mono),
          this.fonts.mono,
        );
      });
      this.y -= labelHeight + 48;
    }
    if (o.pending.length) {
      this.ensure(55);
      this.text(
        "Importes por completar",
        this.margin,
        this.y,
        10,
        this.fonts.bold,
      );
      this.y -= 17;
      this.paragraph(
        `${o.pending.join(", ")}. No están incluidos en las cifras conocidas.`,
        9,
      );
    }
    if (o.balance && o.balance.principal > 0) this.balanceChart(o.balance);
    this.breakdown(o.breakdown, Boolean(o.balance));
  }
  private balanceChart(balance: NonNullable<ReportOverview["balance"]>) {
    this.ensure(162);
    this.text("Evolución del saldo", this.margin, this.y, 12, this.fonts.bold);
    this.y -= 27;
    const left = this.margin + 52,
      right = this.page.getWidth() - this.margin - 6;
    const top = this.y,
      bottom = this.y - 88;
    const months = Math.max(
      1,
      balance.baseline.at(-1)?.month ?? 0,
      balance.actual.at(-1)?.month ?? 0,
    );
    const unit =
      balance.principal >= 1000000
        ? 1000000
        : balance.principal >= 1000
          ? 1000
          : 1;
    const suffix =
      unit === 1000000 ? "millones" : unit === 1000 ? "miles" : "pesos";
    this.text(
      `Saldo en ${suffix} de MXN`,
      this.margin,
      top + 13,
      8,
      this.fonts.regular,
      muted,
    );
    for (let tick = 0; tick <= 2; tick++) {
      const value = (balance.principal * tick) / 2,
        at = bottom + ((top - bottom) * tick) / 2;
      this.page.drawLine({
        start: { x: left, y: at },
        end: { x: right, y: at },
        color: rule,
        thickness: 0.4,
      });
      const label = (value / unit).toLocaleString("es-MX", {
        maximumFractionDigits: 2,
      });
      this.text(
        label,
        left - 8 - this.fonts.mono.widthOfTextAtSize(label, 8),
        at + 4,
        8,
        this.fonts.mono,
        muted,
      );
    }
    const different =
      balance.actual.length !== balance.baseline.length ||
      balance.actual.some((p, i) => p.balance !== balance.baseline[i]?.balance);
    const plot = (points: typeof balance.actual, baseline: boolean) => {
      const sequence = [{ month: 0, balance: balance.principal }, ...points];
      for (let i = 1; i < sequence.length; i++)
        this.page.drawLine({
          start: {
            x: left + (sequence[i - 1].month / months) * (right - left),
            y:
              bottom +
              (sequence[i - 1].balance / balance.principal) * (top - bottom),
          },
          end: {
            x: left + (sequence[i].month / months) * (right - left),
            y:
              bottom +
              (sequence[i].balance / balance.principal) * (top - bottom),
          },
          color: baseline ? muted : burgundy,
          thickness: baseline ? 1 : 1.8,
          ...(baseline ? { dashArray: [3, 2] } : {}),
        });
    };
    if (different) plot(balance.baseline, true);
    plot(balance.actual, false);
    [0, Math.round(months / 2), months].forEach((month) =>
      this.text(
        String(month),
        left + (month / months) * (right - left) - 4,
        bottom - 7,
        8,
        this.fonts.mono,
        muted,
      ),
    );
    this.text("Mes", right - 16, bottom - 20, 8, this.fonts.regular, muted);
    this.text(
      different
        ? "Borgoña: escenario actual · Gris: sin anticipos"
        : "Escenario actual",
      this.margin,
      bottom - 23,
      8,
      this.fonts.regular,
      muted,
    );
    this.y = bottom - 43;
  }
  private breakdown(items: ReportOverview["breakdown"], credit: boolean) {
    const positive = items.filter((item) => item.amount > 0);
    if (!positive.length) return;
    if (credit) {
      this.ensure(69);
      this.text(
        "Composición del costo conocido",
        this.margin,
        this.y,
        11,
        this.fonts.bold,
      );
      this.y -= 21;
      const sum = positive.reduce((total, item) => total + item.amount, 0);
      let x = this.margin;
      positive.forEach((item, index) => {
        const width = (item.amount / sum) * this.width();
        this.page.drawRectangle({
          x,
          y: this.y - 8,
          width,
          height: 8,
          color: [burgundy, rgb(6 / 255, 31 / 255, 63 / 255), rgb(0.64, 0.72, 0.83)][index % 3],
        });
        x += width;
      });
      this.y -= 20;
      const cell = this.width() / positive.length;
      positive.forEach((item, index) => {
        this.text(
          item.label,
          this.margin + index * cell,
          this.y,
          8,
          this.fonts.regular,
          muted,
        );
        this.text(
          money(item.amount),
          this.margin + index * cell,
          this.y - 13,
          this.fit(money(item.amount), cell - 12, 10, this.fonts.mono),
          this.fonts.mono,
        );
      });
      this.y -= 33;
    } else {
      this.ensure(50);
      this.heading("Distribución de los gastos conocidos", 13);
      const max = Math.max(...positive.map((item) => item.amount));
      for (const item of positive) {
        const labels = this.wrap(item.label, this.width() - 180, 9);
        const height = labels.length * 12 + 15;
        this.ensure(height);
        labels.forEach((line, i) =>
          this.text(line, this.margin, this.y - i * 12, 9),
        );
        const value = money(item.amount),
          size = this.fit(value, 170, 10, this.fonts.mono);
        this.text(
          value,
          this.page.getWidth() -
            this.margin -
            this.fonts.mono.widthOfTextAtSize(value, size),
          this.y,
          size,
          this.fonts.mono,
        );
        this.y -= labels.length * 12 + 4;
        this.page.drawRectangle({
          x: this.margin,
          y: this.y - 3,
          width: (this.width() * item.amount) / max,
          height: 3,
          color: burgundy,
        });
        this.y -= 11;
      }
    }
  }
  private numericCell(value: string, column: ReportTable["columns"][number]) {
    return (
      column.numeric &&
      /^-?(?:\$|USD\s*)?\d[\d,.]*(?:\s*(?:MXN|USD|%|meses))?$/.test(value)
    );
  }
  private tableReserve(table: ReportTable) {
    const totalWeight = table.columns.reduce(
      (sum, c) => sum + (c.weight ?? 1),
      0,
    );
    const widths = table.columns.map(
      (c) => ((c.weight ?? 1) / totalWeight) * this.width() - 16,
    );
    const headerHeight =
      Math.max(
        ...table.columns.map(
          (c, i) => this.wrap(c.label, widths[i], 9.5, this.fonts.bold).length,
        ),
      ) *
        12 +
      16;
    // Keep short result tables together. Longer tables keep their first row with the heading.
    const rows = table.rows.length <= 6 ? table.rows : table.rows.slice(0, 1);
    return (
      headerHeight +
      rows.reduce(
        (total, row) =>
          total +
          Math.max(
            ...table.columns.map((col, i) => {
              const numeric = this.numericCell(row[i] ?? "", col),
                font = numeric ? this.fonts.mono : this.fonts.regular;
              const size = numeric
                ? this.fit(row[i] ?? "", widths[i], 9.5, font)
                : 9.5;
              return this.wrap(row[i] ?? "", widths[i], size, font).length;
            }),
          ) *
            12 +
          16,
        0,
      )
    );
  }
  private table(
    table: ReportTable,
    title: string,
    appendix = false,
    note = "",
  ) {
    const weight = table.columns.reduce((sum, c) => sum + (c.weight ?? 1), 0);
    const widths = table.columns.map(
      (c) => ((c.weight ?? 1) / weight) * this.width(),
    );
    const headerSize = appendix ? 9 : 9.5,
      rowSize = appendix ? 8.5 : 9.5,
      padding = appendix ? 3 : 8;
    const headerLines = table.columns.map((c, i) =>
      this.wrap(c.label, widths[i] - padding * 2, headerSize, this.fonts.bold),
    );
    const headerHeight =
      Math.max(...headerLines.map((l) => l.length)) * 12 + padding * 2;
    const header = () => {
      this.page.drawRectangle({
        x: this.margin,
        y: this.y - headerHeight,
        width: this.width(),
        height: headerHeight,
        color: pale,
      });
      let x = this.margin;
      headerLines.forEach((lines, i) => {
        lines.forEach((line, j) => {
          const tx =
            table.columns[i].align === "right"
              ? x +
                widths[i] -
                padding -
                this.fonts.bold.widthOfTextAtSize(line, headerSize)
              : x + padding;
          this.text(
            line,
            tx,
            this.y - padding - j * 12,
            headerSize,
            this.fonts.bold,
          );
        });
        x += widths[i];
      });
      this.y -= headerHeight;
    };
    let started = false;
    for (const [index, row] of table.rows.entries()) {
      const cells = table.columns.map((col, i) => {
        const numeric = this.numericCell(row[i] ?? "", col);
        const font = numeric ? this.fonts.mono : this.fonts.regular;
        const size = numeric
          ? this.fit(row[i] ?? "", widths[i] - padding * 2, rowSize, font)
          : rowSize;
        return {
          font,
          size,
          lines: this.wrap(row[i] ?? "", widths[i] - padding * 2, size, font),
        };
      });
      const fullHeight =
        Math.max(...cells.map((c) => c.lines.length * 12)) + padding * 2;
      const continuation=()=>{
        this.newPage(appendix);
        this.text(
          `${title} · continuación`,
          this.margin,
          this.y,
          16,
          this.fonts.bold,
        );
        this.y -= 28;
        if (appendix) this.paragraph(note, 8.5);
        started = false;
      };
      const bounds=letterheadBounds(this.page.getWidth(),this.page.getHeight());
      const freshHeight=bounds.bodyTop-24-this.bottom()-headerHeight-28-(appendix?this.wrap(note,this.width(),8.5).length*13.5+8:0);
      if (fullHeight<=freshHeight && this.y - fullHeight - (!started ? headerHeight : 0) < this.bottom()) continuation();
      if (!started) {
        header();
        started = true;
      }
      const length=Math.max(...cells.map(cell=>cell.lines.length));
      for(let offset=0;offset<length;) {
        if(this.y-this.bottom()<12+padding*2) {continuation();header();started=true;}
        const amount=Math.min(length-offset,Math.floor((this.y-this.bottom()-padding*2)/12));
        if(amount<1) throw new Error('El encabezado de la tabla excede el área imprimible');
        const height=amount*12+padding*2;
      if (index % 2 === 1)
        this.page.drawRectangle({
          x: this.margin,
          y: this.y - height,
          width: this.width(),
          height,
          color: rgb(0.985, 0.989, 0.995),
        });
      let x = this.margin;
      cells.forEach((cell, i) => {
        cell.lines.slice(offset,offset+amount).forEach((line, j) => {
          const tx =
            table.columns[i].align === "right"
              ? x +
                widths[i] -
                padding -
                cell.font.widthOfTextAtSize(line, cell.size)
              : x + padding;
          this.text(line, tx, this.y - padding - j * 12, cell.size, cell.font);
        });
        x += widths[i];
      });
      this.page.drawLine({
        start: { x: this.margin, y: this.y - height },
        end: { x: this.page.getWidth() - this.margin, y: this.y - height },
        thickness: 0.25,
        color: rule,
      });
      this.y -= height;
      offset+=amount;
      if(offset<length) {continuation();header();started=true;}
      }
    }
    this.y -= 16;
  }
  private link(label: string, url: string) {
    const lines = this.wrap(label, this.width(), 9.5);
    this.ensure(lines.length * 15 + 5);
    for (const line of lines) {
      this.text(line, this.margin, this.y, 9.5, this.fonts.regular, burgundy);
      const ref = this.pdf.context.register(
        this.pdf.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [
            this.margin,
            this.y - 12,
            this.margin + this.fonts.regular.widthOfTextAtSize(line, 9.5),
            this.y + 2,
          ],
          Border: [0, 0, 0],
          A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
        }),
      );
      this.page.node.addAnnot(ref);
      this.y -= 15;
    }
    this.y -= 5;
  }
  render() {
    this.newPage();
    this.heading(this.report.title, 27);
    if (this.report.subtitle) this.paragraph(this.report.subtitle, 10);
    this.y -= 10;
    if (this.report.overview) this.overview(this.report.overview);
    for (const section of this.report.sections) {
      // Una continuación breve del resumen no debe quedar sola en una hoja.
      // Conserve el salto cuando la página anterior ya contiene al menos medio cuerpo.
      const bounds=letterheadBounds(this.page.getWidth(),this.page.getHeight());
      if (section.newPage && this.y<(bounds.bodyTop+bounds.bottom)/2) this.newPage();
      else this.y -= 12;
      this.heading(
        section.title,
        18,
        section.table ? this.tableReserve(section.table) : 45,
      );
      if (section.table) this.table(section.table, section.title);
      for (const line of section.lines ?? []) this.paragraph(line);
      if (section.links?.length)
        this.paragraph(
          `Versión del cálculo: ${FINANCIAL_VERSION} · Fuentes revisadas: ${FINANCIAL_REVIEW_DATE}`,
          8,
        );
      for (const link of section.links ?? []) this.link(link.label, link.url);
    }
    if (this.report.appendix) {
      const appendix = this.report.appendix;
      this.newPage(true);
      this.heading(appendix.title, 20);
      this.paragraph(appendix.note, 8.5);
      this.table(appendix.table, appendix.title, true, appendix.note);
    }
    const count = this.pdf.getPageCount();
    this.pdf.getPages().forEach((page, index) => {
      drawFortiusLetterhead(page,this.art,this.fonts.bold,this.report.title,index+1,count);
    });
    this.pdf.setSubject(
      `Motor ${FINANCIAL_VERSION}; fuentes revisadas ${FINANCIAL_REVIEW_DATE}`,
    );
    this.outline();
  }
  private outline() {
    if (!this.marks.length) return;
    const root = this.pdf.context.obj({ Type: "Outlines" }),
      rootRef = this.pdf.context.register(root);
    const items = this.marks.map((mark) =>
      this.pdf.context.obj({
        Title: PDFHexString.fromText(mark.title),
        Parent: rootRef,
        Dest: [mark.page.ref, PDFName.of("XYZ"), null, mark.y, null],
      }),
    );
    const refs = items.map((item) => this.pdf.context.register(item));
    items.forEach((item, i) => {
      if (i) item.set(PDFName.of("Prev"), refs[i - 1]);
      if (i < refs.length - 1) item.set(PDFName.of("Next"), refs[i + 1]);
    });
    root.set(PDFName.of("First"), refs[0]);
    root.set(PDFName.of("Last"), refs.at(-1)!);
    root.set(PDFName.of("Count"), this.pdf.context.obj(items.length));
    this.pdf.catalog.set(PDFName.of("Outlines"), rootRef);
  }
}
