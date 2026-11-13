"use client";
import * as React from "react";
import { inboxItems, mentionNames, unread, type InboxItem } from "@/lib/admin/inbox";
import { db, useCollection, useSession } from "@/lib/admin/store";
import { useMyAdvisor } from "@/lib/admin/staff-scope";
import { markInboxRead, usePreferences } from "@/components/admin/workspace/preferences-store";

/*
  «Para ti» (RP-20, UX-05). Los avisos se calculan con las tareas y notas que el panel ya carga;
  lo leído vive en las preferencias del servidor, compartido por Hoy y el número del menú.
  Mientras lo leído no llega, el menú no cuenta avisos: nunca se cuenta algo que quizá ya leíste.
*/
export function useInbox() {
  const session = useSession();
  const key = session?.id ?? "";
  const tasks = useCollection(db.tareas), notes = useCollection(db.notas), properties = useCollection(db.propiedades), clients = useCollection(db.clientes);
  const asesorId = useMyAdvisor();
  const prefs = usePreferences();
  const read = prefs === undefined ? undefined : prefs === null ? null : prefs.bandeja?.leidos ?? {};
  const items: InboxItem[] = React.useMemo(() => !session || asesorId === undefined ? [] : inboxItems({
    tasks, notes, now: new Date(),
    me: { userId: session.id, asesorId, names: mentionNames(session.name, session.email) },
    visible: { property: slug => properties.find(p => p.slug === slug)?.titulo, client: id => clients.find(c => c.id === id)?.nombre },
  }), [session, asesorId, tasks, notes, properties, clients]);
  const fresh = unread(items, read ?? undefined);
  /** Lo leído se marca cuando el servidor lo confirma. */
  const markRead = React.useCallback(async (keys: string[]) => { if (key && keys.length) await markInboxRead(key, keys); }, [key]);
  return { items, unread: fresh, read, markRead, loading: read === undefined };
}

/** Lo no leído de «Para ti», para el número del menú (RP-84). */
export function useInboxCount() {
  return useInbox().unread.length;
}
