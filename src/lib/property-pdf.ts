import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, PDFName, PDFString, pushGraphicsState, popGraphicsState, rectangle, clip, endPath, type PDFFont, type PDFImage } from "pdf-lib";
import { ESTADO_LABELS, FUENTE_SUPERFICIE_LABELS, OPERACION_LABELS, TIPO_LABELS, formatPrecio, type Property } from "@/data/propiedades";
import type { Asesor, SiteSettings } from "@/lib/domain/records";
import { publicContact } from "@/lib/public-contact";
import { letterheadBounds } from "./letterhead";
import { loadLetterhead } from "./letterhead-server";
import { drawFortiusLetterhead, embedFortiusLetterhead } from "./pdf-letterhead";

type Options = { settings: SiteSettings | null; adviser?: Asesor; siteUrl: string; loadImage: (src: string) => Promise<Uint8Array | null> };
const burgundy = rgb(138 / 255, 22 / 255, 52 / 255);
const ink = rgb(.08, .09, .1);
const muted = rgb(.34, .36, .39);
// Letter paper, with the same generous margins as the supplied editorial reference.
const width = 612, height = 792, margin = 46, content = width - margin * 2;
const body = letterheadBounds(width,height);
const bottom = height - body.bottom - 10, start = body.top;

/** An editorial sheet of explicit public fields. Never serialize private records. */
export async function createPropertyPdf(p: Property, options: Options): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regular, bold, serif] = await Promise.all(
    ["Archivo-Regular.ttf", "Archivo-SemiBold.ttf", "LibreCaslonText-Regular.ttf"].map(async name =>
      pdf.embedFont(await readFile(join(process.cwd(), "public", "fonts", name)), { subset: true })
    )
  );
  const art = await embedFortiusLetterhead(pdf, await loadLetterhead());
  const supported = new Map<PDFFont, Set<number>>();
  for (const font of [regular, bold, serif]) supported.set(font, new Set(font.getCharacterSet()));
  const clean = (s: string, font = regular) => Array.from(s.normalize("NFC").replace(/[\u2010-\u2015]/g, "-")).filter(c => supported.get(font)!.has(c.codePointAt(0)!)).join("");
  const wrap = (value: string, size: number, font = regular, max = content) => {
    const result: string[] = [];
    for (const paragraph of value.split(/\r?\n/)) {
      let line = "";
      for (const word of clean(paragraph, font).split(/\s+/).filter(Boolean)) {
        if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > max) { result.push(line); line = ""; }
        for (const char of (line ? " " : "") + word) {
          if (line && font.widthOfTextAtSize(line + char, size) > max) { result.push(line); line = ""; }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  };
  let page = pdf.addPage([width, height]);
  let y = start;
  const draw = (value: string, x: number, top: number, size = 10.5, font = regular, color = ink) => {
    page.drawText(clean(value, font), { x, y: height - top - size, size, font, color });
  };
  const header = () => {
    y = start;
  };
  const next = () => { page = pdf.addPage([width, height]); header(); };
  const ensure = (space: number) => { if (y + space > bottom && y > start) next(); };
  const text = (value: string, size = 10.5, font = regular, color = ink, gap = 7) => {
    const leading = size * (font === serif ? 1.18 : 1.45);
    const lines = wrap(value, size, font);
    for (const [index, line] of lines.entries()) {
      // Keep at least two opening/closing lines of a paragraph together in print.
      const keep = index === 0 && lines.length === 3 ? 3
        : index === 0 || index === lines.length - 2 ? Math.min(2, lines.length - index) : 1;
      ensure(leading * keep);
      draw(line, margin, y, size, font, color);
      y += leading;
    }
    y += gap;
  };
  const section = (label: string, minimum = 35) => {
    ensure(39 + minimum);
    y += 9;
    text(label, 21, serif, ink, 7);
  };
  const safeUrl = (value: string, contact = false) => {
    try {
      const url = new URL(value, options.siteUrl);
      return (contact ? ["https:", "http:", "mailto:", "tel:"] : ["https:", "http:"]).includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  };
  const load = async (src: string) => {
    const bytes = await options.loadImage(src);
    if (!bytes) return null;
    try { return await pdf.embedJpg(bytes); } catch { return null; }
  };
  const photo = (image: PDFImage, x: number, top: number, boxWidth: number, boxHeight: number) => {
    const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
    // Show the entire photograph: no stretching, invented frame or hidden crop.
    page.drawImage(image, { x: x + (boxWidth - image.width * scale) / 2, y: height - top - image.height * scale, width: image.width * scale, height: image.height * scale });
  };

  pdf.setTitle(`${p.titulo} | Ficha técnica | Fortius Inmuebles`);
  pdf.setAuthor("Fortius Inmuebles");
  pdf.setSubject(`Información pública del inmueble ${p.codigo}`);
  pdf.catalog.set(PDFName.of("Lang"), PDFString.of("es-MX"));
  header();
  text(`${TIPO_LABELS[p.tipo]} en ${OPERACION_LABELS[p.operacion].toLowerCase()} · ${ESTADO_LABELS[p.estado]}`, 10, regular, muted, 7);
  const titleSize = wrap(p.titulo, 33, serif).length > 2 ? 28 : 33;
  text(p.titulo, titleSize, serif, ink, 7);
  text([p.zona, p.direccionAproximada].filter(Boolean).join(" · "), 10, regular, muted, 9);
  text(formatPrecio(p.precio), 23, serif, burgundy, 12);
  if (p.demo) text("Demostración · Datos y precio de ejemplo, sin oferta real.", 9, bold, burgundy, 8);

  // Use the first available property photograph as the cover, preserving order.
  let coverIndex = -1;
  let completeCover: { image: PDFImage; caption: string } | undefined;
  for (let index = 0; index < p.galeria.length; index++) {
    const image = await load(p.galeria[index].src);
    if (!image) continue;
    const naturalHeight = content * image.height / image.width;
    const photoHeight = Math.min(320, Math.max(270, naturalHeight));
    ensure(photoHeight + 18);
    if (photoHeight === naturalHeight) {
      photo(image, margin, y, content, photoHeight);
    } else {
      // Fill the wide cover for portrait/panoramic sources; retain the entire original in the gallery.
      const scale = Math.max(content / image.width, photoHeight / image.height);
      page.pushOperators(pushGraphicsState(), rectangle(margin, height - y - photoHeight, content, photoHeight), clip(), endPath());
      page.drawImage(image, { x: margin + (content - image.width * scale) / 2, y: height - y - photoHeight + (photoHeight - image.height * scale) / 2, width: image.width * scale, height: image.height * scale });
      page.pushOperators(popGraphicsState());
      completeCover = { image, caption: p.galeria[index].alt };
    }
    y += photoHeight + 18;
    coverIndex = index;
    break;
  }

  type Row = { value: string; font: PDFFont; size: number; color: typeof ink; space: number; href?: string };
  const row = (value: string, font = regular, size = 10.5, color = ink, space = 0): Row => ({ value, font, size, color, space });
  const linkedRow = (label: string, value: string, contact = false): Row[] => {
    const href = safeUrl(value, contact);
    return href ? [{ ...row(label, regular, 10, burgundy, 4), href }] : [];
  };
  const expand = (rows: Row[], max: number) => rows.flatMap(r => wrap(r.value, r.size, r.font, max).map((value, index, lines) => ({ ...r, value, space: index === lines.length - 1 ? r.space : 0 })));
  const rowHeight = (r: Row) => r.size * (r.font === serif ? 1.25 : 1.45) + r.space;
  const renderRows = (rows: Row[], x: number, top: number) => {
    for (const r of rows) {
      draw(r.value, x, top, r.size, r.font, r.color);
      // Each wrapped link line gets its own correctly positioned annotation.
      if (r.href) page.node.addAnnot(pdf.context.register(pdf.context.obj({
        Type: "Annot", Subtype: "Link", Rect: [x, height - top - r.size - 3, x + r.font.widthOfTextAtSize(r.value, r.size), height - top + 2], Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(r.href) },
      })));
      top += rowHeight(r);
    }
    return top;
  };

  // The cover follows the reference: narrative on the left, concise facts on the right.
  const leftWidth = 306, rightWidth = 176, rightX = width - margin - rightWidth;
  const specs: Row[] = [];
  for (const [label, value, source] of [["Construcción", p.ficha.construccionM2, p.informacionPublica?.fuenteConstruccion], ["Terreno", p.ficha.terrenoM2, p.informacionPublica?.fuenteTerreno]] as const) {
    if (value != null) specs.push(row(`${value} m²`, serif, 22), row(`${label} · ${source ? FUENTE_SUPERFICIE_LABELS[source] : "fuente por confirmar"}`, regular, 9, muted, 7));
  }
  if (p.ficha.recamaras != null) specs.push(row(`${p.ficha.recamaras} ${p.ficha.recamaras === 1 ? "recámara" : "recámaras"}`));
  if (p.ficha.banos != null) specs.push(row(`${p.ficha.banos} ${p.ficha.banos === 1 ? "baño" : "baños"}`));
  if (p.ficha.estacionamientos != null) specs.push(row(`${p.ficha.estacionamientos} ${p.ficha.estacionamientos === 1 ? "estacionamiento" : "estacionamientos"}`));
  if (p.ficha.antiguedad?.trim()) specs.push(row(`Antigüedad: ${p.ficha.antiguedad}`, regular, 9, muted));
  const specLines = expand(specs, rightWidth);
  const description = p.descripcion.filter(value => value.trim());
  if (specLines.length || description.length) {
    ensure(Math.min(195, Math.max(100, specLines.reduce((sum, r) => sum + rowHeight(r), 0))));
    const top = y;
    let narrativeY = top, factsY = top;
    const remaining = [...description];
    const narrativeWidth = specLines.length ? leftWidth : content;
    if (description.length) {
      draw("La propiedad", margin, narrativeY, 21, serif);
      narrativeY += 38;
      // Prefer complete paragraphs; a long opening still needs a readable cover excerpt.
      for (const paragraph of description) {
        const normalized = clean(paragraph).replace(/\s+/g, " ").trim();
        const paragraphRows = expand([row(normalized, regular, 10.5, ink, 8)], narrativeWidth);
        const blockHeight = paragraphRows.reduce((sum, r) => sum + rowHeight(r), 0);
        if (narrativeY + blockHeight > bottom) {
          if (remaining.length === description.length) {
            const count = Math.floor((bottom - narrativeY) / (10.5 * 1.45));
            const excerpt = paragraphRows.slice(0, count).map(r => ({ ...r, space: 0 }));
            narrativeY = renderRows(excerpt, margin, narrativeY);
            // Advance through the original normalized text, preserving even unbroken words.
            let offset = 0;
            for (const r of excerpt) {
              offset += r.value.length;
              if (normalized[offset] === " ") offset++;
            }
            remaining[0] = normalized.slice(offset);
            if (!remaining[0]) remaining.shift();
          }
          break;
        }
        narrativeY = renderRows(paragraphRows, margin, narrativeY);
        remaining.shift();
      }
    }
    let usedSpecs = 0;
    for (const r of specLines) {
      if (factsY + rowHeight(r) > bottom) break;
      factsY = renderRows([r], rightX, factsY);
      usedSpecs++;
    }
    y = Math.max(narrativeY, factsY) + 14;
    if (remaining.length || usedSpecs < specLines.length) {
      next();
      if (remaining.length) {
        section("La propiedad");
        remaining.forEach(paragraph => text(paragraph));
      }
      if (usedSpecs < specLines.length) {
        section("Distribución");
        for (const r of specLines.slice(usedSpecs)) text(r.value, r.size, r.font, r.color, r.space);
      }
    }
  }

  // Independent columns flow together across pages, so neither column can collide with a footer.
  const columns = (left: Row[], right: Row[]) => {
    const colWidth = (content - 32) / 2;
    const queues = [expand(left, colWidth), expand(right, colWidth)];
    if (!queues.some(q => q.length)) return;
    const blockHeight = Math.max(...queues.map(queue => queue.reduce((sum, r) => sum + rowHeight(r), 0)));
    // Reserve the actual short block, avoiding an extra page for a few contact lines.
    ensure(Math.min(112, blockHeight) + 10);
    y += 10;
    while (queues.some(q => q.length)) {
      const ends = queues.map((queue, index) => {
        let top = y;
        while (queue.length && top + rowHeight(queue[0]) <= bottom) {
          top = renderRows([queue.shift()!], margin + index * (colWidth + 32), top);
        }
        return top;
      });
      y = Math.max(...ends) + 16;
      if (queues.some(q => q.length)) next();
    }
  };
  columns(
    p.amenidades.length ? [row("Amenidades", serif, 21, ink, 9), ...p.amenidades.map(a => row(a, regular, 10, ink, 3))] : [],
    p.puntosDeInteres.length ? [row("Alrededores", serif, 21, ink, 9), row("Tiempo aproximado en auto", regular, 8.5, muted, 6), ...p.puntosDeInteres.map(point => row(`${point.lugar} · ${point.minutos} min`, regular, 10, ink, 3))] : []
  );
  if (p.operacion === "venta") text(p.creditoDisponible ? "Crédito sujeto a evaluación" : "Crédito: consultar con el asesor", 9, regular, muted, 10);
  section("Disponibilidad y entrega");
  if (p.informacionPublica?.disponibilidadRevisadaEl) {
    const checked = new Date(`${p.informacionPublica.disponibilidadRevisadaEl}T12:00:00Z`);
    text(`Disponibilidad revisada el ${checked.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. Confirmar antes de programar una visita.`, 9.5);
  } else text("Confirmar disponibilidad antes de programar una visita.", 9.5);
  if (p.informacionPublica?.ocupacionEntrega) text(p.informacionPublica.ocupacionEntrega, 9.5);

  // A compact gallery, two complete photographs per row; broken images leave no filler blocks.
  const gallery: { image: PDFImage; caption: string }[] = completeCover ? [completeCover] : [];
  const galleryRow = () => {
    const gap = 18, cell = gallery.length === 1 ? content : (content - gap) / 2;
    const boxes = gallery.map(item => Math.min(gallery.length === 1 ? 218 : 162, cell * item.image.height / item.image.width));
    const photoHeight = Math.max(...boxes);
    const captions = gallery.map(item => wrap(item.caption, 8, regular, cell));
    // Very long alt text remains available, but flows below the images across pages.
    const captionHeight = Math.max(...captions.map(lines => lines.length)) * 11;
    ensure(photoHeight + Math.min(captionHeight, 66) + 18);
    gallery.forEach((item, index) => photo(item.image, margin + index * (cell + gap), y, cell, photoHeight));
    y += photoHeight + 6;
    const maxLines = Math.max(...captions.map(lines => lines.length));
    for (let line = 0; line < maxLines; line++) {
      ensure(11);
      captions.forEach((lines, index) => { if (lines[line]) draw(lines[line], margin + index * (cell + gap), y, 8, regular, muted); });
      y += 11;
    }
    y += 18;
    gallery.length = 0;
  };
  for (const entry of p.galeria.slice(coverIndex + 1)) {
    // If no cover could load, those sources have already been attempted.
    if (coverIndex < 0) break;
    const image = await load(entry.src);
    if (image) gallery.push({ image, caption: entry.alt });
    if (gallery.length === 2) galleryRow();
  }
  if (gallery.length) galleryRow();

  const contactRows: Row[] = [row("Contacto", serif, 21, ink, 9)];
  if (options.adviser) {
    contactRows.push(row(options.adviser.nombre, bold, 11, ink, 1));
    if (options.adviser.cargo) contactRows.push(row(options.adviser.cargo, regular, 9, muted, 7));
  }
  const contact = publicContact(options.settings);
  if (contact.phoneHref) contactRows.push(...linkedRow(`Teléfono: ${contact.phone}`, contact.phoneHref, true));
  if (contact.email) contactRows.push(...linkedRow(`Correo: ${contact.email}`, `mailto:${contact.email}`, true));
  if (contact.whatsapp) {
    const number = new URL(contact.whatsapp).pathname.replace(/\//g, "");
    contactRows.push(...linkedRow(`WhatsApp: +${number}`, contact.whatsapp));
  }
  if (options.settings?.horario) contactRows.push(row(options.settings.horario, regular, 9, muted, 7));
  contactRows.push(...linkedRow(`Sitio web: ${new URL(options.siteUrl).hostname}`, options.siteUrl));
  const date = new Date(p.publicadaEl);
  if (!Number.isNaN(date.getTime())) contactRows.push(row(`Publicado el ${date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`, regular, 8, muted, 0));
  // This is the complete printed property sheet, not a directory of other downloads.
  // Surfaces, layout, amenities and descriptions are rendered above from the public record.
  columns(contactRows, []);
  const pages = pdf.getPages();
  pages.forEach((sheet, index) => {
    page = sheet;
    const footer = `Fortius · ${p.codigo}${p.demo ? " · Demostración" : ""}`;
    wrap(footer, 8, regular, content - 70).slice(0, 2).forEach((line, i) => draw(line, margin, height - body.footer - 24 + i * 10, 8, regular, muted));
    drawFortiusLetterhead(sheet,art,bold,'Ficha técnica',index+1,pages.length);
  });
  return pdf.save();
}
