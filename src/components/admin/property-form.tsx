"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

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
  TIPO_LABELS,
  type DocumentoPropiedad,
  type ImagenPropiedad,
  type Property,
  type TipoPropiedad,
} from "@/data/propiedades";
import { zonas } from "@/data/zonas";
import { db, upsertPropiedad, useCollection } from "@/lib/admin/store";

/*
  Formulario completo de inmueble (alta y edición). Los campos de lista
  (galería, documentos PDF, puntos de interés) son filas dinámicas; los
  textos largos usan convención simple: párrafos separados por línea en
  blanco, amenidades una por línea.
  Los PDFs cargados aquí aparecen en la sección "Documentos de la
  propiedad" del detalle público (con captura de datos del interesado).
*/
type Props = { initial?: Property };

// Mirror the public projection's URL boundary for publication feedback.
function publicGalleryUrl(value: string) {
  if (
    /(cota-private|\/api\/admin\/|\/storage\/v1\/object\/sign\/)/i.test(value)
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

  const [titulo, setTitulo] = React.useState(initial?.titulo ?? "");
  const [galeria, setGaleria] = React.useState<ImagenPropiedad[]>(
    initial?.galeria ?? [],
  );
  const [documentos, setDocumentos] = React.useState<DocumentoPropiedad[]>(
    initial?.documentos ?? [],
  );
  const [pois, setPois] = React.useState(initial?.puntosDeInteres ?? []);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const v = (name: string) => String(f.get(name) ?? "").trim();
    const num = (name: string) => (v(name) ? Number(v(name)) : undefined);

    const slug = initial?.slug ?? slugify(v("slug") || titulo);
    if (!slug) {
      setError("El título o slug no puede estar vacío.");
      return;
    }
    if (!initial && propiedades.some((p) => p.slug === slug)) {
      setError(`Ya existe un inmueble con el slug "${slug}".`);
      return;
    }

    const modalidad = v("modalidad");
    const property: Property = {
      ...initial,
      slug,
      codigo:
        v("codigo") ||
        `COTA-${String(propiedades.length + 1).padStart(3, "0")}`,
      titulo: titulo.trim(),
      tipo: v("tipo") as TipoPropiedad,
      operacion: v("operacion") as Property["operacion"],
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
      estado: v("estado") as Property["estado"],
      publicadaEl:
        initial?.publicadaEl.slice(0, 10) === v("publicadaEl")
          ? initial.publicadaEl
          : v("publicadaEl"),
      demo: f.get("demo") === "on",
      publicada: f.get("publicada") === "on",
    };

    if (
      property.publicada &&
      !property.galeria.some((image) => publicGalleryUrl(image.src))
    ) {
      setError(
        "Para publicar, agrega al menos una imagen pública a la galería. Los enlaces privados no aparecen en el sitio.",
      );
      return;
    }

    await upsertPropiedad(property, version);
    router.push("/admin/propiedades");
  }

  const rowBtn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  return (
    <AsyncForm onSubmit={onSubmit} className="max-w-[880px] space-y-8">
      {/* Básicos */}
      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <h2 className="display-soft text-lg text-foreground">Datos básicos</h2>
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
          <Field label="Código interno" htmlFor="pf-codigo">
            <input
              id="pf-codigo"
              name="codigo"
              defaultValue={initial?.codigo}
              placeholder="COTA-004"
              className={inputClass}
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
              defaultValue={initial?.operacion ?? "venta"}
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
              defaultValue={initial?.estado ?? "disponible"}
              className={selectClass}
            >
              <option value="disponible">Disponible</option>
              <option value="apartada">Apartada</option>
              <option value="vendida">Vendida</option>
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
              required
              defaultValue={
                initial?.publicadaEl.slice(0, 10) ??
                new Date().toISOString().slice(0, 10)
              }
              className={inputClass}
            />
          </Field>
          <div className="flex flex-wrap items-end gap-6 pb-1">
            <label className="flex items-center gap-2 text-[13.5px] text-foreground">
              <input
                type="checkbox"
                name="destacada"
                defaultChecked={initial?.destacada}
                className="size-4 accent-[var(--primary)]"
              />
              Destacada en Home
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-foreground">
              <input
                type="checkbox"
                name="credito"
                defaultChecked={initial?.creditoDisponible}
                className="size-4 accent-[var(--primary)]"
              />
              Acepta crédito
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="publicada"
                defaultChecked={initial?.publicada ?? false}
              />
              Publicar en el sitio
            </label>
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
      </section>

      {/* Precio */}
      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <h2 className="display-soft text-lg text-foreground">Precio</h2>
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
      </section>

      {/* Ubicación */}
      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <h2 className="display-soft text-lg text-foreground">Ubicación</h2>
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
          <p className="text-[13px] font-medium text-foreground">
            Puntos de interés cercanos
          </p>
          <div className="mt-2 space-y-2">
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
      </section>

      {/* Contenido */}
      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <h2 className="display-soft text-lg text-foreground">
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
        </div>
      </section>

      {/* Multimedia */}
      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <h2 className="display-soft text-lg text-foreground">Multimedia</h2>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">
          Puedes usar URLs o cargar material público validado. No incluyas
          documentos confidenciales.
        </p>
        <div className="mt-4">
          <p className="text-[13px] font-medium text-foreground">Galería</p>
          <UploadControl
            label="Subir imagen pública"
            accept="image/jpeg,image/png,image/webp,image/gif"
            publicOnly
            onUploaded={(file) =>
              setGaleria((current) => [
                ...current,
                { src: file.url, alt: file.name },
              ])
            }
          />
          <div className="mt-2 space-y-2">
            {galeria.map((img, i) => (
              <div key={i} className="flex gap-2">
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
                  onClick={() => setGaleria(galeria.filter((_, j) => j !== i))}
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
      </section>

      {/* Documentos PDF */}
      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <h2 className="display-soft text-lg text-foreground">
          Documentos descargables (PDF)
        </h2>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">
          Aparecen en el detalle público y se liberan a cambio de los datos del
          interesado (cada descarga genera un lead).
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
                  className={inputClass + " font-mono text-[12.5px]"}
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
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-[13px] text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button type="submit" className={btnPrimary}>
          {initial ? "Guardar cambios" : "Crear inmueble"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/propiedades")}
          className={btnGhost}
        >
          Cancelar
        </button>
      </div>
    </AsyncForm>
  );
}
