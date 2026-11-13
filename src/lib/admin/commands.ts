import { normalizedText } from "@/lib/admin/workspace";

/*
  Barra de comandos (RP-10, UX-03): además de buscar, actúa. Las acciones son las mismas altas de
  «+ Nuevo» y los mismos destinos del menú; solo se ofrece lo que el rol puede abrir (lo de
  administración, solo al administrador; el servidor sigue validando cada acción).
  Recientes (N03, NAV-02): los últimos 5 registros abiertos, guardados por usuario en el servidor.
*/

export type Command = { id: string; label: string; detail: string; href: string; words?: string };
export type CommandSource = { quick: ReadonlyArray<{ label: string; href: string }>; nav: ReadonlyArray<{ label: string; href: string }>; admin: ReadonlyArray<{ label: string; href: string }> };

export function commandsFor(role: string | undefined, source: CommandSource): Command[] {
  return [
    ...source.quick.map(item => ({ id: `nuevo:${item.href}`, label: item.label, detail: "Crear", href: item.href, words: "nuevo nueva crear agregar alta" })),
    ...source.nav.map(item => ({ id: `ir:${item.href}`, label: `Ir a ${item.label}`, detail: "Ir", href: item.href, words: "ir abrir ver" })),
    { id: "ir:/admin/perfil", label: "Ir a Mi perfil", detail: "Ir", href: "/admin/perfil", words: "cuenta contraseña foto" },
    ...(role === "admin" ? source.admin.map(item => ({ id: `ir:${item.href}`, label: `Ir a ${item.label}`, detail: "Administración", href: item.href, words: "ir abrir ver administrar" })) : []),
  ];
}

/** Coinciden todas las palabras escritas, sin importar acentos ni el orden. */
export function matchesQuery(text: string, query: string) {
  const words = normalizedText(query).split(/\s+/).filter(Boolean);
  const haystack = normalizedText(text);
  return words.every(word => haystack.includes(word));
}

export const filterCommands = (commands: readonly Command[], query: string) =>
  query.trim() ? commands.filter(command => matchesQuery(`${command.label} ${command.words ?? ""}`, query)) : [];

/** Rutas de registro que cuentan como «abiertas» para Recientes. */
const RECORD = [/^\/admin\/propiedades\/[^/]+\/editar$/, /^\/admin\/leads\/[^/]+$/, /^\/admin\/clientes\/[^/]+$/, /^\/admin\/tareas\/[^/]+$/, /^\/admin\/operaciones\/[0-9a-f-]{36}$/i];
export const RECENT_LIMIT = 5;
export function isRecordPath(path: string) { return RECORD.some(pattern => pattern.test(path)) && !/\/(nueva|nuevo)(\/|$)/.test(path); }
export function pushRecent(recent: readonly string[], path: string) {
  return isRecordPath(path) ? [path, ...recent.filter(item => item !== path)].slice(0, RECENT_LIMIT) : [...recent];
}

/** Atajos de teclado (RP-11). Los de una tecla no actúan dentro de campos y se pueden apagar (WCAG 2.1.4). */
export const SHORTCUTS: ReadonlyArray<{ keys: string; what: string; single: boolean }> = [
  { keys: "Ctrl K", what: "Abrir la barra de comandos y buscar (⌘K en Mac)", single: false },
  { keys: "/", what: "Abrir la barra de comandos", single: true },
  { keys: "?", what: "Ver esta lista de atajos", single: true },
  { keys: "↑ ↓", what: "Moverse entre los resultados de la barra", single: false },
  { keys: "Esc", what: "Cerrar la barra o una ventana", single: false },
];

/** ¿La tecla viene de un lugar donde se escribe? Ahí ningún atajo de una tecla actúa. */
export function typingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element || typeof element.closest !== "function") return false;
  return !!element.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='textbox']");
}
