import { describe, expect, it } from "vitest";

import type { Cliente } from "@/lib/backend/contracts";
import type { Evento } from "@/lib/domain/records";
import { citasDelDia } from "@/lib/panel/datos/agenda";
import { datosDeCita, editarCita, esDelPanel, nuevaCita, nuevaDesdeDireccion, type DatosCita } from "@/lib/panel/datos/agenda-acciones";
import { relacionadoCita } from "@/lib/panel/datos/relacionado";
import { personaDeTramite, tareaDeTramite } from "@/lib/panel/datos/tramites";
import { nuevoTramiteGuia } from "@/lib/panel/datos/tramites-guias";
import { datosDeLinea, leerLinea } from "@/lib/panel/linea-cita";
import { nuevoTramite, tramiteCualquieraSchema, tramiteSchema } from "@/lib/tramites";

// Panel 19: la Agenda y Trámites ligan a la persona del Directorio y al asunto del panel; lo de antes, con su cliente,
// se queda como estaba. Solo datos de ejemplo.
const P = "5a19aaaa-0000-4000-8000-000000000001";
const A = "5a19bbbb-0000-4000-8000-000000000002";
const q = (o: Record<string, string>) => new URLSearchParams(o);
const base: DatosCita = { tipo: "visita", titulo: "", fecha: "2026-11-25", hora: 600, clienteId: "", propiedadSlug: "", notas: "", asesorId: "ase-1" };

describe("una cita desde la dirección", () => {
  it("la persona y el asunto del panel van a sus campos nuevos", () => {
    expect(nuevaDesdeDireccion(q({ persona: P.toUpperCase(), asunto: A }))).toMatchObject({ personaId: P, asuntoId: A, clienteId: "", expedienteId: "" });
  });
  it("los ids de antes siguen yendo al cliente y al expediente", () => {
    expect(nuevaDesdeDireccion(q({ persona: "cli-1", asunto: "exp-1" }))).toMatchObject({ clienteId: "cli-1", expedienteId: "exp-1", personaId: "", asuntoId: "" });
  });
  it("sin persona, asunto ni inmueble no hay cita que abrir; un valor raro se ignora", () => {
    expect(nuevaDesdeDireccion(q({}))).toBeNull();
    expect(nuevaDesdeDireccion(q({ persona: "<x>" }))).toBeNull();
    expect(esDelPanel(P)).toBe(true);
    expect(esDelPanel("cli-1")).toBe(false);
  });
});

describe("guardar y releer una cita con persona y asunto", () => {
  it("se guardan, se releen y se quitan al borrarlos", () => {
    const e = nuevaCita({ ...base, personaId: P, asuntoId: A }, "Ana", "cita-1");
    expect(e).toMatchObject({ personaId: P, asuntoId: A });
    expect(e.clienteId).toBeUndefined();
    expect(datosDeCita(e)).toMatchObject({ personaId: P, asuntoId: A, clienteId: "" });
    const sin = editarCita(e, { ...datosDeCita(e), personaId: "", asuntoId: "" });
    expect(sin.personaId).toBeUndefined();
    expect(sin.asuntoId).toBeUndefined();
  });
  it("una cita de antes conserva su cliente y no gana campos", () => {
    const e = nuevaCita({ ...base, clienteId: "cli-1" }, "Ana", "cita-2");
    expect(e.clienteId).toBe("cli-1");
    expect("personaId" in e || "asuntoId" in e).toBe(false);
    expect("personaId" in datosDeCita(e)).toBe(false);
  });
  it("la lista del día lleva la persona y el asunto", () => {
    const e: Evento = { id: "c", titulo: "Visita", fecha: "2026-11-25", tipo: "visita", personaId: P, asuntoId: A };
    expect(citasDelDia([e], "2026-11-25")[0]).toMatchObject({ personaId: P, asuntoId: A });
    expect("personaId" in citasDelDia([{ ...e, personaId: undefined, asuntoId: undefined }], "2026-11-25")[0]).toBe(false);
  });
});

describe("una cita escrita en una línea", () => {
  const hoy = new Date(2026, 10, 19);
  it("la persona del Directorio va a personaId; un cliente de antes, a clienteId", () => {
    const delPanel = datosDeLinea(leerLinea("Visita con Ana mañana 4pm", hoy, [{ id: P, nombre: "Ana López" }]), hoy);
    expect(delPanel).toMatchObject({ personaId: P, clienteId: "" });
    const deAntes = datosDeLinea(leerLinea("Visita con Ana mañana 4pm", hoy, [{ id: "cli-1", nombre: "Ana López" }]), hoy);
    expect(deAntes.clienteId).toBe("cli-1");
    expect("personaId" in deAntes).toBe(false);
  });
});

