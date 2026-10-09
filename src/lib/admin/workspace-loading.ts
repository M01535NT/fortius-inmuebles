"use client";
import { db, contentStore, settingsStore } from "./store";
export function workspaceStores(pathname: string) {
  const section = pathname.split("/")[2] ?? "";
  const operation = [db.propiedades, db.asesores, db.leads, db.clientes, db.tareas, db.eventos];
  switch (section) {
    case "propiedades": return pathname.split("/").length > 3 ? operation : [db.propiedades, db.asesores];
    case "leads": return pathname.split("/").length > 3 ? operation : [db.leads, db.asesores];
    case "perfil": case "historial": return [];
    case "blog": return [db.posts];
    case "archivos": return [db.archivos];
    case "notas": return [db.notas];
    case "configuracion": return [settingsStore];
    case "contenido": return [contentStore];
    case "": return [...operation, settingsStore];
    default: return operation;
  }
}
export async function loadWorkspace(pathname: string) {
  // Settle the whole module before reporting failure so partial loading never
  // masquerades as an empty collection. Other modules remain navigable.
  const results = await Promise.allSettled(workspaceStores(pathname).map(store => store.load()));
  const failed = results.find(result => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
}
