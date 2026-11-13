"use client";

import * as React from "react";
import type { Cliente, StaffUser, StoredRecord } from "@/lib/backend/contracts";
import type { Task } from "@/lib/tasks";
export type { Cliente } from "@/lib/backend/contracts";
export * from "@/lib/domain/records";
import { conflictFields, mergeChoice, type ConflictField, type ConflictSide } from "@/lib/admin/conflict";
import type { AdminProperty, Asesor, LeadOrigen, Lead, Evento, Nota, Post, ArchivoTipo, Archivo, SiteContent, SiteSettings } from "@/lib/domain/records";

/** In-memory, acknowledged server data only. Never read/migrate browser storage. */
/** C-03: el mensaje del servidor puede no traer punto final; se agrega para que no se pegue al siguiente. */
const conPunto = (texto: string) => /[.!?…]$/.test(texto.trim()) ? texto.trim() : `${texto.trim()}.`;
export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** AUT-01: `mfa: "required"` cuando falta el código de la app de verificación. */
    public details?: { mfa?: string; reauth?: boolean },
  ) {
    super(
      status === 409
        ? `${conPunto(message || "El registro cambió o tiene vínculos que impiden la operación.")} Conserva tu borrador antes de reintentar.`
        : message,
    );
  }
}
const sessionListeners = new Set<() => void>();
let session: StaffUser | null = null;
let sessionEpoch = 0;
/*
  RP-19 (UX-04): si la sesión vence con alguien trabajando, la pantalla no se cierra. Se marca
  «vencida», el panel pide entrar de nuevo encima de lo capturado y, si entra la misma persona,
  todo sigue donde estaba. Si entra otra persona, se limpia como siempre.
*/
let expired = false;
function setSession(user: StaffUser | null) {
  if (!user || session?.id !== user.id) clearAdminCache();
  session = user;
  expired = false;
  sessionListeners.forEach((l) => l());
}
/** Un 401 con sesión abierta la marca vencida sin borrar la pantalla; sin sesión, cierra como antes. */
function sessionRejected() {
  if (!session) { setSession(null); return; }
  if (expired) return;
  expired = true;
  sessionListeners.forEach((l) => l());
}
export function useSessionExpired() {
  return React.useSyncExternalStore(
    (cb) => {
      sessionListeners.add(cb);
      return () => sessionListeners.delete(cb);
    },
    () => expired,
    () => false,
  );
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

/** RP-15: sin red nada se guardó; lo capturado sigue en pantalla para reintentar. */
export const SIN_CONEXION = "Sin conexión: tus cambios siguen en pantalla, todavía no se guardan.";
/** Error de una petición con su código HTTP; conserva el mensaje del servidor. */
export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
/** Petición JSON o multipart (FormData) sin cambiar el mensaje de error del servidor. */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, credentials: "same-origin", cache: "no-store" }); }
  catch { throw new RequestError(SIN_CONEXION, 0); }
  // C-02: un proxy o un error 502/504 puede responder HTML; no se muestra «Unexpected token '<'».
  let body: { error?: unknown } | null = null;
  try { body = await response.json(); } catch { body = null; }
  if (response.status === 401 && url.startsWith("/api/admin/")) sessionRejected();
  if (!response.ok) throw new RequestError(typeof body?.error === "string" && body.error ? body.error : "No se pudo terminar. Lo que escribiste sigue en pantalla. Vuelve a intentarlo en un momento.", response.status);
  if (body === null || typeof body !== "object") throw new RequestError("El servidor respondió algo inesperado. Recarga e inténtalo de nuevo.", response.status);
  return body as T;
}

/** Reúne todas las páginas de expedientes disponibles para la cuenta. */
export async function loadAllDossiers<T>(): Promise<T[]> {
  const records: T[] = [];
  let offset: number | null = 0;
  while (offset !== null) {
    const page: { expedientes: T[]; nextOffset: number | null } = await apiRequest(`/api/admin/expedientes?limit=200&offset=${offset}`);
    if (!Array.isArray(page.expedientes) || (page.nextOffset !== null && (!Number.isInteger(page.nextOffset) || page.nextOffset <= offset || page.nextOffset > 100000))) throw new Error("No se pudieron consultar las operaciones. Vuelve a intentarlo.");
    records.push(...page.expedientes);
    offset = page.nextOffset;
  }
  return records;
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
      SIN_CONEXION,
    );
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      epoch === sessionEpoch &&
      response.status === 401 &&
      url.startsWith("/api/admin/")
    )
      sessionRejected();
    throw new AdminApiError(
      response.status,
      typeof result.error === "string"
        ? result.error
        : "No se pudo terminar. Lo que escribiste sigue en pantalla. Vuelve a intentarlo en un momento.",
      {
        ...(typeof result.mfa === "string" ? { mfa: result.mfa } : {}),
        ...(result.reauth === true ? { reauth: true } : {}),
      },
    );
  }
  return result as T;
}

