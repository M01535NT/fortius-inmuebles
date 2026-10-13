import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { LeadBoard } from "@/components/admin/workspace/lead-board";
import type { Lead } from "@/lib/admin/store";
afterEach(cleanup);
const base: Lead = { id:"one", nombre:"Ana López", telefono:"6641234567", estado:"nuevo", origen:"manual", creadoEl:"2026-10-13", notas:[] };
test("the inspector follows selection and shows recorded budget without inventing missing values", () => {
  render(<LeadBoard leads={[base,{...base,id:"two",nombre:"Carlos Medina",estado:"contactado",perfil:{presupuestoMax:3500000,moneda:"MXN",proximoContacto:"2026-10-15"}}]}/>);
  const inspector = within(screen.getByRole("complementary",{name:"Resumen del prospecto"}));
  expect(inspector.getByRole("heading",{name:"Ana López"})).toBeTruthy();
  expect(inspector.getAllByText("Sin registrar").length).toBe(1);
  fireEvent.click(screen.getByRole("button",{name:"Ver resumen de Carlos Medina"}));
  expect(inspector.getByRole("heading",{name:"Carlos Medina"})).toBeTruthy();
  expect(inspector.getByText("3,500,000 MXN")).toBeTruthy();
  expect(inspector.getByRole("link",{name:"Abrir ficha completa"}).getAttribute("href")).toBe("/admin/leads/two");
});
test("a converted lead links to its client and exposes no prospect-stage mutation", () => {
  render(<LeadBoard leads={[{...base,clienteId:"client-one"}]}/>);
  const inspector = within(screen.getByRole("complementary",{name:"Resumen del prospecto"}));
  expect(inspector.getByRole("link",{name:"Abrir ficha completa"}).getAttribute("href")).toBe("/admin/clientes/client-one");
  expect(inspector.queryByRole("combobox")).toBeNull();
});
