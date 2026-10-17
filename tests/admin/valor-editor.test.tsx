import { expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { formatoById } from "@/lib/formatos/catalog";

it("muestra las tablas de comparables y los resultados, sin registro de revisión", () => {
  const onChange = vi.fn();
  render(<FormatoEditor definition={formatoById("07")} values={{ baseMercado: "Construcción", pesoMercado: 100, pesoIngresos: 0, pesoFisico: 0 }} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Agregar comparable de inmueble construido" }));
  expect(onChange).toHaveBeenCalledWith("comparablesConstruccion", expect.any(Array));
  expect(screen.getByRole("button", { name: "Agregar comparable de renta" })).toBeTruthy();
  expect(screen.getByText("Valor comercial concluido (MXN)")).toBeTruthy();
  expect(screen.getByText(/Puedes descargar el PDF y el Excel con lo que lleves/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Registrar revisión/ })).toBeNull();
});

it("explica cada sección y campo de antecedentes y ofrece listas y plantillas", () => {
  cleanup();
  const onChange = vi.fn();
  render(<FormatoEditor definition={formatoById("07")} values={{ inmueble: "Calle Uno 10, Tijuana", propietario: "Ana Ruiz" }} onChange={onChange} />);
  expect(screen.getByText(/Quién pide la opinión, de qué inmueble/)).toBeTruthy();
  expect(screen.getByLabelText("Fecha de valor").getAttribute("aria-describedby")).toBe("formato-fechaValor-ayuda");
  expect(document.getElementById("formato-fechaValor-ayuda")?.textContent).toMatch(/normalmente el de la visita/);
  fireEvent.click(screen.getByRole("button", { name: "Qué poner en «Fecha de valor»" }));
  expect(screen.getByRole("button", { name: "Qué poner en «Fecha de valor»" }).getAttribute("aria-expanded")).toBe("true");
  fireEvent.change(screen.getByRole("combobox", { name: "Usar una plantilla en «Propósito / uso previsto»" }), { target: { value: "Precio de salida" } });
  expect(onChange).toHaveBeenCalledWith("proposito", expect.stringContaining("Ana Ruiz defina el precio de salida"));
  // Las listas de la plantilla: tipo de inmueble.
  fireEvent.change(screen.getByLabelText("Inmueble objeto de la opinión"), { target: { value: "Casa" } });
  expect(onChange).toHaveBeenCalledWith("tipoInmueble", "Casa");
  // El uso de suelo se elige de la lista del reglamento; «Otro» deja escribir.
  const uso = screen.getByLabelText("Uso o destino actual");
  fireEvent.change(uso, { target: { value: "Habitacional" } });
  expect(onChange).toHaveBeenCalledWith("usoActual", "Habitacional");
  fireEvent.change(uso, { target: { value: "__otro" } });
  expect(screen.getByPlaceholderText("Escribe la respuesta")).toBeTruthy();
});
