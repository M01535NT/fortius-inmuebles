import { expect } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";

/*
  Elegir una opción de un `Select` de Radix (DEC-52) en jsdom: el botón se abre con el teclado y la
  opción se elige con Enter, como lo haría un usuario sin ratón.
*/
export async function pickOption(trigger: HTMLElement, option: string | RegExp) {
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter" });
  const item = await screen.findByRole("option", { name: option });
  fireEvent.keyDown(item, { key: "Enter" });
  // Radix devuelve el foco al botón después de cerrar; se espera para que no cierre la siguiente ventanita.
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  await act(() => new Promise(resolve => setTimeout(resolve, 0)));
}

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/*
  Elegir una fecha («AAAA-MM-DD») en un `DateField` (DEC-52): abre el calendario, avanza o retrocede
  de mes hasta el de la fecha y pulsa el día, como lo haría el usuario.
*/
export async function pickDate(trigger: HTMLElement, iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  fireEvent.click(trigger);
  await screen.findByRole("grid");
  // El calendario se vuelve a montar al cambiar de mes: se busca de nuevo en cada paso.
  const calendar = () => screen.getByRole("grid").closest("[data-slot=calendar]") as HTMLElement;
  for (let i = 0; i < 120; i++) {
    const root = calendar();
    const caption = (root.querySelector("[role=status], .rdp-caption_label")?.textContent ?? "").toLowerCase();
    const shownMonth = MONTHS.findIndex(name => caption.includes(name)), shownYear = Number(/\d{4}/.exec(caption)?.[0]);
    const diff = (y - shownYear) * 12 + (m - 1 - shownMonth);
    if (diff === 0) break;
    const nav = [...root.querySelectorAll<HTMLButtonElement>("button")].find(b => /siguiente|next/i.test(b.getAttribute("aria-label") ?? "") === diff > 0 && /anterior|previous|siguiente|next/i.test(b.getAttribute("aria-label") ?? ""));
    if (!nav) throw new Error(`No hay botón para cambiar de mes (${caption})`);
    fireEvent.click(nav);
  }
  // react-day-picker marca cada día con «dd/MM/aaaa» en `data-day`; los días de otros meses van aparte.
  const p2 = (n: number) => String(n).padStart(2, "0");
  const keys = [`${p2(d)}/${p2(m)}/${y}`, `${d}/${m}/${y}`];
  const day = [...calendar().querySelectorAll<HTMLButtonElement>("button[data-day]")].find(b => keys.includes(b.dataset.day ?? "") && !b.closest("[data-outside]"));
  if (!day) throw new Error(`No aparece el día ${iso}`);
  fireEvent.click(day);
  await waitFor(() => expect(screen.queryByRole("grid")).toBeNull());
  await act(() => new Promise(resolve => setTimeout(resolve, 0)));
}

/** Elegir en un `Combobox` (Popover + cmdk): abre, escribe para buscar y elige con Enter. */
export async function pickCombo(trigger: HTMLElement, search: string) {
  fireEvent.click(trigger);
  const input = await screen.findByRole("combobox", { name: (_, el) => el.tagName === "INPUT" });
  fireEvent.change(input, { target: { value: search } });
  // Espera a que la lista tenga la opción (los datos pueden seguir cargando).
  await screen.findByRole("option", { name: (name: string) => name.toLowerCase().includes(search.toLowerCase()) });
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  await act(() => new Promise(resolve => setTimeout(resolve, 0)));
}
