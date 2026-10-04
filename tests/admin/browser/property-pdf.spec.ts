import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

for (const width of [390, 1280]) {
  test(`gallery downloads the current property PDF at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 912 });
    await page.goto("/inventario/residencia-vista-al-mar-playas");
    const gallery = page.getByRole("group", { name: "Modo de galería", exact: true });
    const button = gallery.getByRole("link", { name: "Ficha técnica (descargar PDF)", exact: true });
    await expect(button).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const downloaded = page.waitForEvent("download");
    await button.click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe("fortius-ficha-residencia-vista-al-mar-playas.pdf");
    expect(await download.failure()).toBeNull();
    await download.saveAs(testInfo.outputPath("ficha-fortius.pdf"));
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    const pdf = await PDFDocument.load(Buffer.concat(chunks));
    expect(pdf.getTitle()).toContain("Residencia con vista al mar");
    expect(pdf.getAuthor()).toBe("Fortius Inmuebles");
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    await expect(page).toHaveURL(/\/inventario\/residencia-vista-al-mar-playas$/);
  });
}