type LoadState = {
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  loaded: boolean;
};
const IDLE: LoadState = { status: "idle", error: null, loaded: false };
const EMPTY: never[] = [];
type Collection<T extends object> = {
  list(): T[];
  load(): Promise<void>;
  state(): LoadState;
  version(item: T | string): number | null;
  put(item: T, version: number | null): Promise<T>;
  acknowledge(record: StoredRecord<T>): Promise<void>;
  remove(id: string, version: number): Promise<void>;
  clear(): void;
  subscribe(cb: () => void): () => void;
};
/*
  RP-17 (UX-04): ante un 409 por versión, el panel muestra campo por campo lo tuyo y lo que se
  guardó antes, y vuelve a guardar sobre la versión nueva solo con lo que elegiste. Sin ventana
  disponible (pruebas, otra pantalla) el 409 llega igual que antes y la captura sigue en pantalla.
*/
export type ConflictRequest = { collection: string; fields: ConflictField[] };
type ConflictResolver = (request: ConflictRequest) => Promise<Record<string, ConflictSide> | null>;
let conflictResolver: ConflictResolver | null = null;
export function setConflictResolver(resolver: ConflictResolver) {
  conflictResolver = resolver;
  return () => { if (conflictResolver === resolver) conflictResolver = null; };
}
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
  // Lo confirmado por el servidor en cada versión: la base para explicar un conflicto (RP-17).
  let confirmed = new Map<string, Map<number, T>>();
  const remember = (id: string, version: number, data: T) => {
    const byVersion = confirmed.get(id) ?? new Map<number, T>();
    byVersion.set(version, data);
    if (byVersion.size > 5) byVersion.delete(byVersion.keys().next().value!);
    confirmed.set(id, byVersion);
  };
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
      confirmed = new Map();
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
          result.records.forEach((r) => { snapshots.set(r.data, r.version); remember(r.id, r.version, r.data); });
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
      let result: { record: StoredRecord<T> };
      try {
        result = await apiRequest<{ record: StoredRecord<T> }>(
          path + "/" + encodeURIComponent(identify(item)),
          "PUT",
          { data: item, version },
        );
      } catch (error) {
        if (!(error instanceof AdminApiError) || error.status !== 409 || version === null || !conflictResolver) throw error;
        const id = identify(item), base = confirmed.get(id)?.get(version);
        try { await col.load(); } catch { throw error; }
        const theirs = cache.find((x) => identify(x) === id), theirsVersion = versions.get(id);
        // Sin registro guardado o sin versión nueva, el 409 no es de versión (vínculos, borrado): se informa igual que antes.
        if (!theirs || theirsVersion === undefined || theirsVersion <= version) throw error;
        const fields = conflictFields(base, item, theirs);
        if (!fields.length) return theirs;
        const choice = await conflictResolver({ collection: key, fields });
        if (!choice) throw error;
        return col.put(mergeChoice(theirs, item, choice), theirsVersion);
      }
      if (epoch !== sessionEpoch)
        throw new AdminApiError(401, "La sesión cambió; vuelve a entrar.");
      // A response to an earlier GET must never overwrite the acknowledged mutation.
      generation++;
      pending = null;
      // The returned snapshot always owns the version actually saved, even
      // when the shared cache has already observed a later server state.
      snapshots.set(result.record.data, result.record.version);
      remember(result.record.id, result.record.version, result.record.data);
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
    async acknowledge(record) {
      const epoch = sessionEpoch;
      generation++;
      pending = null;
      snapshots.set(record.data, record.version);
      remember(record.id, record.version, record.data);
      if ((versions.get(record.id) ?? 0) > record.version || needsRevalidation) {
        await reconcile(epoch);
        return;
      }
      cache = [record.data, ...cache.filter(item => identify(item) !== record.id)];
      versions.set(record.id, record.version);
      cacheRevision++;
      state = { status: "ready", error: null, loaded: true };
      emit();
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
export async function convertirLead(lead: Lead): Promise<Cliente> {
  const version = db.leads.version(lead);
  if (!version) throw new Error("Vuelve a cargar el prospecto antes de convertirlo.");
  const epoch = sessionEpoch;
  const result = await apiRequest<{ cliente: StoredRecord<Cliente>; lead: StoredRecord<Lead> }>(
    `/api/admin/leads/${encodeURIComponent(lead.id)}/convertir`, "POST", { version },
  );
  if (epoch !== sessionEpoch) throw new AdminApiError(401, "La sesión cambió; vuelve a entrar.");
  await db.leads.acknowledge(result.lead);
  if (epoch !== sessionEpoch) throw new AdminApiError(401, "La sesión cambió; vuelve a entrar.");
  await db.clientes.acknowledge(result.cliente);
  return result.cliente.data;
}
export function useCollection<T extends object>(col: Collection<T>, enabled = true): T[] {
  React.useEffect(() => {
    if (enabled && col.state().status === "idle") void col.load().catch(() => {});
  }, [col, enabled]);
  return React.useSyncExternalStore(col.subscribe, col.list, () => EMPTY);
}
export function useLoadState<T extends object>(col: Collection<T>) {
  return React.useSyncExternalStore(col.subscribe, col.state, () => IDLE);
}
type Singleton<T extends object> = ReturnType<typeof singleton<T>>;
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
const cacheClearers = new Set<() => void>();
/** Otros datos en memoria del panel que deben olvidarse al cambiar de sesión (COR-05: la cola de Hoy). */
export function onAdminCacheClear(fn: () => void) { cacheClearers.add(fn); return () => { cacheClearers.delete(fn); }; }
export function clearAdminCache() {
  sessionEpoch++;
  adminStores.forEach((s) => s.clear());
  cacheClearers.forEach((fn) => fn());
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
    : "No se pudo terminar. Lo que escribiste sigue en pantalla. Vuelve a intentarlo en un momento.";
}
// AUT-01: la contraseña (o el enlace) fue aceptada y falta el código de la app de verificación.
let mfaPending = false;
export const needsMfaCode = () => mfaPending;
/** `boot`: al abrir el panel no hay nada capturado; sin sesión se muestra el acceso de siempre. */
export async function isLoggedIn(options: { boot?: boolean } = {}) {
  const epoch = sessionEpoch;
  try {
    const result = await apiRequest<{ user: StaffUser }>("/api/auth/session");
    if (epoch !== sessionEpoch) return false;
    mfaPending = false;
    setSession(result.user);
    return true;
  } catch (error) {
    if (epoch !== sessionEpoch) return false;
    if (
      error instanceof AdminApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      mfaPending = error.details?.mfa === "required";
      // Falta el código: va al paso de verificación, no al aviso de sesión vencida.
      if (error.status === 401 && !options.boot && !mfaPending) sessionRejected(); else setSession(null);
      return false;
    }
    throw error;
  }
}
export async function login(email: string, password: string) {
  const result = await apiRequest<{ mfaRequired?: boolean }>("/api/auth/login", "POST", { email, password });
  if (result.mfaRequired) { mfaPending = true; return false; }
  return isLoggedIn();
}
/** Segundo paso del acceso con el código de 6 dígitos. */
export async function verifyMfaCode(code: string) {
  await apiRequest("/api/auth/mfa/verify", "POST", { code });
  mfaPending = false;
  return isLoggedIn();
}
export type MfaStatus = { available: boolean; devices: { id: string; createdAt: string }[] };
export const mfaStatus = () => apiRequest<MfaStatus>("/api/auth/mfa");
export const startMfaEnrollment = () =>
  apiRequest<{ factorId: string; qr: string; secret: string }>("/api/auth/mfa/enroll", "POST", {});
export const confirmMfaEnrollment = (factorId: string, code: string) =>
  apiRequest<{ ok: true }>("/api/auth/mfa/confirm", "POST", { factorId, code });
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
  // Solo un fragmento con datos de acceso es un enlace de acceso; un ancla (#hoy) no lo es.
  const authHash = ["access_token", "token_hash", "type", "error", "error_description"].some(k => hash.has(k));
  if (!authHash && !url.searchParams.has("token_hash")) return false;
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
  const result = await apiRequest<{ mfaRequired?: boolean }>("/api/auth/callback", "POST", body);
  mfaPending = Boolean(result.mfaRequired);
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
  bucket: "fortius-inmuebles-private" | "fortius-inmuebles-public";
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
    visibility: file.bucket === "fortius-inmuebles-public" ? "public" : "private",
  };
}
/** B5: a dónde va un archivo público; el servidor decide con esto si se puede. */
export type UploadDestino = { destino: "inmueble"; inmueble?: string } | { destino: "sitio" };
export async function uploadFile(
  file: File,
  visibility: "private" | "public" = "private",
  destino?: UploadDestino,
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
    { name: file.name, size: file.size, contentType: file.type, visibility, ...(visibility === "public" ? destino ?? {} : {}) },
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
