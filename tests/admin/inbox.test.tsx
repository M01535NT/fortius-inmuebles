import * as React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { inboxItems, markRead, mentionNames, mentions, unread, INBOX_READ_LIMIT } from "@/lib/admin/inbox";
import { clearAdminCache, isLoggedIn } from "@/lib/admin/store";
import { Inbox } from "@/components/admin/workspace/inbox";
import type { Nota } from "@/lib/domain/records";
import type { Task } from "@/lib/tasks";

/* UX-05, RP-20: la bandeja «Para ti» con menciones, asignaciones y respuestas; lo leído en el servidor. */
const now = new Date("2026-11-14T18:00:00Z");
const me = { userId: "u-me", asesorId: "a-me", names: mentionNames("Iliana Tonalá Rivera", "iliana@fortius.test") };
const visible = { property: (slug: string) => slug === "casa" ? "Casa en Playas" : undefined, client: (id: string) => id === "c1" ? "Familia Navarro" : undefined };
const note = (over: Partial<Nota>): Nota => ({ id: "n", titulo: "Nota", texto: "", actualizadoEl: "2026-11-14T10:00:00Z", ...over });
const task = (over: Partial<Task>): Task => ({ id: "t", titulo: "Tarea", descripcion: "", categoria: "captacion", estado: "pendiente", prioridad: "normal", pasos: [], ...over });
const created = (actorId: string, fecha = "2026-11-13T15:00:00Z") => ({ fecha, actorId, accion: "creada" });

test("una mención avisa por nombre, primer nombre o usuario, sin importar acentos", () => {
  expect(mentions("Revisa esto @iliana por favor", me.names)).toBe(true);
  expect(mentions("Gracias @Iliana Tonala Rivera.", me.names)).toBe(true);
  expect(mentions("@ILIANA, ¿lo ves?", me.names)).toBe(true);
  expect(mentions("Habla con @ilianita", me.names)).toBe(false);
  expect(mentions("iliana@fortius.test", me.names)).toBe(false);
});

test("la bandeja junta menciones de lo que puedes ver, tareas que te asignaron y respuestas", () => {
  const items = inboxItems({ me, visible, now, notes: [
    note({ id: "n1", texto: "@Iliana el dueño pidió bajar el precio", propiedadSlug: "casa", autor: "Marco", autorId: "u-marco" }),
    note({ id: "n2", texto: "@Iliana nota mía", propiedadSlug: "casa", autor: "Iliana", autorId: "u-me" }),
    note({ id: "n3", texto: "@Iliana de un inmueble que no ves", propiedadSlug: "ajena", autorId: "u-marco" }),
    note({ id: "n4", texto: "@Iliana firma el jueves", expedienteId: "d1", clienteId: "c1", autorId: "u-marco", actualizadoEl: "2026-11-14T12:00:00Z" }),
    note({ id: "n5", texto: "@Iliana aviso viejo", propiedadSlug: "casa", autorId: "u-marco", actualizadoEl: "2026-09-01T10:00:00Z" }),
    note({ id: "n6", texto: "@Iliana aviso del director", aviso: true, autorId: "u-marco" }),
  ], tasks: [
    task({ id: "t1", titulo: "Pedir el predial", asesorId: "a-me", historial: [created("u-marco"), { fecha: "2026-11-14T09:00:00Z", actorId: "u-marco", accion: "nota", texto: "Ya lo pedí al municipio" }] }),
    task({ id: "t2", titulo: "Mía", asesorId: "a-me", historial: [created("u-me"), { fecha: "2026-11-14T08:00:00Z", actorId: "u-me", accion: "nota", texto: "Yo misma" }] }),
    task({ id: "t3", titulo: "Ajena", asesorId: "a-otro", historial: [created("u-marco"), { fecha: "2026-11-14T08:00:00Z", actorId: "u-marco", accion: "nota", texto: "No te toca" }] }),
    task({ id: "t4", titulo: "Hecha", asesorId: "a-me", estado: "completada", historial: [created("u-marco")] }),
  ] });
  expect(items.map(item => item.key)).toEqual([
    "mencion:n4:2026-11-14T12:00:00Z", "mencion:n1:2026-11-14T10:00:00Z", "respuesta:t1:2026-11-14T09:00:00Z", "asignacion:t1",
  ]);
  expect(items[0]).toMatchObject({ title: "Te mencionaron en Familia Navarro", href: "/admin/operaciones/d1?notas=1" });
  expect(items[1]).toMatchObject({ title: "Te mencionaron en Casa en Playas", who: "Marco", href: "/admin/propiedades/casa/editar?notas=1" });
  expect(items[3]).toMatchObject({ title: "Te asignaron una tarea", text: "Pedir el predial", href: "/admin/tareas/t1" });
});

