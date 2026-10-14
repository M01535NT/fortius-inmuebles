"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import Image from "next/image";
import { PropertyPublicationGate } from "./property-publication-gate";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { LibraryPicker } from "@/components/admin/workspace/library-picker";
import { FormSection, revealSection } from "@/components/admin/workspace/form-section";
import { PropertyWorkbench, readDraftFields, type PropertyDraft } from "@/components/admin/workspace/property-workbench";

import {
  AsyncForm,
  UploadControl,
  Field,
  btnGhost,
  btnPrimary,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  ESTADO_LABELS,
  ESTADOS_POR_OPERACION,
  estadoValido,
  TIPO_LABELS,
  type DocumentoPropiedad,
  type FuenteSuperficie,
  type ImagenPropiedad,
  type Property,
  type TipoPropiedad,
} from "@/data/propiedades";
import { zonas } from "@/data/zonas";
import { AdminApiError, db, upsertPropiedad, useCollection, useSession } from "@/lib/admin/store";

/*
  Formulario completo de inmueble (alta y edición). Los campos de lista
  (galería, documentos PDF, puntos de interés) son filas dinámicas; los
  textos largos usan convención simple: párrafos separados por línea en
  blanco, amenidades una por línea.
  Los PDFs cargados aquí aparecen en la sección "Documentos de la
  propiedad" del detalle público (con captura de datos del interesado).
*/
type Props = { initial?: Property };

const formSections = [
  { id: "pf-basicos", label: "Datos básicos" },
  { id: "pf-precio", label: "Precio" },
  { id: "pf-ubicacion", label: "Ubicación" },
  { id: "pf-contenido", label: "Descripción y ficha" },
  { id: "pf-multimedia", label: "Multimedia" },
  { id: "pf-documentos", label: "Documentos" },
];
const sectionClass =
  "scroll-mt-20 rounded-lg border border-border bg-card p-5 md:p-6";

