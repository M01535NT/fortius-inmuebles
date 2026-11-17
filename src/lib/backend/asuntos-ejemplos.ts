import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { cambiarAsunto, crearAsunto, crearEnParte } from "./asuntos";
import type { EnQueVa, Encargo, Papel, Quien } from "./asuntos-contrato";
import type { StaffUser } from "./contracts";
import { ApiError } from "./http";

/**
 * Los seis casos de docs/casos-reales.md como asuntos de ejemplo, para probar el panel (autorización del 17/10/2026:
 * la base tiene solo datos de prueba). Nombres inventados; todo queda marcado como ejemplo.
 * No repite: si ya hay un asunto de ejemplo con el mismo nombre, lo salta.
 */

type Persona = { nombre: string; papel: Papel; telefono?: { pais: string; numero: string }; fallecida?: boolean; clase?: "persona" | "empresa" | "institucion" };
type Caso = {
  nombre: string; encargos: Encargo[]; en_que_va: EnQueVa; personas: Persona[];
  etapas: { nombre: string; tareas: { titulo: string; quien?: Quien; dias?: number; hora?: string }[] }[];
  notas: { clase: "nota" | "decision"; texto: string }[];
  espera?: { motivo: string; dias: number };
};

const CASOS: Caso[] = [
  {
    nombre: "Casa en la Murúa", encargos: ["revisar"], en_que_va: "estudio",
    personas: [
      { nombre: "Laura Méndez (ejemplo)", papel: "contacto", telefono: { pais: "+1", numero: "6195550142" } },
      { nombre: "Rosa Méndez (ejemplo)", papel: "titular", fallecida: true },
      { nombre: "Jorge Méndez (ejemplo)", papel: "heredero" },
      { nombre: "Ana Méndez (ejemplo)", papel: "heredero" },
    ],
    etapas: [
      { nombre: "Revisión jurídica", tareas: [
        { titulo: "Consultar el adeudo de predial", dias: 0 },
        { titulo: "Pedir acta de defunción de la titular", quien: "cliente", dias: 2 },
        { titulo: "Averiguar quién ocupa la casa", dias: 5 },
      ] },
    ],
    notas: [{ clase: "nota", texto: "Llamó desde Estados Unidos. Puede venir a México cuando haga falta." }],
  },
  {
    nombre: "Terreno con sentencia de prescripción", encargos: ["revisar", "comercializar"], en_que_va: "estudio",
    personas: [{ nombre: "Lic. Ramírez (ejemplo)", papel: "abogado", telefono: { pais: "+52", numero: "6641234501" } }],
    etapas: [{ nombre: "Estudio", tareas: [
      { titulo: "Pedir los documentos que faltan", quien: "abogado", dias: 1 },
      { titulo: "Ir a ver el terreno", dias: 4 },
    ] }],
    notas: [{ clase: "nota", texto: "Mandó el levantamiento certificado, la sentencia y el avalúo." }],
  },
  {
    nombre: "Departamento con reserva de dominio", encargos: ["asesorar"], en_que_va: "en_marcha",
    personas: [
      { nombre: "Carlos Duarte (ejemplo)", papel: "propietario", telefono: { pais: "+52", numero: "6641234502" } },
      { nombre: "Nora Delgado (ejemplo)", papel: "inversionista", telefono: { pais: "+52", numero: "6641234503" } },
      { nombre: "Comprador que incumplió (ejemplo)", papel: "contraparte" },
    ],
    etapas: [
      { nombre: "Rescisión", tareas: [{ titulo: "Firmar la rescisión por convenio", dias: 3, hora: "11:00" }] },
      { nombre: "Rehabilitación", tareas: [{ titulo: "Presupuesto de obra", quien: "otro", dias: 15 }] },
    ],
    notas: [{ clase: "decision", texto: "La inversionista paga la rescisión y se queda con el departamento para venderlo." }],
  },
  {
    nombre: "Cinco locales de Plaza del Lago", encargos: ["comercializar"], en_que_va: "en_marcha",
    personas: [{ nombre: "Patricia Lagos (ejemplo)", papel: "propietario", telefono: { pais: "+52", numero: "6641234504" } }],
    etapas: [{ nombre: "Renta de los locales", tareas: [
      { titulo: "Enviar contrato del Local 5 al interesado", dias: 0 },
      { titulo: "Tomar fotos de los locales 2 y 3", dias: 2 },
    ] }],
    notas: [],
  },
  {
    nombre: "Casa del suegro, solo el trámite", encargos: ["tramitar"], en_que_va: "en_marcha",
    personas: [
      { nombre: "Don Ernesto (ejemplo)", papel: "vendedor", telefono: { pais: "+52", numero: "6641234505" } },
      { nombre: "Miguel Ángel (ejemplo)", papel: "comprador", telefono: { pais: "+52", numero: "6641234506" } },
      { nombre: "Notaría de ejemplo", papel: "notaria", clase: "institucion" },
    ],
    etapas: [
      { nombre: "Cancelación de hipoteca", tareas: [{ titulo: "Solicitar la carta de no adeudo", quien: "cliente", dias: 1 }] },
      { nombre: "Crédito Infonavit", tareas: [{ titulo: "Solicitar el avalúo", dias: 1 }] },
      { nombre: "Escritura", tareas: [{ titulo: "Firma en la notaría", quien: "notaria", dias: 30, hora: "10:00" }] },
    ],
    notas: [],
  },
  {
    nombre: "Nave industrial en El Florido", encargos: ["comercializar"], en_que_va: "propuesta",
    personas: [
      { nombre: "Industrias del Norte (ejemplo)", papel: "propietario", clase: "empresa" },
      { nombre: "Sofía Robles (ejemplo)", papel: "apoderado", telefono: { pais: "+52", numero: "6641234507" } },
    ],
    etapas: [{ nombre: "Preparar la venta", tareas: [{ titulo: "Tomar fotos y video", dias: 1 }] }],
    notas: [],
  },
];