test("lo leído se guarda acotado y solo cuenta cuando ya llegó del servidor", () => {
  const items = inboxItems({ me, visible, now, notes: [note({ id: "n1", texto: "@iliana", propiedadSlug: "casa", autorId: "u-x" })], tasks: [] });
  expect(unread(items, undefined)).toEqual([]);
  expect(unread(items, {})).toHaveLength(1);
  expect(unread(items, markRead({}, [items[0].key], now.toISOString()))).toEqual([]);
  const many = Object.fromEntries(Array.from({ length: INBOX_READ_LIMIT }, (_, i) => [`k${i}`, `2026-10-${String(1 + (i % 28)).padStart(2, "0")}T00:00:00Z`]));
  const kept = markRead(many, ["nuevo"], now.toISOString());
  expect(Object.keys(kept)).toHaveLength(INBOX_READ_LIMIT);
  expect(kept.nuevo).toBe(now.toISOString());
});

const posts: unknown[] = [];
beforeEach(() => {
  posts.length = 0;
  clearAdminCache();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  let leidos: Record<string, string> = {};
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/auth/session") return Response.json({ user: { id: "u-me", email: "iliana@fortius.test", name: "Iliana Tonalá", role: "editor" } });
    if (url === "/api/admin/mi-asesor") return Response.json({ asesorId: "a-me" });
    if (url === "/api/admin/preferencias") {
      if (init?.method === "POST") { const body = JSON.parse(String(init.body)); posts.push(body); leidos = { ...leidos, ...Object.fromEntries(body.claves.map((k: string) => [k, now.toISOString()])) }; }
      return Response.json({ preferencias: { data: { bandeja: { leidos } }, version: 1 } });
    }
    if (url.endsWith("/collections/propiedades")) return Response.json({ records: [{ id: "casa", data: { slug: "casa", titulo: "Casa en Playas", galeria: [] }, version: 1 }] });
    if (url.endsWith("/collections/notas")) return Response.json({ records: [{ id: "n1", data: note({ id: "n1", texto: "@Iliana el dueño pidió bajar el precio", propiedadSlug: "casa", autor: "Marco", autorId: "u-marco" }), version: 1 }] });
    if (url.endsWith("/collections/tareas")) return Response.json({ records: [{ id: "t1", data: task({ id: "t1", titulo: "Pedir el predial", asesorId: "a-me", historial: [created("u-marco")] }), version: 1 }] });
    return Response.json({ records: [] });
  }));
});
afterEach(() => { cleanup(); clearAdminCache(); vi.useRealTimers(); vi.unstubAllGlobals(); });

test("Hoy muestra «Para ti» con lo nuevo y lo marca como leído en el servidor", async () => {
  await isLoggedIn();
  render(<Inbox />);
  const list = within(await screen.findByRole("list", { name: "Avisos para ti" }));
  expect(await list.findByText("Te mencionaron en Casa en Playas")).toBeTruthy();
  expect(list.getByText("Te asignaron una tarea")).toBeTruthy();
  expect(screen.getByText("2 sin leer")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Marcar todo como leído" }));
  await waitFor(() => expect(posts).toHaveLength(1));
  expect((posts[0] as { claves: string[] }).claves).toHaveLength(2);
  expect(await screen.findByText("Ya leíste todo.")).toBeTruthy();
  expect(screen.queryByText("2 sin leer")).toBeNull();
});
