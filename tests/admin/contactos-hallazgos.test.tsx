import * as React from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { nextStep, type ContactRow } from "@/lib/admin/contacts-view";
import { suggestedTemplate } from "@/lib/admin/message-templates";
import { projectFollowups } from "@/lib/admin/followups";
import { ContactPreview } from "@/components/admin/contacts/contact-preview";
import type { Cliente, Lead } from "@/lib/admin/store";
import type { Task } from "@/lib/tasks";

afterEach(cleanup);
const hoy = "2026-11-12";
const lead = (over: Partial<Lead> = {}) => ({ id: "l1", nombre: "Prospecto de ensayo", telefono: "6640000000", origen: "contacto", estado: "nuevo", asesorId: "a1", creadoEl: "2026-11-01T18:00:00.000Z", notas: [], ...over }) as unknown as Lead;

/*
  BUG-C51: `nextStep` no mira el estado. Un prospecto descartado con un próximo contacto vencido sale
  en Contactos («Toca hoy o se atrasó», «Vencido · 1 nov») y en su ficha, mientras Hoy y Agenda
  (projectFollowups) ya lo excluyen.
*/
test("un prospecto descartado no tiene siguiente paso", () => {
  const descartado = lead({ estado: "descartado", perfil: { proximoContacto: "2026-11-01", proximaAccion: "Llamarle" } } as Partial<Lead>);
  expect(nextStep(descartado, "lead", [], [], hoy)).toBeNull();
});

/*
  BUG-C52: «Mensajes listos» sugiere por defecto un mensaje que exige un inmueble a quien no tiene
  ninguno: tras «Mandé WhatsApp», «confirmar-vio»; tras «Visitó», «despues-visita». La opción sale
  deshabilitada y «Abrir en WhatsApp» queda gris hasta elegir otra.
*/
test("sin inmueble no se sugieren los mensajes que hablan de un inmueble", () => {
  expect(suggestedTemplate({ unattended: false, hasProperty: false, lastContact: "whatsapp" })).not.toBe("confirmar-vio");
  expect(suggestedTemplate({ unattended: false, hasProperty: false, visited: true })).not.toBe("despues-visita");
});

/*
  BUG-C53: al convertir, el «próximo contacto» se copia al cliente, pero la tarea de siguiente paso
  creada como prospecto lleva solo `leadId`. projectFollowups no la reconoce como del cliente y la
  Agenda muestra la tarea y además «Seguimiento: <cliente>» el mismo día.
*/
test("tras convertir, la tarea de siguiente paso del prospecto cubre el seguimiento del cliente", () => {
  const convertido = lead({ clienteId: "c1", estado: "cerrado" } as Partial<Lead>);
  const cliente = { id: "c1", nombre: "Cliente de ensayo", leadId: "l1", asesorId: "a1", perfil: { proximoContacto: "2026-11-14" } } as unknown as Cliente;
  const tarea = { id: "t1", titulo: "Enviarle opciones", descripcion: "", categoria: "leads", estado: "pendiente", prioridad: "normal", pasos: [], leadId: "l1", vence: "2026-11-14" } as unknown as Task;
  expect(projectFollowups([convertido], [cliente], undefined, [tarea])).toEqual([]);
});

/*
  BUG-C54: la vista previa de Contactos toma `notas.slice(-3).reverse()`, pero las notas se guardan
  de la más nueva a la más vieja: «Actividad» muestra las tres más antiguas.
*/
test("la vista previa muestra las notas más recientes", () => {
  const notas = ["quinta", "cuarta", "tercera", "segunda", "primera"].map((texto, i) => ({ id: `n${i}`, texto, fecha: `2026-11-0${5 - i}T18:00:00.000Z` }));
  const conNotas = lead({ notas } as Partial<Lead>);
  const row = { id: "l1", kind: "lead", href: "/admin/leads/l1", name: "Prospecto de ensayo", phone: "6640000000", wants: "", zone: "", budget: null, step: "", when: null, late: false, sort: "" } as ContactRow;
  render(<ContactPreview row={row} lead={conNotas} tasks={[]} events={[]} today={hoy} />);
  expect(screen.queryByText("quinta")).not.toBeNull();
  expect(screen.queryByText("primera")).toBeNull();
});
