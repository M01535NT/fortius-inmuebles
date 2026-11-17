import { expect, type Locator, type Page } from "@playwright/test";

/*
  LV-10 (DEC-52): las listas y fechas del panel pasaron de controles nativos a Radix y shadcn/ui.
  Estos ayudantes eligen como lo haría una persona (abrir, pulsar la opción o el día) y comprueban
  que el campo muestre lo elegido. Si el campo sigue siendo un <select> nativo, se usa selectOption.
*/

/** Elige `option` en un selector (Radix Select o <select> nativo) y comprueba que quedó elegido. */
export async function choose(page: Page, field: Locator, option: string) {
  if (await field.evaluate(el => el.tagName === "SELECT")) {
    await field.selectOption({ label: option });
    await expect(field.locator("option:checked")).toHaveText(option);
    return;
  }
  await field.click();
  await page.getByRole("listbox").getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(field).toContainText(option);
}

/** Elige el día 15 del mes siguiente en un DateField (Popover + Calendar) y comprueba que ya no está vacío. */
export async function pickNextMonthDay(page: Page, field: Locator, placeholder = "Elegir fecha") {
  await field.click();
  const calendar = page.getByRole("dialog").filter({ has: page.getByRole("grid") });
  await calendar.getByRole("button", { name: /siguiente/i }).click();
  await calendar.getByRole("gridcell").getByRole("button", { name: /\b15\b/ }).first().click();
  await expect(calendar).toHaveCount(0);
  await expect(field).not.toContainText(placeholder);
}
