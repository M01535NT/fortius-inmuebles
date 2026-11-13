"use client";
import * as React from "react";
import Link from "next/link";
import { ExternalLink, Pencil } from "@/components/admin/icons";
import { Button, ButtonLink, Notice, Pill, TabPanel, Tabs } from "@/components/admin/kit";
import { RecordNotes, useRecordNotes } from "@/components/admin/workspace/record-notes";
import { EmptyState, PageHeader, btnGhost } from "@/components/admin/ui";
import { PropertyForm } from "@/components/admin/property-form";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { HistoryLink } from "@/components/admin/workspace/history-link";
import { RelatedWork } from "@/components/admin/workspace/related-work";
import { PropertyToolWork } from "@/components/admin/apps/property-tool-work";
import { TIPO_LABELS, type Property } from "@/data/propiedades";
import { db, upsertPropiedad, useCollection, useLoadState, type AdminProperty } from "@/lib/admin/store";
import { openKeyLoans } from "@/lib/propiedad-seguimiento";
import { BuyersBlock, KeysBlock, PrepBlock } from "./property-followup";

/*
  Ficha del inmueble (SIM-19, 12/11/2026): una sola pantalla con cuatro pestañas en lugar de
  «Editar inmueble» y «Llaves y compradores». «Ficha pública» y «Fotos y material» son el
  mismo formulario de siempre repartido en dos (un solo guardado, con su borrador y su
  conflicto 409); «Llaves» e «Interesados» guardan cada registro al momento. Mientras la
  ficha tenga cambios sin guardar, esos registros esperan: así nadie pisa la versión abierta.
  Las dos direcciones siguen sirviendo: /editar abre la ficha y /seguimiento sus llaves.
*/

export type PropertyTab = "ficha" | "material" | "llaves" | "interesados";
const TABS: PropertyTab[] = ["ficha", "material", "llaves", "interesados"];
// «?seccion=» venía de Hoy y de la ficha de la persona; sigue abriendo lo mismo.
const SECTION_TAB: Record<string, PropertyTab> = { llaves: "llaves", preparacion: "material", compradores: "interesados" };

function tabFromUrl(fallback: PropertyTab): PropertyTab {
  const query = new URLSearchParams(window.location.search);
  const tab = query.get("tab") as PropertyTab | null;
  return tab && TABS.includes(tab) ? tab : SECTION_TAB[query.get("seccion") ?? ""] ?? fallback;
}

