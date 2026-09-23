"use client";

import * as React from "react";
import type { Asesor as AsesorBase } from "@/data/asesores";
import type { Property } from "@/data/propiedades";
import type { Cliente, StaffUser, StoredRecord } from "@/lib/backend/contracts";
import type { LeadProfile } from "@/lib/lead-profile";
import type { Task } from "@/lib/tasks";
export type { Cliente } from "@/lib/backend/contracts";

/* ---------- tipos ---------- */

export type AdminProperty = Property;

export type Asesor = AsesorBase & {
  telefono?: string;
  whatsapp?: string;
  email?: string;
  activo: boolean;
};

export const LEAD_ESTADOS = [
  "nuevo",
  "contactado",
  "en-evaluacion",
  "activo",
  "cerrado",
  "descartado",
] as const;
export type LeadEstado = (typeof LEAD_ESTADOS)[number];

export const LEAD_ESTADO_LABELS: Record<LeadEstado, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  "en-evaluacion": "En evaluación",
  activo: "Activo",
  cerrado: "Cerrado",
  descartado: "Descartado",
};

export type LeadOrigen =
  | "evaluar"
  | "contacto"
  | "interes-propiedad"
  | "checklist"
  | "documentos"
  | "manual";

export const LEAD_ORIGEN_LABELS: Record<LeadOrigen, string> = {
  evaluar: "Evaluación (Home)",
  contacto: "Contacto",
  "interes-propiedad": "Interés en propiedad",
  checklist: "Checklist de venta",
  documentos: "Descarga de documentos",
  manual: "Captura manual",
};

export type LeadNota = { id: string; texto: string; fecha: string };

export type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  origen: LeadOrigen;
  estado: LeadEstado;
  propiedadSlug?: string;
  zona?: string;
  tipoPropiedad?: string;
  mensaje?: string;
  perfil?: LeadProfile;
  asesorId?: string;
  creadoEl: string; // ISO
  notas: LeadNota[];
};

export const EVENTO_TIPOS = [
  "visita",
  "llamada",
  "firma",
  "reunion",
  "otro",
] as const;
export type EventoTipo = (typeof EVENTO_TIPOS)[number];

export const EVENTO_TIPO_LABELS: Record<EventoTipo, string> = {
  visita: "Visita",
  llamada: "Llamada",
  firma: "Firma",
  reunion: "Reunión",
  otro: "Otro",
};

export type Evento = {
  id: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  tipo: EventoTipo;
  leadId?: string;
  propiedadSlug?: string;
  notas?: string;
};

export type Nota = {
  id: string;
  titulo: string;
  texto: string;
  actualizadoEl: string;
};

export type Post = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string; // párrafos separados por línea en blanco
  estado: "borrador" | "publicado";
  actualizadoEl: string;
};

export type ArchivoTipo = "imagen" | "pdf" | "video" | "otro";

export type Archivo = {
  id: string;
  nombre: string;
  url: string;
  tipo: ArchivoTipo;
  notas?: string;
  bucket?: "mnt-private" | "mnt-public";
  path?: string;
  visibility?: "private" | "public";
};

export type SiteContent = {
  heroTitulo: string;
  heroSubtitulo: string;
  manifiestoTitulo: string;
  manifiestoTexto: string;
  seoTitle: string;
  seoDescription: string;
};

export type SiteSettings = {
  nombreComercial: string;
  telefono: string;
  whatsapp: string;
  email: string;
  horario: string;
  facebook: string;
  instagram: string;
  videoInstitucionalUrl: string;
};

/** In-memory, acknowledged server data only. Never read/migrate browser storage. */
export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(
      status === 409
        ? "Conflicto: el registro cambió o tiene vínculos que impiden la operación. Conserva tu borrador y vuelve a cargar antes de reintentar."
        : message,
    );
  }
}
const sessionListeners = new Set<() => void>();
let session: StaffUser | null = null;
let sessionEpoch = 0;
function setSession(user: StaffUser | null) {
  if (!user || session?.id !== user.id) clearAdminCache();
  session = user;
  sessionListeners.forEach((l) => l());
}
export function useSession() {
  return React.useSyncExternalStore(
    (cb) => {
      sessionListeners.add(cb);
      return () => sessionListeners.delete(cb);
    },
    () => session,
    () => null,
  );
}