const dia = (dias: number) => {
  const d = new Date(Date.now() - 8 * 3600_000); // hora de Tijuana, aproximada
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

export async function cargarEjemplos(client: SupabaseClient, user: StaffUser): Promise<{ creados: number }> {
  if (user.role !== "admin") throw new ApiError(403, "Solo el director carga los casos de ejemplo.");
  const { data, error } = await client.from("fortius_inmuebles_asuntos").select("nombre").eq("es_ejemplo", true).is("deleted_at", null);
  if (error) throw new ApiError(503, "Asuntos se activa cuando se integren los cambios de la base.");
  const ya = new Set(((data ?? []) as { nombre: string }[]).map((x) => x.nombre));
  let creados = 0;
  for (const c of CASOS) {
    if (ya.has(c.nombre)) continue;
    const { id } = await crearAsunto(client, user, { nombre: c.nombre, encargos: c.encargos, es_ejemplo: true });
    for (const p of c.personas) {
      await crearEnParte(client, user, id, "personas", {
        papel: p.papel, aunque_exista: true,
        nueva: { nombre: p.nombre, clase: p.clase ?? "persona", fallecida: p.fallecida ?? false, es_ejemplo: true, ...(p.telefono ? { telefono: p.telefono } : {}) },
      });
    }
    for (const e of c.etapas) {
      const etapa = (await crearEnParte(client, user, id, "etapas", { nombre: e.nombre })) as { id: string };
      for (const t of e.tareas) {
        await crearEnParte(client, user, id, "tareas", {
          titulo: t.titulo, quien: t.quien ?? "fortius", etapa_id: etapa.id,
          fecha: t.dias === undefined ? null : dia(t.dias), hora: t.hora ?? null,
        });
      }
    }
    for (const n of c.notas) await crearEnParte(client, user, id, "historial", n);
    if (c.en_que_va !== "estudio") await cambiarAsunto(client, user, id, { version: 1, en_que_va: c.en_que_va });
    creados++;
  }
  return { creados };
}