describe("con quién es una cita", () => {
  const clientes: Cliente[] = [{ id: "cli-1", nombre: "Cliente de antes", telefono: "6640000000", tipo: "propietario", asesorId: "ase-1", notas: "", creadoEl: "2026-11-01", actualizadoEl: "2026-11-01" }];
  it("primero la persona del Directorio, luego el cliente de antes", () => {
    const d = { clientes, leads: [], inmuebles: [], personas: [{ id: P, nombre: "Ana López", detalle: "Vendedora" }] };
    expect(relacionadoCita({ personaId: P, clienteId: "cli-1" }, d)[0].enlaces[0]).toMatchObject({ id: P, texto: "Ana López", detalle: "Vendedora" });
    expect(relacionadoCita({ clienteId: "cli-1" }, d)[0].enlaces[0]).toMatchObject({ id: "cli-1", texto: "Cliente de antes" });
    // Sin la lista del Directorio, una cita con persona y cliente muestra al cliente.
    expect(relacionadoCita({ personaId: P, clienteId: "cli-1" }, { clientes, leads: [], inmuebles: [] })[0].enlaces[0].id).toBe("cli-1");
  });
});

describe("un trámite con la persona del Directorio", () => {
  it("la hipoteca lleva a la persona como propietario y su cliente queda vacío", () => {
    const t = nuevoTramite({ id: "tr-1", acreedor: "banco", titulo: "Casa de ejemplo", personaId: P, asesorId: "ase-1" });
    expect(t).toMatchObject({ personaId: P, clienteId: "" });
    expect(tramiteSchema.safeParse(t).success).toBe(true);
  });
  it("sin cliente ni persona, la hipoteca pide propietario", () => {
    const r = tramiteSchema.safeParse(nuevoTramite({ id: "tr-2", acreedor: "banco", titulo: "Casa", asesorId: "ase-1" }));
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]).toMatchObject({ message: "Elige al propietario", path: ["personaId"] });
  });
  it("con el cliente de antes, la hipoteca sigue igual", () => {
    const t = nuevoTramite({ id: "tr-3", acreedor: "infonavit", titulo: "Casa", clienteId: "cli-1", asesorId: "ase-1" });
    expect(t.clienteId).toBe("cli-1");
    expect("personaId" in t).toBe(false);
    expect(tramiteSchema.safeParse(t).success).toBe(true);
  });
  it("una guía puede llevar persona o ninguna", () => {
    const conPersona = nuevoTramiteGuia({ id: "tr-4", tipo: "servicios", titulo: "Servicios", personaId: P, asesorId: "ase-1" });
    const sola = nuevoTramiteGuia({ id: "tr-5", tipo: "avaluo", titulo: "Avalúo", asesorId: "ase-1" });
    expect(conPersona.personaId).toBe(P);
    expect("personaId" in sola).toBe(false);
    expect(tramiteCualquieraSchema.safeParse(conPersona).success).toBe(true);
    expect(tramiteCualquieraSchema.safeParse(sola).success).toBe(true);
    expect(tramiteCualquieraSchema.safeParse({ ...sola, personaId: "cli-1" }).success).toBe(false);
  });
  it("se busca primero a la persona del Directorio y después al cliente de antes", () => {
    const personas = [{ id: P, nombre: "Ana López" }, { id: "cli-1", nombre: "Cliente de antes" }];
    expect(personaDeTramite({ personaId: P, clienteId: "cli-1" }, personas)?.nombre).toBe("Ana López");
    expect(personaDeTramite({ clienteId: "cli-1" }, personas)?.nombre).toBe("Cliente de antes");
    expect(personaDeTramite({ clienteId: "" }, personas)).toBeNull();
  });
  it("la cita de un pendiente con hora lleva a la persona; la tarea no", () => {
    const t = nuevoTramite({ id: "tr-6", acreedor: "banco", titulo: "Casa", personaId: P, asesorId: "ase-1" });
    const r = tareaDeTramite(t, { texto: "Ir al banco", vence: "2026-11-30", hora: "10:00" });
    expect(r.cita?.personaId).toBe(P);
    expect("personaId" in r.tarea).toBe(false);
  });
});
