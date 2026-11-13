"use client";
import * as React from "react";
import { inboxItems, mentionNames, unread, type InboxItem, type InboxRead } from "@/lib/admin/inbox";
import { apiRequest, db, onAdminCacheClear, useCollection, useSession } from "@/lib/admin/store";
import { useMyAdvisor } from "@/lib/admin/staff-scope";

/*
  «Para ti» (RP-20, UX-05). Los avisos se calculan con las tareas y notas que el panel ya carga;
  lo leído vive en el servidor (/api/admin/preferencias), compartido por Hoy y el número del menú.
  Mientras lo leído no llega, el menú no cuenta avisos: nunca se cuenta algo que quizá ya leíste.
*/
type ReadState = { session: string; read: InboxRead | null } | undefined; // null: no se pudo consultar
let state: ReadState;
let pending: { session: string; request: Promise<void> } | undefined;
const listeners = new Set<() => void>();
const set = (next: ReadState) => { state = next; listeners.forEach(fn => fn()); };
type Stored = { preferencias?: { data?: { bandeja?: { leidos?: InboxRead } } } };
const leidos = (result: Stored) => result.preferencias?.data?.bandeja?.leidos ?? {};

function loadRead(session: string) {
  if (pending?.session === session) return pending.request;
  const request = apiRequest<Stored>("/api/admin/preferencias")
    .then(result => { if (pending?.session === session) set({ session, read: leidos(result) }); })
    .catch(() => { if (pending?.session === session) set({ session, read: null }); });
  pending = { session, request };
  return request;
}
export function resetInbox() { state = undefined; pending = undefined; listeners.forEach(fn => fn()); }
onAdminCacheClear(resetInbox);

export function useInbox() {
  const session = useSession();
  const key = session?.id ?? "";
  const tasks = useCollection(db.tareas), notes = useCollection(db.notas), properties = useCollection(db.propiedades), clients = useCollection(db.clientes);
  const asesorId = useMyAdvisor();
  const current = React.useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state, () => undefined);
  React.useEffect(() => { if (key) void loadRead(key); }, [key]);
  const read = current?.session === key ? current.read : undefined;
  const items: InboxItem[] = React.useMemo(() => !session || asesorId === undefined ? [] : inboxItems({
    tasks, notes, now: new Date(),
    me: { userId: session.id, asesorId, names: mentionNames(session.name, session.email) },
    visible: { property: slug => properties.find(p => p.slug === slug)?.titulo, client: id => clients.find(c => c.id === id)?.nombre },
  }), [session, asesorId, tasks, notes, properties, clients]);
  const fresh = unread(items, read ?? undefined);
  /** Lo leído se marca cuando el servidor lo confirma. */
  const markRead = React.useCallback(async (keys: string[]) => {
    if (!key || !keys.length) return;
    const result = await apiRequest<Stored>("/api/admin/preferencias", "POST", { claves: keys });
    if (state?.session === key || !state) set({ session: key, read: leidos(result) });
  }, [key]);
  return { items, unread: fresh, read, markRead, loading: read === undefined };
}

/** Lo no leído de «Para ti», para el número del menú (RP-84). */
export function useInboxCount() {
  return useInbox().unread.length;
}
