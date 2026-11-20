"use client";
import * as React from "react";
import Link from "next/link";
import { Camera, ExternalLink, Film, Key, Pencil, Route, Trash2 } from "@/components/admin/icons";
import { Avatar, ButtonLink, Pill, Sheet, StageRail, Thumb } from "@/components/admin/kit";
import { AsyncButton } from "@/components/admin/ui";
import { confirmDelete } from "@/components/admin/workspace/confirm";
import type { Undoable } from "@/components/admin/workspace/undo-notice";
import { OPERACION_LABELS, TIPO_LABELS } from "@/data/propiedades";
import type { Pendiente } from "@/lib/admin/inmuebles-vitrina";
import { operationHref, stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { usePropertyScope } from "@/lib/admin/staff-scope";
import { db, removePropiedad, type AdminProperty } from "@/lib/admin/store";
import { PREP_ITEMS, PREP_STATES, openKeyLoans, prepState, type PrepItem } from "@/lib/propiedad-seguimiento";
import { FeaturedButton, PrecioEnFila, PropertyStatus } from "./property-inline";
import { PropertyShareActions } from "./property-share";
import s from "./properties.module.css";

/*
  Ficha rápida del inmueble (LV-10f, mezcla de las tres direcciones del boceto «Inmuebles en tres
  direcciones», 15/11/2026): galería con los huecos por llenar, la etapa de su asunto, «Lo que
  sigue» con su acción, la preparación pieza por pieza y, a un lado, precio, estado y personas.
  Todo lo que cambia aquí guarda con la versión del inmueble; editar la ficha completa sigue en
  su propia página.
*/

export type SheetData = { property: AdminProperty; adviser?: { nombre: string; foto?: string }; owner?: string; op?: OperationRecord; pendiente?: Pendiente; facts: string; state: string };

export function PropertySheet({ data, today, offer, onClose }: { data: SheetData | null; today: string; offer: (u: Undoable) => void; onClose: () => void }) {
  return <Sheet open={!!data} onClose={onClose} wide title={data?.property.titulo ?? "Inmueble"} description={data ? [data.property.zona, data.facts].filter(Boolean).join(" · ") || undefined : undefined}>
    {data && <SheetBody data={data} today={today} offer={offer} onClose={onClose} />}
  </Sheet>;
}

function SheetBody({ data, today, offer, onClose }: { data: SheetData; today: string; offer: (u: Undoable) => void; onClose: () => void }) {
  const { property: p, adviser, owner, op, pendiente } = data;
  const scope = usePropertyScope(p);
  const slug = encodeURIComponent(p.slug);
  const edit = `/admin-anterior/propiedades/${slug}/editar`, followup = `/admin-anterior/propiedades/${slug}/seguimiento`;
  const photos = p.galeria.slice(0, 3);
  const items = (Object.keys(PREP_ITEMS) as PrepItem[]).map(item => ({ item, estado: prepState(p, item).estado }));
  const missing = items.filter(x => x.estado !== "listo" && x.estado !== "no_aplica");
  const track = op ? stageTrack(op, today) : null;
  const lent = openKeyLoans(p.llaves)[0];
  const next = pendiente ? { text: pendiente.motivo, action: pendiente.accion, href: pendiente.href }
    : missing.length && scope.edit ? { text: `Preparar ${missing.length === 1 ? "la pieza que falta" : `las ${missing.length} piezas que faltan`} para promoverlo`, action: "Ver la preparación", href: followup }
    : null;

  return <div className={s.sheetGrid}>
    <div className={s.gallery} data-count={Math.max(1, photos.length)}>
      {photos.length ? photos.map((photo, i) => <Thumb key={photo.src + i} src={photo.src} alt={i === 0 ? `Foto de ${p.titulo}` : ""} ratio={i === 0 ? "4 / 3" : undefined} className={s.galleryPhoto} />)
        : scope.edit ? <Link href={edit} className={s.slot}><Camera size={22} aria-hidden="true" />Subir fotos</Link>
        : <span className={s.slot}><Camera size={22} aria-hidden="true" />Sin fotos</span>}
      {scope.edit && photos.length > 0 && photos.length < 3 && !p.videoUrl && <Link href={edit} className={s.slot}><Film size={20} aria-hidden="true" />Agregar video</Link>}
      {scope.edit && photos.length > 0 && photos.length < 2 && !p.tour360Url && <Link href={edit} className={s.slot}><Route size={20} aria-hidden="true" />Agregar recorrido 360</Link>}
    </div>

    <div className={s.sheetMain}>
      <div className={s.tags}>
        <Pill size="sm">{OPERACION_LABELS[p.operacion]}</Pill>
        <Pill size="sm" tone={data.state === "Publicado" ? "success" : "neutral"}>{data.state}</Pill>
        {p.destacada && <Pill size="sm" tone="brand">Destacada</Pill>}
        {p.origen === "compartido" && <Pill size="sm" tone="muted">Compartido</Pill>}
        {p.demo && <Pill size="sm" tone="muted">Ejemplo</Pill>}
      </div>

      {track && op && <section className={s.stage} aria-labelledby="ficha-etapa">
        <div className={s.stageHead}><h3 id="ficha-etapa">Etapa {track.current + 1} de {track.stages.length} · {track.stages[track.current]?.label}</h3>
          <Link href={operationHref(op.id)} className={s.textLink}>Abrir el asunto {op.folio}</Link></div>
        <StageRail total={track.stages.length} current={track.current} className={s.bigRail} />
      </section>}

      <section className={s.next} aria-labelledby="ficha-sigue">
        <h3 id="ficha-sigue">Lo que sigue</h3>
        {next ? <><p>{next.text}</p><ButtonLink href={next.href} variant="primary" aria-label={`${next.action}: ${p.titulo}`}>{next.action}</ButtonLink></>
          : <p className={s.calm}>Nada pendiente en su ficha.</p>}
        {lent && <p className={s.lent}><Key size={15} aria-hidden="true" />Llaves con {lent.persona}</p>}
      </section>

      <section aria-labelledby="ficha-prep">
        <h3 id="ficha-prep" className={s.sheetH}>Preparación <span>{items.filter(x => x.estado === "listo").length} de {items.filter(x => x.estado !== "no_aplica").length}</span></h3>
        <ul className={s.prepList}>{items.map(({ item, estado }) => <li key={item} data-state={estado}><i aria-hidden="true" />{PREP_ITEMS[item]}<span>{PREP_STATES[estado]}</span></li>)}</ul>
      </section>
    </div>

    <aside className={s.sheetSide} aria-label="Datos del inmueble">
      <div className={s.kv}><span>Precio</span><PrecioEnFila property={p} editable={scope.edit && p.precio.modalidad !== "consulta"} offer={offer} big /></div>
      <div className={s.kv}><span>Estado</span>{scope.edit ? <PropertyStatus property={p} />
        : <p className="text-sm text-muted-foreground">Este inmueble es de {adviser?.nombre ?? "otro asesor"}: solo su asesor o el director lo cambian.</p>}</div>
      <h3 className={s.sheetH}>Personas</h3>
      <div className={s.people}>
        {owner && <span className={s.person}><Avatar name={owner} size={34} /><span><b>{owner}</b><small>Propietario</small></span></span>}
        <span className={s.person}>{adviser ? <Avatar name={adviser.nombre} src={adviser.foto} size={34} /> : <Avatar name="?" size={34} />}<span><b>{adviser?.nombre ?? "Sin asignar"}</b><small>Responsable</small></span></span>
      </div>
      <h3 className={s.sheetH}>Ficha</h3>
      <dl className={s.facts}>
        <dt>Código</dt><dd className="break-all">{p.codigo}</dd>
        <dt>Tipo</dt><dd>{TIPO_LABELS[p.tipo] ?? p.tipo}</dd>
        <dt>PDF</dt><dd>{p.documentos?.length ?? 0}</dd>
      </dl>
      <PropertyShareActions property={p} actionClass={s.action} />
    </aside>

    <div className={s.sheetActs}>
      {scope.edit && <ButtonLink href={edit} variant="primary" aria-label={`Editar ${p.titulo}`}><Pencil size={15} aria-hidden="true" />Editar ficha</ButtonLink>}
      {scope.edit && <Link href={followup} className={s.action} aria-label={`Llaves, preparación y compradores de ${p.titulo}`}><Key size={15} aria-hidden="true" />Llaves y compradores</Link>}
      <Link href={`/inventario/${slug}`} target="_blank" className={s.action} aria-label={`Ver ${p.titulo} en el sitio`}><ExternalLink size={15} aria-hidden="true" />Ver en el sitio</Link>
      {scope.feature && <FeaturedButton property={p} className={s.action} />}
      {scope.edit && <AsyncButton type="button" className={s.action} data-danger aria-label={`Eliminar ${p.titulo}`} onClick={async () => {
        if (await confirmDelete("inmueble", `«${p.titulo}» deja de estar en Inmuebles y en el sitio; el director lo restaura sin publicar.`, "o")) { await removePropiedad(p.slug, db.propiedades.version(p)); onClose(); }
      }}><Trash2 size={15} aria-hidden="true" />Eliminar</AsyncButton>}
    </div>
  </div>;
}