// Mirror the public projection's URL boundary for publication feedback.
function publicGalleryUrl(value: string) {
  if (
    /([a-z0-9-]+-(?:private|staging)|\/api\/admin\/|\/storage\/v1\/object\/sign\/)/i.test(value)
  )
    return false;
  if (/[\s\\]/.test(value) || value.startsWith("//")) return false;
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function PropertyForm({ initial: source }: Props) {
  const router = useRouter();
  const [initial] = React.useState(source);
  const [version] = React.useState(() =>
    source ? db.propiedades.version(source) : null,
  );
  const asesores = useCollection(db.asesores);
  const propiedades = useCollection(db.propiedades);
  const session = useSession();
  const [publicationReady,setPublicationReady]=React.useState(false);
  const [dirty,setDirty] = React.useState(false);
  const [conflict,setConflict] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const [titulo, setTitulo] = React.useState(initial?.titulo ?? "");
  const codigo = initial?.codigo ?? "";
  const [operacion, setOperacion] = React.useState<Property["operacion"]>(initial?.operacion ?? "venta");
  const [estado, setEstado] = React.useState<Property["estado"]>(
    initial && estadoValido(initial.operacion, initial.estado) ? initial.estado : "evaluacion",
  );
  const [galeria, updateGaleria] = React.useState<ImagenPropiedad[]>(
    initial?.galeria ?? [],
  );
  const [documentos, updateDocumentos] = React.useState<DocumentoPropiedad[]>(
    initial?.documentos ?? [],
  );
  const [pois, updatePois] = React.useState(initial?.puntosDeInteres ?? []);
  function setGaleria(value: React.SetStateAction<ImagenPropiedad[]>) {updateGaleria(value);setDirty(true);}
  function setDocumentos(value: React.SetStateAction<DocumentoPropiedad[]>) {updateDocumentos(value);setDirty(true);}
  function setPois(value: React.SetStateAction<typeof pois>) {updatePois(value);setDirty(true);}
  const [error, setError] = React.useState<string | null>(null);
  function snapshot(): PropertyDraft { return {version,fields:readDraftFields(formRef.current),titulo,codigo,operacion,estado,galeria,documentos,pois}; }
  function restore(draft:PropertyDraft) {
    setTitulo(draft.titulo);setOperacion(draft.operacion);setEstado(draft.estado);setGaleria(draft.galeria);setDocumentos(draft.documentos);setPois(draft.pois);
    formRef.current?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>("input,select,textarea").forEach(el=>{const value=draft.fields[el.name||el.id];if(value===undefined || el instanceof HTMLInputElement && (el.type==="file" || el.readOnly))return;if(el instanceof HTMLInputElement && el.type==="checkbox")el.checked=value===true;else el.value=String(value);});
    setDirty(true);
  }
  function moveImage(index:number,direction:number) { const next=[...galeria];[next[index],next[index+direction]]=[next[index+direction],next[index]];setGaleria(next);setDirty(true); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const action = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("data-action");
    const v = (name: string) => String(f.get(name) ?? "").trim();
    const num = (name: string) => (v(name) ? Number(v(name)) : undefined);

    const slug = initial?.slug ?? slugify(v("slug") || titulo);
    if (!slug) {
      throw new Error("El título o slug no puede estar vacío.");
    }
    if (!initial && propiedades.some((p) => p.slug === slug)) {
      throw new Error(`Ya existe un inmueble con el slug "${slug}".`);
    }

    const modalidad = v("modalidad");
    const informacionPublica: NonNullable<Property["informacionPublica"]> = {
      fuenteTerreno: (v("fuenteTerreno") || undefined) as FuenteSuperficie | undefined,
      fuenteConstruccion: (v("fuenteConstruccion") || undefined) as FuenteSuperficie | undefined,
      disponibilidadRevisadaEl: v("disponibilidadRevisadaEl") || undefined,
      ocupacionEntrega: v("ocupacionEntrega") || undefined,
    };
    const base = { ...initial };
    delete base.informacionPublica;
    const property: Property = {
      ...base,
      slug,
      codigo,
      titulo: titulo.trim(),
      tipo: v("tipo") as TipoPropiedad,
      operacion,
      precio:
        modalidad === "publico"
          ? {
              modalidad: "publico",
              monto: Number(v("monto") || 0),
              moneda: v("moneda") as "MXN" | "USD",
              ...(v("operacion") === "renta"
                ? { periodo: "mensual" as const }
                : {}),
            }
          : { modalidad: "consulta" },
      zona: v("zona"),
      direccionAproximada: v("direccion"),
      descripcion: v("descripcion")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
      ficha: {
        ...initial?.ficha,
        terrenoM2: num("terreno"),
        construccionM2: num("construccion"),
        recamaras: num("recamaras"),
        banos: num("banos"),
        estacionamientos: num("estacionamientos"),
        antiguedad: v("antiguedad") || undefined,
      },
      ...(Object.values(informacionPublica).some(Boolean) ? { informacionPublica } : {}),
      amenidades: v("amenidades")
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean),
      galeria: galeria.filter((g) => g.src.trim()),
      videoUrl: v("videoUrl") || undefined,
      tour360Url: v("tour360Url") || undefined,
      documentos: documentos.filter((d) => d.url.trim() && d.nombre.trim()),
      asesorId: v("asesorId"),
      creditoDisponible: f.get("credito") === "on",
      puntosDeInteres: pois.filter((p) => p.lugar.trim()),
      destacada: f.get("destacada") === "on",
      estado,
      publicadaEl:
        initial?.publicadaEl.slice(0, 10) === v("publicadaEl")
          ? initial.publicadaEl
          : v("publicadaEl"),
      demo: f.get("demo") === "on",
      publicada: action === "publish" ? true : action === "unpublish" ? false : (initial?.publicada ?? false),
    };

    if (
      property.publicada &&
      !property.galeria.some((image) => publicGalleryUrl(image.src))
    ) {
      throw new Error("Para publicar, agrega al menos una imagen pública a la galería. Los enlaces privados no aparecen en el sitio.");
    }

    try {await upsertPropiedad(property, version);}catch(cause){if(cause instanceof AdminApiError && cause.status===409)setConflict(true);throw cause;}
    setDirty(false);
    try {sessionStorage.removeItem(`fortius:property-draft:${session?.id??"anonymous"}:${initial?.slug??"new"}`);}catch{}
    router.push("/admin/propiedades");
  }

  const rowBtn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  return (
    <AsyncForm
      ref={formRef}
      onChangeCapture={()=>setDirty(true)}
      onInvalidCapture={(event) => { const details = (event.target as HTMLElement).closest("details"); if (details) details.open = true; }}
      onSubmit={onSubmit}
      className="max-w-[880px] space-y-8 [&_input]:scroll-mt-24 [&_input]:scroll-mb-52 [&_select]:scroll-mt-24 [&_select]:scroll-mb-52 [&_textarea]:scroll-mt-24 [&_textarea]:scroll-mb-52"
    >
      <PropertyWorkbench identity={initial?.slug??"new"} version={version} snapshot={snapshot} restore={restore} sections={formSections} dirty={dirty} onDirty={()=>setDirty(true)} photoCount={galeria.filter(image=>publicGalleryUrl(image.src)).length} conflict={conflict}/>
      {initial ? <PropertyPublicationGate slug={initial.slug} onReady={setPublicationReady}/> : <p className="rounded-md border border-border bg-secondary/30 p-3 text-sm">Primero guarda el inmueble privado. Después vincula su captación y completa la autorización para publicarlo.</p>}
      {/* Básicos */}
      <FormSection id="pf-basicos" aria-labelledby="pf-basicos-heading" tabIndex={-1} className={sectionClass}>
        <h2 id="pf-basicos-heading" className="display-soft text-lg text-foreground">Datos básicos</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Título" htmlFor="pf-titulo" className="sm:col-span-2">
            <input
              id="pf-titulo"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Casa con jardín en Chapultepec"
              className={inputClass}
            />
          </Field>
          {!initial ? (
            <Field
              label="Slug (URL)"
              htmlFor="pf-slug"
              hint={`Se genera del título si lo dejas vacío: ${slugify(titulo) || "…"}`}
            >
              <input
                id="pf-slug"
                name="slug"
                placeholder={slugify(titulo)}
                className={inputClass}
              />
            </Field>
          ) : null}
          <Field label="Folio del inmueble" htmlFor="pf-codigo" hint={initial ? "Identificador interno del inmueble." : "Fortius lo asigna automáticamente al crear el inmueble."}>
            <input
              id="pf-codigo"
              readOnly
              value={codigo || "Se asignará al guardar"}
              className={inputClass + " bg-secondary text-muted-foreground"}
            />
          </Field>
          <Field label="Tipo" htmlFor="pf-tipo">
            <select
              id="pf-tipo"
              name="tipo"
              defaultValue={initial?.tipo ?? "casa"}
              className={selectClass}
            >
              {Object.entries(TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Operación" htmlFor="pf-operacion">
            <select
              id="pf-operacion"
              name="operacion"
              value={operacion}
              onChange={(e) => {
                const next = e.target.value as Property["operacion"];
                setOperacion(next);
                setEstado((current) => estadoValido(next, current) ? current : "disponible");
              }}
              className={selectClass}
            >
              <option value="venta">Venta</option>
              <option value="renta">Renta</option>
            </select>
          </Field>
          <Field label="Estado" htmlFor="pf-estado">
            <select
              id="pf-estado"
              name="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as Property["estado"])}
              className={selectClass}
            >
              {ESTADOS_POR_OPERACION[operacion].map((value) => (
                <option key={value} value={value}>{ESTADO_LABELS[value]}</option>
              ))}
            </select>
          </Field>
          <Field label="Asesor titular" htmlFor="pf-asesor">
            <select
              id="pf-asesor"
              name="asesorId"
              defaultValue={initial?.asesorId ?? ""}
              className={selectClass}
            >
              <option value="">Sin asignar</option>
              {asesores.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de publicación" htmlFor="pf-publicadaEl">
            <input
              id="pf-publicadaEl"
              name="publicadaEl"
              type="date"
              defaultValue={
                initial?.publicadaEl.slice(0, 10) ?? ""
              }
              className={inputClass}
            />
          </Field>
          <div className="flex flex-wrap items-end gap-6 pb-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="destacada"
                defaultChecked={initial?.destacada}
                className="size-4 accent-[var(--primary)]"
              />
              Destacada en Home
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="credito"
                defaultChecked={initial?.creditoDisponible}
                className="size-4 accent-[var(--primary)]"
              />
              Acepta crédito
            </label>
            <p className="flex min-h-11 items-center text-sm">{initial?.publicada ? "Publicado en el sitio" : "Borrador · no visible en el sitio"}</p>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="demo"
                defaultChecked={initial?.demo ?? false}
              />
              Dato de demostración (Demo)
            </label>
          </div>
        </div>
      </FormSection>

      {/* Precio */}
      <FormSection id="pf-precio" aria-labelledby="pf-precio-heading" tabIndex={-1} className={sectionClass}>
        <h2 id="pf-precio-heading" className="display-soft text-lg text-foreground">Precio</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Modalidad" htmlFor="pf-modalidad">
            <select
              id="pf-modalidad"
              name="modalidad"
              defaultValue={initial?.precio.modalidad ?? "publico"}
              className={selectClass}
            >
              <option value="publico">Precio público</option>
              <option value="consulta">Valor a consulta</option>
            </select>
          </Field>
          <Field
            label="Monto"
            htmlFor="pf-monto"
            hint="Solo aplica con precio público."
          >
            <input
              id="pf-monto"
              name="monto"
              type="number"
              min={0}
              defaultValue={
                initial?.precio.modalidad === "publico"
                  ? initial.precio.monto
                  : undefined
              }
              className={inputClass}
            />
          </Field>
          <Field label="Moneda" htmlFor="pf-moneda">
            <select
              id="pf-moneda"
              name="moneda"
              defaultValue={
                initial?.precio.modalidad === "publico"
                  ? initial.precio.moneda
                  : "MXN"
              }
              className={selectClass}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </Field>
        </div>
      </FormSection>

      {/* Ubicación */}
      <FormSection id="pf-ubicacion" aria-labelledby="pf-ubicacion-heading" tabIndex={-1} className={sectionClass}>
        <h2 id="pf-ubicacion-heading" className="display-soft text-lg text-foreground">Ubicación</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Zona" htmlFor="pf-zona">
            <input
              id="pf-zona"
              name="zona"
              required
              defaultValue={initial?.zona}
              list="pf-zonas"
              className={inputClass}
            />
            <datalist id="pf-zonas">
              {zonas.map((z) => (
                <option key={z.slug} value={z.nombre} />
              ))}
            </datalist>
          </Field>
          <Field
            label="Referencia (nunca dirección exacta)"
            htmlFor="pf-direccion"
          >
            <input
              id="pf-direccion"
              name="direccion"
              required
              defaultValue={initial?.direccionAproximada}
              placeholder="A dos calles del malecón"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-foreground">
            Puntos de interés cercanos
          </p>
          <div className="mt-2 space-y-2">
            <UploadControl label="Tomar foto con la cámara" accept="image/*" capture="environment" publicOnly onUploaded={file=>{setGaleria(current=>[...current,{src:file.url,alt:file.name}]);setDirty(true);}}/>
            {pois.map((poi, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label={`Lugar ${i + 1}`}
                  value={poi.lugar}
                  onChange={(e) =>
                    setPois(
                      pois.map((p, j) =>
                        j === i ? { ...p, lugar: e.target.value } : p,
                      ),
                    )
                  }
                  placeholder="Garita, plaza, escuela…"
                  className={inputClass}
                />
                <input
                  aria-label={`Minutos ${i + 1}`}
                  type="number"
                  min={1}
                  value={poi.minutos}
                  onChange={(e) =>
                    setPois(
                      pois.map((p, j) =>
                        j === i ? { ...p, minutos: Number(e.target.value) } : p,
                      ),
                    )
                  }
                  className={inputClass + " w-[90px]"}
                />
                <button
                  type="button"
                  aria-label="Quitar punto"
                  onClick={() => setPois(pois.filter((_, j) => j !== i))}
                  className={rowBtn}
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPois([...pois, { lugar: "", minutos: 5 }])}
            className={btnGhost + " mt-3 h-9"}
          >
            <Plus className="size-4" strokeWidth={1.5} /> Agregar punto
          </button>
        </div>
      </FormSection>

      {/* Contenido */}
      <FormSection id="pf-contenido" aria-labelledby="pf-contenido-heading" tabIndex={-1} className={sectionClass}>
        <h2 id="pf-contenido-heading" className="display-soft text-lg text-foreground">
          Descripción y ficha
        </h2>
        <div className="mt-5 space-y-4">
          <Field
            label="Descripción"
            htmlFor="pf-descripcion"
            hint="Separa párrafos con una línea en blanco."
          >
            <textarea
              id="pf-descripcion"
              name="descripcion"
              rows={6}
              required
              defaultValue={initial?.descripcion.join("\n\n")}
              className={textareaClass}
            />
          </Field>
          <Field
            label="Amenidades"
            htmlFor="pf-amenidades"
            hint="Una por línea."
          >
            <textarea
              id="pf-amenidades"
              name="amenidades"
              rows={4}
              defaultValue={initial?.amenidades.join("\n")}
              className={textareaClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Terreno (m²)" htmlFor="pf-terreno">
              <input
                id="pf-terreno"
                name="terreno"
                type="number"
                min={0}
                defaultValue={initial?.ficha.terrenoM2}
                className={inputClass}
              />
            </Field>
            <Field label="Construcción (m²)" htmlFor="pf-construccion">
              <input
                id="pf-construccion"
                name="construccion"
                type="number"
                min={0}
                defaultValue={initial?.ficha.construccionM2}
                className={inputClass}
              />
            </Field>
            <Field label="Antigüedad" htmlFor="pf-antiguedad">
              <input
                id="pf-antiguedad"
                name="antiguedad"
                defaultValue={initial?.ficha.antiguedad}
                placeholder="6 años"
                className={inputClass}
              />
            </Field>
            <Field label="Recámaras" htmlFor="pf-recamaras">
              <input
                id="pf-recamaras"
                name="recamaras"
                type="number"
                min={0}
                step="1"
                defaultValue={initial?.ficha.recamaras}
                className={inputClass}
              />
            </Field>
            <Field label="Baños" htmlFor="pf-banos">
              <input
                id="pf-banos"
                name="banos"
                type="number"
                min={0}
                step="0.5"
                defaultValue={initial?.ficha.banos}
                className={inputClass}
              />
            </Field>
            <Field label="Estacionamientos" htmlFor="pf-estacionamientos">
              <input
                id="pf-estacionamientos"
                name="estacionamientos"
                type="number"
                min={0}
                step="1"
                defaultValue={initial?.ficha.estacionamientos}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="border-t border-border pt-5">
            <h3 className="display-soft text-base text-foreground">Información para la ficha pública</h3>
            <p className="mt-1 text-sm text-muted-foreground">Publica solo datos autorizados. Identifica la fuente de cada superficie y registra la fecha únicamente cuando alguien verificó la disponibilidad.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Fuente de terreno" htmlFor="pf-fuenteTerreno">
                <select id="pf-fuenteTerreno" name="fuenteTerreno" defaultValue={initial?.informacionPublica?.fuenteTerreno ?? ""} className={inputClass}>
                  <option value="">Sin indicar</option><option value="escritura">Escritura</option><option value="catastro">Catastro</option><option value="plano">Plano</option><option value="medicion">Medición orientativa</option><option value="declaracion">Declaración del propietario</option>
                </select>
              </Field>
              <Field label="Fuente de construcción" htmlFor="pf-fuenteConstruccion">
                <select id="pf-fuenteConstruccion" name="fuenteConstruccion" defaultValue={initial?.informacionPublica?.fuenteConstruccion ?? ""} className={inputClass}>
                  <option value="">Sin indicar</option><option value="escritura">Escritura</option><option value="catastro">Catastro</option><option value="plano">Plano</option><option value="medicion">Medición orientativa</option><option value="declaracion">Declaración del propietario</option>
                </select>
              </Field>
              <Field label="Disponibilidad revisada el" htmlFor="pf-disponibilidadRevisadaEl">
                <input id="pf-disponibilidadRevisadaEl" name="disponibilidadRevisadaEl" type="date" defaultValue={initial?.informacionPublica?.disponibilidadRevisadaEl} className={inputClass} />
              </Field>
              <Field label="Ocupación y entrega" htmlFor="pf-ocupacionEntrega" hint="Condición comunicable al público; evita datos personales del ocupante.">
                <input id="pf-ocupacionEntrega" name="ocupacionEntrega" maxLength={500} defaultValue={initial?.informacionPublica?.ocupacionEntrega} placeholder="Ej. Desocupada; fecha de entrega por acordar" className={inputClass} />
              </Field>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Multimedia */}
      <FormSection id="pf-multimedia" aria-labelledby="pf-multimedia-heading" tabIndex={-1} className={sectionClass}>
        <h2 id="pf-multimedia-heading" className="display-soft text-lg text-foreground">Multimedia</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Puedes usar URLs o cargar material público validado. No incluyas
          documentos confidenciales.
        </p>
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">Galería</p>
          <UploadControl
            label="Subir imagen pública"
            accept="image/jpeg,image/png,image/webp,image/gif"
            publicOnly
            onUploaded={(file) =>
              { setDirty(true); setGaleria((current) => [
                ...current,
                { src: file.url, alt: file.name },
              ]); }
            }
          />
          <div className="mt-2 space-y-2">
            {galeria.map((img, i) => (
              <div key={i} className="grid min-w-0 grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 sm:col-span-2">
                  {img.src && publicGalleryUrl(img.src) && <Image unoptimized width={960} height={720} src={img.src} alt={img.alt} className="h-16 w-24 rounded object-cover"/>}
                  <span className="flex-1 text-sm">{i===0?"Portada":`Foto ${i+1}`}</span>
                  <button type="button" className={rowBtn} disabled={i===0} aria-label={`Subir foto ${i+1}`} onClick={()=>moveImage(i,-1)}><ArrowUp size={16}/></button>
                  <button type="button" className={rowBtn} disabled={i===galeria.length-1} aria-label={`Bajar foto ${i+1}`} onClick={()=>moveImage(i,1)}><ArrowDown size={16}/></button>
                </div>
                <input
                  aria-label={`Imagen ${i + 1}: URL`}
                  value={img.src}
                  onChange={(e) =>
                    setGaleria(
                      galeria.map((g, j) =>
                        j === i ? { ...g, src: e.target.value } : g,
                      ),
                    )
                  }
                  placeholder="/hero/casa-playa.webp"
                  list="pf-imagenes"
                  className={inputClass}
                />
                <input
                  aria-label={`Imagen ${i + 1}: texto alternativo`}
                  value={img.alt}
                  onChange={(e) =>
                    setGaleria(
                      galeria.map((g, j) =>
                        j === i ? { ...g, alt: e.target.value } : g,
                      ),
                    )
                  }
                  placeholder="Descripción de la imagen (alt)"
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label="Quitar imagen"
                  onClick={() => {setGaleria(galeria.filter((_, j) => j !== i));setDirty(true);}}
                  className={rowBtn}
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
          <datalist id="pf-imagenes">
            {[
              "/hero/casa-playa.webp",
              "/hero/edificio-ciudad.webp",
              "/hero/interior-depa.webp",
              "/hero/plaza.webp",
              "/hero/nave-tijuana.webp",
              "/hero/interior-plaza.webp",
              "/hero/parque-industrial.webp",
            ].map((src) => (
              <option key={src} value={src} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => setGaleria([...galeria, { src: "", alt: "" }])}
            className={btnGhost + " mt-3 h-9"}
          >
            <Plus className="size-4" strokeWidth={1.5} /> Agregar imagen
          </button>
          <LibraryPicker kind="imagen" allowed={publicGalleryUrl} onChoose={file => { setGaleria([...galeria, { src: file.url, alt: file.nombre }]); setDirty(true); }}/>
        </div>

        <div className="mt-4">
          <UploadControl
            label="Subir video público"
            accept="video/mp4,video/webm"
            publicOnly
            onUploaded={(file) => {
              const input = document.getElementById(
                "pf-video",
              ) as HTMLInputElement | null;
              if (input) input.value = file.url;
            }}
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Video (URL)"
            htmlFor="pf-video"
            hint="Espacio reservado en la galería pública."
          >
            <input
              id="pf-video"
              name="videoUrl"
              defaultValue={initial?.videoUrl}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>
          <Field label="Recorrido 360 (URL)" htmlFor="pf-360">
            <input
              id="pf-360"
              name="tour360Url"
              defaultValue={initial?.tour360Url}
              placeholder="https://…"
              className={inputClass}
            />
          </Field>
        </div>
      </FormSection>

      {/* Documentos PDF */}
      <FormSection id="pf-documentos" aria-labelledby="pf-documentos-heading" tabIndex={-1} className={sectionClass}>
        <h2 id="pf-documentos-heading" className="display-soft text-lg text-foreground">
          Documentos descargables (PDF)
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Publica únicamente material comercial. Estos archivos tienen una URL pública;
          el formulario de contacto no protege su confidencialidad. Guarda identificaciones
          y documentos del expediente en archivos privados.
        </p>
        <UploadControl
          label="Subir PDF público"
          accept="application/pdf"
          publicOnly
          onUploaded={(file) =>
            setDocumentos((current) => [
              ...current,
              { codigo: "", nombre: file.name, descripcion: "", url: file.url },
            ])
          }
        />
        <div className="mt-4 space-y-3">
          {documentos.map((doc, i) => (
            <div key={i} className="rounded-md border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-[130px_1fr_auto]">
                <input
                  aria-label={`Documento ${i + 1}: código`}
                  value={doc.codigo}
                  onChange={(e) =>
                    setDocumentos(
                      documentos.map((d, j) =>
                        j === i ? { ...d, codigo: e.target.value } : d,
                      ),
                    )
                  }
                  placeholder="FIC-PRO-001"
                  className={inputClass + " font-mono text-sm"}
                />
                <input
                  aria-label={`Documento ${i + 1}: nombre`}
                  value={doc.nombre}
                  onChange={(e) =>
                    setDocumentos(
                      documentos.map((d, j) =>
                        j === i ? { ...d, nombre: e.target.value } : d,
                      ),
                    )
                  }
                  placeholder="Ficha técnica en PDF"
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label="Quitar documento"
                  onClick={() =>
                    setDocumentos(documentos.filter((_, j) => j !== i))
                  }
                  className={rowBtn}
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  aria-label={`Documento ${i + 1}: descripción`}
                  value={doc.descripcion}
                  onChange={(e) =>
                    setDocumentos(
                      documentos.map((d, j) =>
                        j === i ? { ...d, descripcion: e.target.value } : d,
                      ),
                    )
                  }
                  placeholder="Qué contiene el documento"
                  className={inputClass}
                />
                <input
                  aria-label={`Documento ${i + 1}: URL del PDF`}
                  value={doc.url}
                  onChange={(e) =>
                    setDocumentos(
                      documentos.map((d, j) =>
                        j === i ? { ...d, url: e.target.value } : d,
                      ),
                    )
                  }
                  placeholder="/descargas/ficha-tecnica-demo.pdf"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setDocumentos([
              ...documentos,
              { codigo: "", nombre: "", descripcion: "", url: "" },
            ])
          }
          className={btnGhost + " mt-3 h-9"}
        >
          <Plus className="size-4" strokeWidth={1.5} /> Agregar PDF
        </button>
        <LibraryPicker kind="pdf" allowed={publicGalleryUrl} onChoose={file => { setDocumentos([...documentos, { codigo: file.id, nombre: file.nombre, descripcion: file.notas ?? "", url: file.url }]); setDirty(true); }}/>
      </FormSection>

      {/* Sticky stays in flow, reserving its own space after the final fields. */}
      <div className="sticky bottom-0 z-20 space-y-3 rounded-lg border border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
        <p role="status" className="text-sm font-semibold">{dirty ? "Cambios sin guardar" : "Sin cambios pendientes"} · {initial?.publicada ? "Publicado" : "Borrador"}</p>
        <div className="flex flex-wrap items-end gap-3">
          <nav aria-label="Secciones del inmueble" className="w-full min-w-0 sm:flex-1">
            <label htmlFor="pf-seccion" className="sr-only">Ir a sección</label>
            <select
              id="pf-seccion"
              defaultValue=""
              className={selectClass}
              onChange={(event) => {
                const select = event.currentTarget;
                const section = document.getElementById(select.value);
                if (!section) return;
                revealSection(section);
                select.value = "";
              }}
            >
              <option value="" disabled>Ir a sección…</option>
              {formSections.map((section) => (
                <option key={section.id} value={section.id}>{section.label}</option>
              ))}
            </select>
          </nav>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button type="submit" className={btnPrimary + " flex-1 sm:flex-none"}>
              {initial ? "Guardar cambios" : "Crear inmueble"}
            </button>
            {initial && <button type="submit" disabled={!initial.publicada && !publicationReady} data-action={initial.publicada?"unpublish":"publish"} className={btnGhost+" flex-1 sm:flex-none"}>{initial.publicada?"Retirar del sitio":"Guardar y publicar"}</button>}
            <button
              type="button"
              onClick={async () => {if(!dirty || await confirmAction("Hay cambios sin guardar. ¿Salir del editor?"))router.push("/admin/propiedades");}}
              className={btnGhost + " flex-1 sm:flex-none"}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </AsyncForm>
  );
}
