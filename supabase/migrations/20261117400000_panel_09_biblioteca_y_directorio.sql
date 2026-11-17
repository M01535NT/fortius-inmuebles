-- Etapa 7 de PLAN.md: Directorio y Biblioteca (SPEC.md, secciones 6 y 10).
-- · La Biblioteca guarda listas de qué pedir, planes de qué hacer y apartados propios. Copiar a un asunto copia el
--   contenido; cambiarlo en el asunto no toca el original. Todos la ven; la cambia quien la escribió o el director.
-- · «Unir» junta dos fichas de la misma persona: la que se va se archiva (no se borra) y todo lo suyo pasa a la que se queda.
-- Detalle: docs/operacion/modelo-de-datos-panel.md, secciones 4.3 y 4.12.
begin;

-- ── Biblioteca ────────────────────────────────────────────────────────────────────────────────────────
create table public.fortius_inmuebles_biblioteca (
  id uuid primary key default gen_random_uuid(),
  clase text not null check (clase in ('que_pedir', 'que_hacer', 'apartado_propio')),
  nombre text not null check (length(btrim(nombre)) between 1 and 160),
  descripcion text not null default '' check (length(descripcion) <= 2000),
  -- que_pedir: {documentos: [{nombre, entrega_papel?}]}
  -- que_hacer: {etapas: [{nombre, tareas: [{titulo, quien, dias?}]}]}
  -- apartado_propio: {vista, columnas: [...]}
  contenido jsonb not null default '{}' check (jsonb_typeof(contenido) = 'object' and octet_length(contenido::text) <= 100000),
  revisado_abogado boolean not null default false,
  es_ejemplo boolean not null default false,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id)
);
create index on public.fortius_inmuebles_biblioteca (clase, nombre) where deleted_at is null;

-- «Revisado por el abogado» lo marca solo el director.
create function public.fortius_inmuebles_guard_biblioteca() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.revisado_abogado and (tg_op = 'INSERT' or not old.revisado_abogado) and auth.uid() is not null
     and not public.fortius_inmuebles_is_admin() then
    raise sqlstate 'PT403' using message = 'Solo el director marca lo revisado por el abogado';
  end if;
  if tg_op = 'UPDATE' and new.clase <> old.clase then
    raise sqlstate '22023' using message = 'No cambia de clase';
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_biblioteca() from public, anon, authenticated, service_role;

create trigger fortius_01_version before update on public.fortius_inmuebles_biblioteca
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_biblioteca
  for each row execute function public.fortius_inmuebles_guard_biblioteca();

alter table public.fortius_inmuebles_biblioteca enable row level security;
revoke all on public.fortius_inmuebles_biblioteca from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_biblioteca to authenticated;
grant all on public.fortius_inmuebles_biblioteca to service_role;
create policy biblioteca_read on public.fortius_inmuebles_biblioteca for select to authenticated
  using ((select public.fortius_inmuebles_is_staff()));
create policy biblioteca_insert on public.fortius_inmuebles_biblioteca for insert to authenticated
  with check (creado_por = (select auth.uid()) and (select public.fortius_inmuebles_is_staff()));
create policy biblioteca_update on public.fortius_inmuebles_biblioteca for update to authenticated
  using ((select public.fortius_inmuebles_is_admin()) or creado_por = (select auth.uid()))
  with check ((select public.fortius_inmuebles_is_admin()) or creado_por = (select auth.uid()));

-- Las llaves que quedaron pendientes: de dónde se copió una etapa del plan o un apartado propio.
alter table public.fortius_inmuebles_plan_etapas
  add constraint plan_etapas_biblioteca_fk foreign key (biblioteca_id) references public.fortius_inmuebles_biblioteca (id) on delete restrict;
alter table public.fortius_inmuebles_apartados
  add constraint apartados_biblioteca_fk foreign key (biblioteca_id) references public.fortius_inmuebles_biblioteca (id) on delete restrict;