/*
  Plaza o conjunto (titular, 27/10/2026): si se comercializa completa es este inmueble y su
  operación; los locales que se venden o rentan por separado son inmuebles propios, ligados aquí.
*/
function PlazaUnits({ slug, units }: { slug: string; units: Property[] }) {
  return (
    <section aria-labelledby="locales-plaza" className="space-y-3 rounded-xl border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="locales-plaza" className="text-lg font-semibold">Locales de esta plaza</h2>
          <p className="text-sm text-muted-foreground">Un local que se vende o renta aparte es otro inmueble, con su operación y folio. La plaza completa se trabaja aquí.</p>
        </div>
        <Link href={`/admin/propiedades/nueva?conjunto=${encodeURIComponent(slug)}`} className={btnGhost}>Agregar un local de esta plaza</Link>
      </div>
      {units.length ? (
        <ul className="divide-y divide-border">
          {units.map((unit) => (
            <li key={unit.slug} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="min-w-0"><span className="font-semibold">{unit.titulo}</span> <span className="tabular-nums text-xs text-muted-foreground">{unit.codigo}</span></span>
              <span className="flex items-center gap-3 text-sm text-muted-foreground">{TIPO_LABELS[unit.tipo]} · {unit.publicada ? "Publicado" : "Sin publicar"}<Link href={`/admin/propiedades/${encodeURIComponent(unit.slug)}/editar`} className="font-semibold text-foreground underline underline-offset-4">Abrir</Link></span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Todavía no hay locales ligados a esta plaza.</p>}
    </section>
  );
}

export function PropertyFile({ slug, initialTab = "ficha" }: { slug: string; initialTab?: PropertyTab }) {
  const propiedades = useCollection(db.propiedades);
  const load = useLoadState(db.propiedades);
  const current = propiedades.find((p) => p.slug === slug);
  const [tab, setTab] = React.useState<PropertyTab>(initialTab);
  const [dirty, setDirty] = React.useState(false);
  // La ficha abre sobre una instantánea; sin cambios pendientes se pone al día con lo guardado en otra pestaña.
  const [snapshot, setSnapshot] = React.useState(current);
  if (!snapshot && current) setSnapshot(current);
  if (snapshot && current && !dirty && current !== snapshot && db.propiedades.version(current) !== db.propiedades.version(snapshot)) setSnapshot(current);
  const property = snapshot ?? current;
  // La pestaña de la dirección se lee en el navegador, después de montar, para no desfasar el HTML del servidor.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { setTab(tabFromUrl(initialTab)); }, [initialTab]);
  function choose(next: PropertyTab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.delete("seccion"); url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url);
  }
  const showForm = React.useCallback((next: "ficha" | "material") => setTab(next), []);
  const [notesOpen, setNotesOpen] = React.useState(false);
  const noteCount = useRecordNotes({ propiedadSlug: slug }).length;

  if (!property && !load.loaded) return <PageHeader title="Inmueble" />;
  if (!property) return (
    <div className="space-y-6">
      <PageHeader title="Inmueble no encontrado." />
      <EmptyState title={`No existe "${slug}" en el inventario.`} />
      <Link href="/admin/propiedades" className={btnGhost}>Volver al inventario</Link>
    </div>
  );

  const latest = current ?? property;
  const save = (patch: Partial<AdminProperty>) => upsertPropiedad({ ...latest, ...patch }, db.propiedades.version(latest));
  const openLoans = openKeyLoans(latest.llaves ?? { prestamos: [] }).length;
  const items = [
    { id: "ficha" as const, label: "Ficha pública" },
    { id: "material" as const, label: "Fotos y material" },
    { id: "llaves" as const, label: "Llaves", ...(openLoans ? { count: openLoans } : {}) },
    { id: "interesados" as const, label: "Interesados" },
  ];
  const waiting = dirty && <Notice title="Primero guarda la ficha">Hay cambios sin guardar en la ficha. Guárdalos o cancélalos antes de registrar esto, para no pisar la versión abierta.</Notice>;
  const records = (children: React.ReactNode) => <>{waiting}<fieldset disabled={dirty} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">{children}</fieldset></>;

  return <GuidedPage title={property.titulo} subtitle={<span className="inline-flex flex-wrap items-center gap-2">
      <span>{property.codigo ? `${property.codigo} · ` : ""}{TIPO_LABELS[property.tipo]}</span>
      <Pill size="sm" tone={latest.publicada ? "success" : "neutral"}>{latest.publicada ? "Publicado" : "Sin publicar"}</Pill>
      {latest.demo && <Pill size="sm" tone="warn">Ejemplo</Pill>}
    </span>} actions={<>
      {latest.publicada && <ButtonLink href={`/inventario/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" />Ver en el sitio</ButtonLink>}
      <Button onClick={() => setNotesOpen(true)}><Pencil size={16} aria-hidden="true" />{noteCount ? `Notas (${noteCount})` : "Notas"}</Button>
      <HistoryLink collection="propiedades" id={slug} />
    </>}>
    <RecordNotes link={{ propiedadSlug: slug }} open={notesOpen} onClose={() => setNotesOpen(false)} title="Notas del inmueble" description="Lo que hay que saber o recordar de este inmueble." />
    <div className="flex min-w-0 flex-col gap-5">
      <Tabs items={items} value={tab} onChange={choose} label="Ficha del inmueble" idPrefix="inmueble" />
      {!current && <p role="alert" className="text-sm text-destructive">El inmueble ya no aparece en el servidor. Conserva el borrador; guardarlo requerirá resolver el conflicto.</p>}
      <TabPanel idPrefix="inmueble" id={tab} className="flex min-w-0 flex-col gap-5">
        {tab === "material" && <div className="flex max-w-[880px] min-w-0 flex-col gap-5">{records(<PrepBlock property={latest} save={save} />)}</div>}
        {/* Un solo formulario para las dos primeras pestañas: cambiar de pestaña no pierde lo escrito. */}
        <PropertyForm key={`${slug}:${db.propiedades.version(property) ?? "nuevo"}`} initial={property} view={tab === "ficha" || tab === "material" ? tab : "oculto"} onDirtyChange={setDirty} onShowTab={showForm} />
        {tab === "ficha" && <>
          {property.tipo === "plaza" && <PlazaUnits slug={slug} units={propiedades.filter((p) => p.conjunto === slug)} />}
          <RelatedWork propertySlug={slug} />
          {/* HER-05: la hipoteca se abre con el precio de venta puesto; los cálculos guardados se ven aquí. */}
          <PropertyToolWork slug={slug} precio={latest.operacion === "venta" && latest.precio.modalidad !== "consulta" ? latest.precio.monto : undefined} moneda={latest.precio.modalidad !== "consulta" ? latest.precio.moneda : undefined} />
        </>}
        {tab === "llaves" && records(<KeysBlock property={latest} save={save} />)}
        {tab === "interesados" && records(<BuyersBlock property={latest} save={save} />)}
      </TabPanel>
    </div>
  </GuidedPage>;
}
