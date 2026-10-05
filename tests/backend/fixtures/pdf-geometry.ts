import { decodePDFRawStream, PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream } from "pdf-lib";

// Inspect actual emitted text operators and embedded CID advance widths.
export async function lastPageGeometry(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPages().at(-1)!;
  const contents = page.node.Contents();
  const streams = contents instanceof PDFArray ? contents.asArray().map(ref => pdf.context.lookup(ref) as PDFRawStream) : [contents as PDFRawStream];
  const operators = streams.map(stream => Buffer.from(decodePDFRawStream(stream).decode()).toString("latin1")).join("\n");
  const fonts = page.node.Resources()!.lookup(PDFName.of("Font"), PDFDict);
  const text = [...operators.matchAll(/BT\s+([\s\S]*?)ET/g)].map(match => {
    const block = match[1];
    const face = /\/([^\s]+) ([\d.]+) Tf/.exec(block)!;
    const position = /1 0 0 1 ([\d.-]+) ([\d.-]+) Tm/.exec(block)!;
    const encoded = /<([0-9A-Fa-f]+)> Tj/.exec(block)?.[1] ?? "";
    const font = fonts.lookup(PDFName.of(face[1]), PDFDict).lookup(PDFName.of("DescendantFonts"), PDFArray).lookup(0, PDFDict);
    const widths = font.lookup(PDFName.of("W"), PDFArray);
    const advances = new Map<number, number>();
    for (let index = 0; index < widths.size();) {
      const start = widths.lookup(index++, PDFNumber).asNumber();
      const next = widths.lookup(index++);
      if (next instanceof PDFArray) next.asArray().forEach((w, offset) => advances.set(start + offset, (w as PDFNumber).asNumber()));
      else { const end = (next as PDFNumber).asNumber(); const width = widths.lookup(index++, PDFNumber).asNumber(); for (let code = start; code <= end; code++) advances.set(code, width); }
    }
    const size = Number(face[2]);
    const width = (encoded.match(/.{4}/g) ?? []).reduce((sum, code) => sum + (advances.get(parseInt(code, 16)) ?? 1000), 0) * size / 1000;
    return { x: Number(position[1]), y: Number(position[2]), size, width, offset: match.index! };
  });
  return { operators, text };
}
