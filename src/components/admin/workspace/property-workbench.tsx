"use client";
import { revealSection } from "./form-section";
import { confirmAction } from "./confirm";
import { useRouter } from "next/navigation";
import Image from "next/image";
import * as React from "react";
import { btnGhost } from "@/components/admin/ui";
import { useSession } from "@/lib/admin/store";
import type { Property } from "@/data/propiedades";

export type PropertyDraft = {
  version: number | null;
  fields: Record<string, string | boolean>;
  titulo: string;
  codigo: string;
  operacion: Property["operacion"];
  estado: Property["estado"];
  galeria: Property["galeria"];
  documentos: NonNullable<Property["documentos"]>;
  pois: Property["puntosDeInteres"];
};
export function readDraftFields(form: HTMLFormElement | null) {
  const fields: Record<string, string | boolean> = {};
  form
    ?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input,select,textarea")
    .forEach((el) => {
      const key = el.name || el.id;
      if (
        !key ||
        (el instanceof HTMLInputElement &&
          ["file", "password"].includes(el.type)) ||
        key === "pf-seccion"
      )
        return;
      fields[key] =
        el instanceof HTMLInputElement && el.type === "checkbox"
          ? el.checked
          : el.value;
    });
  return fields;
}
export function PropertyWorkbench({
  identity,
  version,
  snapshot,
  restore,
  sections,
  dirty,
  onDirty,
  photoCount,
  conflict,
}: {
  identity: string;
  version: number | null;
  snapshot: () => PropertyDraft;
  restore: (draft: PropertyDraft) => void;
  sections: { id: string; label: string }[];
  dirty: boolean;
  onDirty: () => void;
  photoCount: number;
  conflict: boolean;
}) {
  const session = useSession();
  const router = useRouter();
  const key = `fortius:property-draft:${session?.id ?? "anonymous"}:${identity}`;
  const [saved, setSaved] = React.useState<PropertyDraft | null>(() => {
      try {
        const d = JSON.parse(sessionStorage.getItem(key) ?? "null");
        return d &&
          typeof d.titulo === "string" &&
          typeof d.codigo === "string" &&
          d.fields &&
          typeof d.fields === "object" &&
          Object.values(d.fields).every(
            (v) => typeof v === "string" || typeof v === "boolean",
          ) &&
          (d.version === null || Number.isSafeInteger(d.version)) &&
          Array.isArray(d.galeria) &&
          d.galeria.every(
            (v: Property["galeria"][number]) =>
              v && typeof v.src === "string" && typeof v.alt === "string",
          ) &&
          Array.isArray(d.documentos) &&
          d.documentos.every(
            (v: NonNullable<Property["documentos"]>[number]) =>
              v &&
              ["codigo", "nombre", "descripcion", "url"].every(
                (k) => typeof v[k as keyof typeof v] === "string",
              ),
          ) &&
          Array.isArray(d.pois) &&
          d.pois.every(
            (v: Property["puntosDeInteres"][number]) =>
              v && typeof v.lugar === "string" && Number.isFinite(v.minutos),
          ) &&
          ["venta", "renta"].includes(d.operacion) &&
          ["disponible", "apartada", "vendida", "rentada"].includes(d.estado)
          ? d
          : null;
      } catch {
        return null;
      }
    }),
    [notice, setNotice] = React.useState(""),
    [mobile, setMobile] = React.useState(false),
    [preview, setPreview] = React.useState<PropertyDraft | null>(null);
  const dialog = React.useRef<HTMLDialogElement>(null),
    previewTrigger = React.useRef<HTMLButtonElement>(null);
  const [completed, setCompleted] = React.useState<string[]>([]);
  const [missing, setMissing] = React.useState<string[]>([]);
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    let leaving = false;
    const leave = async (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (
        link && !leaving && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0 && link.getAttribute("target") !== "_blank" && !link.hasAttribute("download") &&
        !link.getAttribute("href")?.startsWith("#")
      ) {
        event.preventDefault();
        event.stopPropagation();
        if (leaving) return;
        leaving = true;
        const href = link.getAttribute("href");
        if (href && await confirmAction("Hay cambios sin guardar. ¿Quieres salir del editor?")) (link as HTMLAnchorElement).click();
        leaving = false;
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", leave, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", leave, true);
    };
  }, [dirty, router]);
  React.useEffect(() => {
    const form = root.current?.closest("form");
    if (!form) return;
    const update = () => {
      const required = [
        ...form.querySelectorAll<HTMLInputElement>("[required]"),
      ];
      setMissing(
        required
          .filter((input) => !input.validity.valid)
          .map(
            (input) =>
              input.labels?.[0]?.textContent?.trim() ||
              input.name ||
              "Campo obligatorio",
          ),
      );
      setCompleted(
        sections
          .filter((section) => {
            const el = document.getElementById(section.id);
            const required = [
              ...(el?.querySelectorAll<HTMLInputElement>("[required]") ?? []),
            ];
            return (
              required.length > 0 &&
              required.every((input) => input.validity.valid)
            );
          })
          .map((s) => s.id),
      );
    };
    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, [sections]);
  function saveCopy() {
    const draft = snapshot();
    try {
      sessionStorage.setItem(key, JSON.stringify(draft));
      setSaved(draft);
      setNotice("Copia temporal guardada en esta pestaña. No se ha publicado.");
    } catch {
      setNotice(
        "No se pudo conservar la copia temporal. Guarda el inmueble en el servidor.",
      );
    }
  }
  return (
    <div
      ref={root}
      className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm font-medium">
          {dirty ? "Cambios sin guardar" : "Editor listo"}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnGhost} onClick={saveCopy}>
            Guardar copia temporal
          </button>
          <button
            ref={previewTrigger}
            type="button"
            className={btnGhost}
            onClick={() => {
              setPreview(snapshot());
              dialog.current?.showModal();
            }}
          >
            Vista previa
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {missing.length
          ? `Campos pendientes: ${missing.join(", ")}. `
          : "Campos obligatorios completos. "}
        {!photoCount
          ? "Agrega una fotografía pública antes de publicar."
          : `${photoCount} fotografías públicas.`}
      </p>
      {conflict && (
        <div className="space-y-2 rounded border border-warning-border bg-warning-surface p-3 text-sm">
          <p>
            El registro cambió en el servidor. Conserva una copia y recarga para
            revisar ambas versiones.
          </p>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              try {
                sessionStorage.setItem(key, JSON.stringify(snapshot()));
                window.location.reload();
              } catch {
                setNotice(
                  "No se pudo conservar la copia. Mantén abierto el editor y copia tus cambios antes de recargar.",
                );
              }
            }}
          >
            Conservar copia y recargar
          </button>
        </div>
      )}
      <nav aria-label="Avance de captura" className="flex flex-wrap gap-2">
        {sections.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(event) => { event.preventDefault(); revealSection(document.getElementById(s.id)); }}
            className="inline-flex min-h-11 items-center gap-2 rounded border border-border px-3 text-xs hover:bg-secondary"
          >
            <span aria-hidden="true">
              {completed.includes(s.id) ? "✓" : i + 1}
            </span>
            {s.label}
          </a>
        ))}
      </nav>
      {saved && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            {saved.version !== version
              ? "Hay una copia de otra versión. Puedes consultarla sin reemplazar los datos actuales."
              : "Hay una copia temporal disponible."}
          </span>
          <button
            type="button"
            className={btnGhost}
            disabled={saved.version !== version}
            onClick={() => {
              restore(saved);
              onDirty();
              setNotice("Copia recuperada. Revisa y guarda los cambios.");
            }}
          >
            Recuperar copia
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setPreview(saved);
              dialog.current?.showModal();
            }}
          >
            Consultar copia
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              try {
                sessionStorage.removeItem(key);
              } catch {}
              setSaved(null);
            }}
          >
            Descartar copia
          </button>
          <details className="w-full min-w-0">
            <summary className="min-h-11 cursor-pointer py-3">
              Ver todos los datos de la copia
            </summary>
            <p className="mb-3">
              Copia completa de la captura, incluidos documentos, fotos y puntos
              de interés. Puedes seleccionar y copiar sus valores para
              recuperarlos sin sobrescribir otra versión.
            </p>
            <pre
              aria-label="Copia completa"
              className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded bg-secondary p-3 text-xs"
            >
              {JSON.stringify(saved, null, 2)}
            </pre>
          </details>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      <dialog
        ref={dialog}
        aria-label="Vista previa del inmueble"
        onClose={() => previewTrigger.current?.focus()}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-xl border border-border bg-background p-4 text-foreground backdrop:bg-black/50"
      >
        <div className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            className={btnGhost}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? "Ver escritorio" : "Ver móvil"}
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => dialog.current?.close()}
          >
            Cerrar vista previa
          </button>
        </div>
        {preview && (
          <article
            className={
              "mx-auto mt-5 overflow-hidden rounded-lg border border-border " +
              (mobile ? "max-w-[375px]" : "w-full")
            }
          >
            {preview.galeria[0] && (
              <Image
                unoptimized
                width={960}
                height={720}
                src={preview.galeria[0].src}
                alt={preview.galeria[0].alt}
                className="aspect-[4/3] w-full object-cover"
              />
            )}
            <div className="space-y-4 p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {preview.operacion} · {preview.codigo}
              </p>
              <h2 className="display-soft text-3xl">
                {preview.titulo || "Título del inmueble"}
              </h2>
              <p>
                {String(preview.fields.zona ?? "")} ·{" "}
                {String(preview.fields.direccion ?? "")}
              </p>
              <p className="text-xl font-semibold">
                {preview.fields.modalidad === "consulta"
                  ? "Precio a consultar"
                  : `${preview.fields.monto ?? ""} ${preview.fields.moneda ?? ""}`}
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {String(preview.fields.descripcion ?? "")}
              </p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["terreno", "Terreno m²"],
                  ["construccion", "Construcción m²"],
                  ["recamaras", "Recámaras"],
                  ["banos", "Baños"],
                ].map(([key, label]) =>
                  preview.fields[key] ? (
                    <div key={key}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd>{String(preview.fields[key])}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
              <p className="whitespace-pre-line text-sm">
                {String(preview.fields.amenidades ?? "")}
              </p>
            </div>
          </article>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Previsualización de los datos de la ficha. No publica ni guarda
          cambios.
        </p>
      </dialog>
    </div>
  );
}
