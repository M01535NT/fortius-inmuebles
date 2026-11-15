import { fireEvent, screen } from "@testing-library/react";

/*
  Ayudas de prueba para las piezas del kit en Agenda y Tareas (DEC-52): el campo de fecha guarda su
  valor en un campo oculto y se elige en el calendario; el selector de Radix se abre con un clic y
  se elige la opción; el menú «⋯» se abre con Enter.
*/

/** Valor «AAAA-MM-DD» de un campo de fecha del kit por su `name`. */
export function dateValue(name = "fecha") {
  return (document.querySelector<HTMLInputElement>(`input[type=hidden][name="${name}"]`))?.value ?? "";
}

/** Valor del campo oculto de un selector con buscador (`Combobox`) por su `name`. */
export function hiddenValue(name: string) {
  return (document.querySelector<HTMLInputElement>(`input[type=hidden][name="${name}"]`))?.value ?? "";
}

const dayKey = (iso: string) => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))).toLocaleDateString("es-MX");

/** Abre el campo de fecha etiquetado `label`, va al mes de `iso` y elige ese día. */
export function chooseDate(label: string, iso: string) {
  fireEvent.click(screen.getByLabelText(label));
  const target = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, 1);
  for (let i = 0; i < 36; i++) {
    const calendars = document.querySelectorAll<HTMLElement>("[data-slot=calendar]");
    const calendar = calendars[calendars.length - 1];
    const inMonth = [...calendar.querySelectorAll<HTMLElement>("td:not([data-outside]) button[data-day]")];
    const [d, m, y] = inMonth[0].dataset.day!.split("/").map(Number);
    const diff = (target.getFullYear() - y) * 12 + (target.getMonth() - (m - 1));
    void d;
    if (diff === 0) {
      const day = inMonth.find(button => button.dataset.day === dayKey(iso));
      if (!day) throw new Error(`No aparece el día ${iso}`);
      fireEvent.click(day);
      return;
    }
    const nav = [...calendar.querySelectorAll<HTMLButtonElement>("nav button")];
    fireEvent.click(diff < 0 ? nav[0] : nav[nav.length - 1]);
  }
  throw new Error(`No se llegó al mes de ${iso}`);
}

/** Elige `option` en el selector de Radix etiquetado `label`. */
export function chooseOption(label: string, option: string | RegExp) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

/** Abre el menú «⋯» `label` y elige `item`. */
export function chooseMenu(label: string, item: string | RegExp) {
  fireEvent.keyDown(screen.getByRole("button", { name: label }), { key: "Enter" });
  fireEvent.click(screen.getByRole("menuitem", { name: item }));
}