export async function apiRequest<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const epoch = sessionEpoch;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      ...(body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
  } catch {
    throw new AdminApiError(
      0,
      "No se pudo conectar. Tus cambios no se han guardado.",
    );
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      epoch === sessionEpoch &&
      (response.status === 401 || response.status === 403) &&
      url.startsWith("/api/admin/")
    )
      setSession(null);
    throw new AdminApiError(
      response.status,
      typeof result.error === "string"
        ? result.error
        : "No se pudo completar la operación.",
    );
  }
  return result as T;
}

export type LoadState = {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  loaded: boolean;
};
const IDLE: LoadState = { status: "idle", error: null, loaded: false };
const EMPTY: never[] = [];
export type Collection<T extends object> = {
  list(): T[];
  load(): Promise<void>;
  state(): LoadState;
  version(item: T | string): number | null;
  put(item: T, version: number | null): Promise<T>;
  remove(id: string, version: number): Promise<void>;
  clear(): void;
  subscribe(cb: () => void): () => void;
};
export function uid(): string {
  return crypto.randomUUID();
}
function collection<T extends object>(
  key: string,
  identify: (item: T) => string,
): Collection<T> {
  let cache: T[] = [];
  let versions = new Map<string, number>();
  const snapshots = new WeakMap<T, number>();
  let state = IDLE;
  let generation = 0;
  let cacheRevision = 0;
  let needsRevalidation = false;
  let pending: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const path = "/api/admin/collections/" + key;
  async function reconcile(epoch: number) {
    try {
      await col.load();
    } catch {
      if (epoch !== sessionEpoch) return;
      // Persistence already succeeded. Keep the latest confirmed cache and
      // let the shell offer a retry without making the editor retry its write.
      state = {
        ...state,
        status: "error",
        error:
          "La operación se guardó, pero no se pudo actualizar la lista. Reintenta la carga.",
      };
      emit();
    }
  }
  const col: Collection<T> = {
    list: () => cache,
    state: () => state,
    version: (item) =>
      (typeof item === "string" ? versions.get(item) : snapshots.get(item)) ??
      null,
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    clear() {
      generation++;
      cacheRevision++;
      needsRevalidation = false;
      pending = null;
      cache = [];
      versions = new Map();
      state = IDLE;
      emit();
    },
    load() {
      if (pending) return pending;
      const current = generation;
      state = { ...state, status: "loading", error: null };
      emit();
      pending = (async () => {
        try {
          const result = await apiRequest<{ records: StoredRecord<T>[] }>(path);
          if (current !== generation) return;
          cache = result.records.map((r) => r.data);
          result.records.forEach((r) => snapshots.set(r.data, r.version));
          versions = new Map(result.records.map((r) => [r.id, r.version]));
          cacheRevision++;
          needsRevalidation = false;
          state = { status: "ready", error: null, loaded: true };
        } catch (error) {
          if (current !== generation) return;
          state = { ...state, status: "error", error: errorMessage(error) };
          throw error;
        } finally {
          if (current === generation) {
            pending = null;
            emit();
          }
        }
      })();
      return pending;
    },
    async put(item, version) {
      const epoch = sessionEpoch;
      const revision = cacheRevision;
      const result = await apiRequest<{ record: StoredRecord<T> }>(
        path + "/" + encodeURIComponent(identify(item)),
        "PUT",
        { data: item, version },
      );
      if (epoch !== sessionEpoch)
        throw new AdminApiError(401, "La sesión cambió; vuelve a entrar.");
      // A response to an earlier GET must never overwrite the acknowledged mutation.
      generation++;
      pending = null;
      // The returned snapshot always owns the version actually saved, even
      // when the shared cache has already observed a later server state.
      snapshots.set(result.record.data, result.record.version);
      if (revision !== cacheRevision || needsRevalidation) {
        // Response order need not match commit order. A fresh GET
        // after this acknowledgement resolves that ambiguity without briefly
        // replacing newer data (or resurrecting a deleted record) in the UI.
        needsRevalidation = true;
        await reconcile(epoch);
        return result.record.data;
      }
      cache = [
        result.record.data,
        ...cache.filter((x) => identify(x) !== result.record.id),
      ];
      versions.set(result.record.id, result.record.version);
      cacheRevision++;
      state = { status: "ready", error: null, loaded: true };
      emit();
      return result.record.data;
    },
    async remove(id, version) {
      const epoch = sessionEpoch;
      const revision = cacheRevision;
      await apiRequest(path + "/" + encodeURIComponent(id), "DELETE", {
        version,
      });
      if (epoch !== sessionEpoch)
        throw new AdminApiError(401, "La sesión cambió; vuelve a entrar.");
      generation++;
      pending = null;
      if (revision !== cacheRevision || needsRevalidation) {
        needsRevalidation = true;
        await reconcile(epoch);
        return;
      }
      cache = cache.filter((x) => identify(x) !== id);
      versions.delete(id);
      cacheRevision++;
      state = { status: "ready", error: null, loaded: true };
      emit();
    },
  };
  return col;
}
const byId = <T extends { id: string }>(item: T) => item.id;
export const db = {
  tareas: collection<Task>("tareas", byId),
  propiedades: collection<AdminProperty>("propiedades", (item) => item.slug),
  asesores: collection<Asesor>("asesores", byId),
  leads: collection<Lead>("leads", byId),
  clientes: collection<Cliente>("clientes", byId),
  eventos: collection<Evento>("eventos", byId),
  posts: collection<Post>("posts", byId),
  notas: collection<Nota>("notas", byId),
  archivos: collection<Archivo>("archivos", byId),
};
export function useCollection<T extends object>(col: Collection<T>): T[] {
  React.useEffect(() => {
    if (col.state().status === "idle") void col.load().catch(() => {});
  }, [col]);
  return React.useSyncExternalStore(col.subscribe, col.list, () => EMPTY);
}
export function useLoadState<T extends object>(col: Collection<T>) {
  return React.useSyncExternalStore(col.subscribe, col.state, () => IDLE);
}
export type Singleton<T extends object> = ReturnType<typeof singleton<T>>;
function singleton<T extends object>(key: string, empty: T) {
  const col = collection<T>(key, () => "singleton");
  return {
    ...col,
    get: () => col.list()[0] ?? (col.state().loaded ? empty : null),
    save: (value: T, version: number | null) => col.put(value, version),
  };
}
export const contentStore = singleton<SiteContent>("contenido", {
  heroTitulo: "",
  heroSubtitulo: "",
  manifiestoTitulo: "",
  manifiestoTexto: "",
  seoTitle: "",
  seoDescription: "",
});
export const settingsStore = singleton<SiteSettings>("config", {
  nombreComercial: "",
  telefono: "",
  whatsapp: "",
  email: "",
  horario: "",
  facebook: "",
  instagram: "",
  videoInstitucionalUrl: "",
});
export function useSingleton<T extends object>(store: Singleton<T>): T | null {
  React.useEffect(() => {
    if (store.state().status === "idle") void store.load().catch(() => {});
  }, [store]);
  return React.useSyncExternalStore(store.subscribe, store.get, () => null);
}
export const adminStores = [...Object.values(db), contentStore, settingsStore];
export function clearAdminCache() {
  sessionEpoch++;
  adminStores.forEach((s) => s.clear());
}
export async function loadAdminData() {
  await Promise.all(adminStores.map((s) => s.load()));
}
export async function upsert<T extends { id: string }>(
  col: Collection<T>,
  item: T,
  version: number | null,
) {
  return col.put(item, version);
}
export async function removeById<T extends { id: string }>(
  col: Collection<T>,
  id: string,
  version: number | null,
) {
  if (version === null) throw new AdminApiError(409, "Registro no encontrado");
  await col.remove(id, version);
}
export async function upsertPropiedad(
  item: AdminProperty,
  version: number | null,
) {
  return db.propiedades.put(item, version);
}
export async function removePropiedad(slug: string, version: number | null) {
  if (version === null) throw new AdminApiError(409, "Registro no encontrado");
  await db.propiedades.remove(slug, version);
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación.";
}
export async function isLoggedIn() {
  const epoch = sessionEpoch;
  try {
    const result = await apiRequest<{ user: StaffUser }>("/api/auth/session");
    if (epoch !== sessionEpoch) return false;
    setSession(result.user);
    return true;
  } catch (error) {
    if (epoch !== sessionEpoch) return false;
    if (
      error instanceof AdminApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      setSession(null);
      return false;
    }
    throw error;
  }
}
export async function login(email: string, password: string) {
  await apiRequest("/api/auth/login", "POST", { email, password });
  return isLoggedIn();
}
export async function logout() {
  // Clear private UI immediately, even if server logout fails; report failure to retry.
  clearAdminCache();
  await apiRequest("/api/auth/logout", "POST", {});
  setSession(null);
}
export async function recoverPassword(email: string) {
  await apiRequest("/api/auth/recovery", "POST", { email });
}
export async function changePassword(password: string) {
  await apiRequest("/api/auth/password", "POST", { password });
  await isLoggedIn();
}
export async function acceptPasswordLink(): Promise<boolean> {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const type = hash.get("type") ?? url.searchParams.get("type");
  if (!url.hash && !url.searchParams.has("token_hash")) return false;
  const body = {
    type,
    ...(hash.get("access_token")
      ? {
          access_token: hash.get("access_token"),
          refresh_token: hash.get("refresh_token"),
        }
      : {
          token_hash:
            url.searchParams.get("token_hash") ?? hash.get("token_hash"),
        }),
  };
  const error =
    hash.get("error_description") ?? url.searchParams.get("error_description");
  // Remove secrets before a request, including failure paths. No token storage.
  url.hash = "";
  ["token_hash", "type", "error", "error_code", "error_description"].forEach(
    (k) => url.searchParams.delete(k),
  );
  window.history.replaceState(null, "", url.pathname + url.search);
  if (error)
    throw new AdminApiError(
      400,
      "El enlace no es válido o ha caducado. Solicita uno nuevo.",
    );
  if (type !== "invite" && type !== "recovery")
    throw new AdminApiError(400, "Enlace de acceso no compatible.");
  await apiRequest("/api/auth/callback", "POST", body);
  return true;
}
export async function captureLead(input: {
  nombre: string;
  telefono: string;
  origen: LeadOrigen;
  email?: string;
  propiedadSlug?: string;
  zona?: string;
  tipoPropiedad?: string;
  mensaje?: string;
  website?: string;
}): Promise<string> {
  const result = await apiRequest<{ id: string }>("/api/leads", "POST", input);
  return result.id;
}
export type UploadedFile = {
  bucket: "mnt-private" | "mnt-public";
  path: string;
  url: string;
  name: string;
  type: string;
};
export function archivoTipo(mime: string): ArchivoTipo {
  return mime.startsWith("image/")
    ? "imagen"
    : mime === "application/pdf"
      ? "pdf"
      : mime.startsWith("video/")
        ? "video"
        : "otro";
}
export function archivoFromUpload(id: string, file: UploadedFile): Archivo {
  return {
    id,
    nombre: file.name,
    url: file.url,
    tipo: archivoTipo(file.type),
    bucket: file.bucket,
    path: file.path,
    visibility: file.bucket === "mnt-public" ? "public" : "private",
  };
}
export async function uploadFile(
  file: File,
  visibility: "private" | "public" = "private",
): Promise<UploadedFile> {
  if (!file.size || file.size > 20 * 1024 * 1024)
    throw new Error("El archivo debe pesar entre 1 byte y 20 MB.");
  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "video/mp4",
      "video/webm",
    ].includes(file.type)
  )
    throw new Error(
      "Formato permitido: JPEG, PNG, WebP, GIF, PDF, MP4 o WebM.",
    );
  const prepared = await apiRequest<{ signedUrl: string; ticket: string }>(
    "/api/admin/files/upload",
    "POST",
    { name: file.name, size: file.size, contentType: file.type, visibility },
  );
  const sent = await fetch(prepared.signedUrl, {
    method: "PUT",
    credentials: "omit",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!sent.ok)
    throw new Error("No se pudo cargar el archivo. No se ha registrado.");
  return apiRequest<UploadedFile>("/api/admin/files/complete", "POST", {
    ticket: prepared.ticket,
  });
}
export async function resolveFileUrl(value: string) {
  const url = new URL(value, window.location.origin);
  if (
    url.origin === window.location.origin &&
    url.pathname === "/api/admin/files"
  )
    return (await apiRequest<{ url: string }>(url.pathname + url.search)).url;
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("URL no válida.");
  return url.href;
}
export async function openFile(value: string) {
  const tab = window.open("about:blank", "_blank");
  if (tab) tab.opener = null;
  try {
    const url = await resolveFileUrl(value);
    if (tab) tab.location.href = url;
    else throw new Error("Permite ventanas emergentes para abrir el archivo.");
  } catch (error) {
    tab?.close();
    throw error;
  }
}
export function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
