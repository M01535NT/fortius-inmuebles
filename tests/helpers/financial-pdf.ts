import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
} from "pdf-lib";
export function financialPdfPages(pdf: PDFDocument): string[] {
  return pdf.getPages().map((page) => {
    const fonts = page.node.Resources()?.lookup(PDFName.of("Font"), PDFDict);
    const mappings = new Map<string, Map<string, string>>();
    for (const [name, ref] of fonts?.entries() ?? []) {
      const font = pdf.context.lookup(ref, PDFDict);
      const cmap = font.lookup(PDFName.of("ToUnicode"));
      if (!(cmap instanceof PDFRawStream)) continue;
      const raw = new TextDecoder().decode(decodePDFRawStream(cmap).decode());
      const mapping = new Map<string, string>();
      for (const chars of raw.matchAll(/beginbfchar([\s\S]*?)endbfchar/g))
        for (const match of chars[1].matchAll(
          /<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi,
        )) {
          const codes = match[2].match(/.{4}/g) ?? [];
          mapping.set(
            match[1].toUpperCase(),
            String.fromCharCode(...codes.map((s) => parseInt(s, 16))),
          );
        }
      mappings.set(name.asString().slice(1), mapping);
    }
    const contents = page.node.Contents();
    const streams =
      contents instanceof PDFArray
        ? contents.asArray().map((s) => pdf.context.lookup(s))
        : [contents];
    let font = "";
    const text: string[] = [];
    for (const stream of streams) {
      if (!(stream instanceof PDFRawStream)) continue;
      const raw = new TextDecoder().decode(decodePDFRawStream(stream).decode());
      for (const m of raw.matchAll(
        /\/([^\s/]+)\s+[\d.]+\s+Tf|<([\da-f]+)>\s*Tj/gi,
      )) {
        if (m[1]) {
          font = m[1];
          continue;
        }
        const map = mappings.get(font);
        text.push(
          map
            ? (m[2].match(/.{4}/g) ?? [])
                .map((s) => map.get(s.toUpperCase()) ?? "?")
                .join("")
            : Buffer.from(m[2], "hex").toString("latin1"),
        );
      }
    }
    return text.join("\n");
  });
}