-- Contenido de ejemplo (del boceto aprobado). Sin revisar por el abogado; el titular lo cambia o lo quita.
insert into public.fortius_inmuebles_biblioteca (clase, nombre, contenido, es_ejemplo) values
  ('que_pedir', 'Lo básico de cualquier asunto', '{"documentos":[{"nombre":"Identificación de quien llama"},{"nombre":"Escritura o datos del registro"},{"nombre":"Boleta predial reciente"}]}', true),
  ('que_pedir', 'Titular fallecido sin testamento', '{"documentos":[{"nombre":"Acta de defunción"},{"nombre":"Actas de nacimiento de los herederos"},{"nombre":"Acta de matrimonio, si estaba casado"}]}', true),
  ('que_pedir', 'Título por sentencia', '{"documentos":[{"nombre":"Sentencia"},{"nombre":"Constancia de que quedó firme"},{"nombre":"Inscripción en el Registro Público"}]}', true),
  ('que_pedir', 'Inmueble con hipoteca', '{"documentos":[{"nombre":"Estado de cuenta del crédito"},{"nombre":"Datos del acreedor"}]}', true),
  ('que_pedir', 'Comprador con Infonavit', '{"documentos":[{"nombre":"Precalificación"},{"nombre":"Identificación y CURP"},{"nombre":"Acta de nacimiento"}]}', true),
  ('que_pedir', 'Copropiedad o divorcio', '{"documentos":[{"nombre":"Acta de matrimonio o de divorcio"},{"nombre":"Convenio de liquidación"},{"nombre":"Identificación del copropietario"}]}', true),
  ('que_pedir', 'Nave o inmueble industrial', '{"documentos":[{"nombre":"Licencia de uso de suelo"},{"nombre":"Plano arquitectónico"},{"nombre":"Dictamen de protección civil"},{"nombre":"Factibilidad de CFE"},{"nombre":"Permiso de construcción"}]}', true),
  ('que_hacer', 'Estudio inicial', '{"etapas":[{"nombre":"Estudio inicial","tareas":[{"titulo":"Recibir los documentos","quien":"cliente"},{"titulo":"Estudiar el asunto","quien":"fortius"},{"titulo":"Emitir la opinión jurídica","quien":"fortius"},{"titulo":"Presupuesto de honorarios","quien":"fortius"}]}]}', true),
  ('que_hacer', 'Cancelación de hipoteca', '{"etapas":[{"nombre":"Cancelación de hipoteca","tareas":[{"titulo":"Pedir el saldo para liquidar","quien":"fortius"},{"titulo":"Liquidar el crédito","quien":"cliente"},{"titulo":"Carta de instrucción","quien":"fortius"},{"titulo":"Inscribir la cancelación","quien":"notaria"}]}]}', true),
  ('que_hacer', 'Crédito Infonavit', '{"etapas":[{"nombre":"Crédito Infonavit","tareas":[{"titulo":"Precalificación","quien":"cliente"},{"titulo":"Solicitar el avalúo","quien":"fortius"},{"titulo":"Integrar el expediente","quien":"fortius"}]}]}', true),
  ('que_hacer', 'Escritura', '{"etapas":[{"nombre":"Escritura","tareas":[{"titulo":"Entregar requisitos a la notaría","quien":"fortius"},{"titulo":"Pagar impuestos y derechos","quien":"cliente"},{"titulo":"Firma","quien":"notaria"}]}]}', true),
  ('que_hacer', 'Juicio sucesorio', '{"etapas":[{"nombre":"Juicio sucesorio","tareas":[{"titulo":"Reunir actas","quien":"cliente"},{"titulo":"Presentar el juicio","quien":"abogado"},{"titulo":"Adjudicación","quien":"abogado"}]}]}', true),
  ('que_hacer', 'Rescisión de contrato', '{"etapas":[{"nombre":"Rescisión de contrato","tareas":[{"titulo":"Notificar a la contraparte","quien":"abogado"},{"titulo":"Convenio o demanda","quien":"abogado"},{"titulo":"Recuperar la posesión","quien":"cliente"}]}]}', true),
  ('que_hacer', 'Rehabilitación', '{"etapas":[{"nombre":"Rehabilitación","tareas":[{"titulo":"Presupuesto de obra","quien":"fortius"},{"titulo":"Obra","quien":"cliente"},{"titulo":"Fotos del resultado","quien":"fortius"}]}]}', true),
  ('que_hacer', 'Comercializar una venta', '{"etapas":[{"nombre":"Comercializar una venta","tareas":[{"titulo":"Levantamiento","quien":"fortius"},{"titulo":"Opinión de valor","quien":"fortius"},{"titulo":"Contrato de intermediación","quien":"cliente"},{"titulo":"Publicar","quien":"fortius"},{"titulo":"Visitas y ofertas","quien":"fortius"}]}]}', true),
  ('que_hacer', 'Comercializar una renta', '{"etapas":[{"nombre":"Comercializar una renta","tareas":[{"titulo":"Fotos y medidas","quien":"fortius"},{"titulo":"Publicar","quien":"fortius"},{"titulo":"Revisar al candidato","quien":"fortius"},{"titulo":"Contrato de arrendamiento","quien":"fortius"}]}]}', true);

-- ── Unir dos fichas de la misma persona ───────────────────────────────────────────────────────────────
-- Solo el director. Todo lo de la ficha que se va pasa a la que se queda; los datos para contratos se completan
-- (lo que ya tiene la que se queda manda). Un papel repetido en el mismo asunto se retira en lugar de duplicarse.
create function public.fortius_inmuebles_unir_personas(p_origen uuid, p_destino uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare o public.fortius_inmuebles_personas; d public.fortius_inmuebles_personas;
begin
  if not public.fortius_inmuebles_is_admin() then
    raise sqlstate 'PT403' using message = 'Solo el director une fichas';
  end if;
  if p_origen = p_destino then raise sqlstate '22023' using message = 'Es la misma ficha'; end if;
  select * into o from public.fortius_inmuebles_personas where id = p_origen and deleted_at is null for update;
  select * into d from public.fortius_inmuebles_personas where id = p_destino and deleted_at is null for update;
  if o.id is null or d.id is null then raise sqlstate 'P0002' using message = 'Una de las fichas ya no existe'; end if;

  -- Papeles en asuntos: un papel no cambia de persona (guardia de la tabla), así que el de la ficha que se va se retira
  -- y la que se queda recibe uno igual; si ya lo tenía retirado, vuelve.
  update public.fortius_inmuebles_asunto_personas x set retirado_el = null
   where x.persona_id = p_destino and x.retirado_el is not null and exists (
     select 1 from public.fortius_inmuebles_asunto_personas ap
      where ap.persona_id = p_origen and ap.retirado_el is null and ap.asunto_id = x.asunto_id and ap.papel = x.papel
        and ap.inmueble_id is not distinct from x.inmueble_id);
  insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, inmueble_id, principal, nota, orden, creado_por)
  select ap.asunto_id, p_destino, ap.papel, ap.inmueble_id, ap.principal, ap.nota, ap.orden, auth.uid()
    from public.fortius_inmuebles_asunto_personas ap
   where ap.persona_id = p_origen and ap.retirado_el is null
  on conflict do nothing;
  update public.fortius_inmuebles_asunto_personas set retirado_el = now() where persona_id = p_origen and retirado_el is null;

  update public.fortius_inmuebles_tareas set persona_id = p_destino where persona_id = p_origen;
  update public.fortius_inmuebles_tareas set quien_persona_id = p_destino where quien_persona_id = p_origen;
  update public.fortius_inmuebles_asunto_documentos set entrega_persona_id = p_destino where entrega_persona_id = p_origen;
  update public.fortius_inmuebles_asunto_documentos set de_persona_id = p_destino where de_persona_id = p_origen;
  update public.fortius_inmuebles_consultas set persona_id = p_destino where persona_id = p_origen;
  update public.fortius_inmuebles_presupuestos set paga_persona_id = p_destino where paga_persona_id = p_origen;
  update public.fortius_inmuebles_presupuesto_conceptos set paga_persona_id = p_destino where paga_persona_id = p_origen;
  update public.fortius_inmuebles_cobros set paga_persona_id = p_destino where paga_persona_id = p_origen;
  update public.fortius_inmuebles_interesados i set deleted_at = now()
   where i.persona_id = p_origen and i.deleted_at is null and exists (
     select 1 from public.fortius_inmuebles_interesados x where x.persona_id = p_destino and x.asunto_id = i.asunto_id and x.deleted_at is null);
  update public.fortius_inmuebles_interesados set persona_id = p_destino where persona_id = p_origen;
  update public.fortius_inmuebles_trabajos set persona_id = p_destino where persona_id = p_origen;
  update public.fortius_inmuebles_personas set representante_id = p_destino where representante_id = p_origen;

  -- Datos para contratos: se completan los huecos de la que se queda.
  insert into public.fortius_inmuebles_persona_datos_legales as l
    (persona_id, nombre_completo, estado_civil, curp, rfc, identificacion_tipo, identificacion_numero, domicilio, nacionalidad, ocupacion, creado_por)
  select p_destino, nombre_completo, estado_civil, curp, rfc, identificacion_tipo, identificacion_numero, domicilio, nacionalidad, ocupacion, auth.uid()
    from public.fortius_inmuebles_persona_datos_legales where persona_id = p_origen
  on conflict (persona_id) do update set
    nombre_completo = coalesce(l.nombre_completo, excluded.nombre_completo), estado_civil = coalesce(l.estado_civil, excluded.estado_civil),
    curp = coalesce(l.curp, excluded.curp), rfc = coalesce(l.rfc, excluded.rfc),
    identificacion_tipo = coalesce(l.identificacion_tipo, excluded.identificacion_tipo), identificacion_numero = coalesce(l.identificacion_numero, excluded.identificacion_numero),
    domicilio = coalesce(l.domicilio, excluded.domicilio), nacionalidad = coalesce(l.nacionalidad, excluded.nacionalidad), ocupacion = coalesce(l.ocupacion, excluded.ocupacion),
    version = l.version;

  -- La ficha que se queda junta teléfonos, correo y nota; «no contactar» se respeta si cualquiera lo pidió.
  update public.fortius_inmuebles_personas set
    telefonos = (select coalesce(jsonb_agg(t), '[]') from (select distinct on (regexp_replace(coalesce(t->>'pais', '') || (t->>'numero'), '\D', '', 'g')) t
                   from jsonb_array_elements(d.telefonos || o.telefonos) t) x where true),
    correo = coalesce(d.correo, o.correo),
    no_contactar = d.no_contactar or o.no_contactar,
    fallecida = d.fallecida or o.fallecida,
    nota = left(btrim(d.nota || case when o.nota <> '' and d.nota <> o.nota then E'\n' || o.nota else '' end), 2000),
    volver_a_llamar = coalesce(d.volver_a_llamar, o.volver_a_llamar),
    version = d.version
   where id = p_destino;

  update public.fortius_inmuebles_personas set deleted_at = now(), deleted_by = auth.uid(), version = o.version where id = p_origen;
  insert into public.fortius_inmuebles_persona_uniones (origen_id, destino_id, detalle)
    values (p_origen, p_destino, jsonb_build_object('nombre', o.nombre));
end; $$;
revoke all on function public.fortius_inmuebles_unir_personas(uuid, uuid) from public, anon;
grant execute on function public.fortius_inmuebles_unir_personas(uuid, uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
