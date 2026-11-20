-- Panel · dos pendientes de la revisión de solo lectura del 19/11 (PLAN.md, etapa A):
--  1. Mandar a Eliminados o recuperar una guía de la Biblioteca o un documento suelto de Herramientas queda en el
--     historial, con quién y cuándo (los de un asunto ya quedaban en el historial de su asunto).
--  2. «Guardar como contacto» desde una consulta solo toca la ficha ya ligada si quien guarda la puede ver y la ficha no
--     está en Eliminados; si no, crea una ficha nueva con lo anotado, como ya hacía. Si estaba archivada, vuelve a la
--     lista. La función es la misma que en 20261118200200_panel_16_funciones_leen_catalogos.sql con solo ese cambio.
--  3. Abrir el asunto desde la consulta tampoco cuelga del asunto una ficha que está en Eliminados: crea una nueva con
--     lo anotado, como ya hacía con la de otro asesor. Si la ficha estaba archivada, vuelve a la lista. Misma función
--     que en la 16 con solo ese cambio.
--  4. La revisión de las listas (20261118200100_panel_15_columnas_leen_catalogos.sql) corre como dueña de la base: así
--     puede preguntar si una copia conserva un valor apagado (la siguiente vez de una tarea que se repite, un punto de la
--     opinión que pasa al plan, copiar el plan de una guía) sin abrirle esa pregunta a nadie. Antes, con la sesión del
--     equipo, esa pregunta respondía «permiso denegado» y guardar fallaba.
--  5. Una consulta del sitio abre a lo más una consulta nueva a la vez: dos clics en «Persona y asunto» dan la misma.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── 1. Eliminados deja huella ─────────────────────────────────────────────────────────────────────────
drop trigger if exists fortius_zz_historial on public.fortius_inmuebles_biblioteca;
create trigger fortius_zz_historial after update of deleted_at on public.fortius_inmuebles_biblioteca
  for each row when (old.deleted_at is distinct from new.deleted_at)
  execute function public.fortius_inmuebles_registrar_cambio('guia', 'nombre');

-- El de un asunto ya tiene el suyo (fortius_zz_historial, en el historial del asunto); este es el suelto.
drop trigger if exists fortius_zz_historial_suelto on public.fortius_inmuebles_trabajos;
create trigger fortius_zz_historial_suelto after update of deleted_at on public.fortius_inmuebles_trabajos
  for each row when (new.asunto_id is null and old.deleted_at is distinct from new.deleted_at)
  execute function public.fortius_inmuebles_registrar_cambio('trabajo', 'nombre,resultado');

-- ── 2. Guardar como contacto ──────────────────────────────────────────────────────────────────────────
create or replace function public.fortius_inmuebles_consulta_a_contacto(p_consulta uuid, p_version bigint, p_volver date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare c public.fortius_inmuebles_consultas; persona uuid;
begin
  if not public.fortius_inmuebles_is_staff() then
    raise sqlstate 'PT403' using message = 'Sin acceso';
  end if;
  select * into c from public.fortius_inmuebles_consultas where id = p_consulta for update;
  if not found or not public.fortius_inmuebles_puede_ver_consulta(p_consulta) then
    raise sqlstate 'PT403' using message = 'Sin acceso a esa consulta';
  end if;
  if c.version <> p_version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió esta consulta';
  end if;
  if c.estado = 'asunto' then
    raise sqlstate '22023' using message = 'Esta consulta ya abrió su asunto';
  end if;
  -- La ficha ligada solo se toca si sigue viva y quien guarda la ve (la regla de visibilidad por asunto no mira si la
  -- ficha está en Eliminados). Se bloquea para que nadie la cambie a la vez.
  if c.persona_id is not null then
    perform 1 from public.fortius_inmuebles_personas p where p.id = c.persona_id for update;
  end if;
  if c.persona_id is not null
     and exists (select 1 from public.fortius_inmuebles_personas p where p.id = c.persona_id and p.deleted_at is null)
     and public.fortius_inmuebles_puede_ver_persona(c.persona_id) then
    persona := c.persona_id;
    update public.fortius_inmuebles_personas set volver_a_llamar = p_volver, archivada_el = null,
           nota = left(case when nota = '' then '' else nota || E'\n' end || coalesce(nullif(btrim(c.que_pasa), ''), ''), 2000)
     where id = persona;
  else
    insert into public.fortius_inmuebles_personas (nombre, telefonos, correo, canal, volver_a_llamar, nota, responsable_id, es_ejemplo, creado_por)
    values (coalesce(nullif(btrim(c.quien_nombre), ''), 'Sin nombre'), c.quien_telefonos, nullif(btrim(coalesce(c.quien_correo, '')), ''),
            case c.canal when 'llamada' then 'Llamada' when 'whatsapp' then 'WhatsApp' when 'en_persona' then 'En persona' when 'sitio' then 'Sitio' else 'Otro' end,
            p_volver, left(c.que_pasa, 2000), c.responsable_id, c.es_ejemplo, auth.uid())
    returning id into persona;
  end if;
  update public.fortius_inmuebles_consultas set estado = 'contacto', persona_id = persona where id = c.id;
  return persona;
end; $$;
revoke all on function public.fortius_inmuebles_consulta_a_contacto(uuid, bigint, date) from public, anon;
grant execute on function public.fortius_inmuebles_consulta_a_contacto(uuid, bigint, date) to authenticated, service_role;

-- ── 3. Abrir el asunto desde la consulta ──────────────────────────────────────────────────────────────
create or replace function public.fortius_inmuebles_abrir_asunto_desde_consulta(
  p_consulta uuid, p_version bigint, p_nombre text, p_encargos text[], p_apartados text[],
  p_papel text, p_inmueble jsonb, p_plan jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.fortius_inmuebles_consultas;
  persona uuid;
  asunto uuid;
  v_folio text;
  inm jsonb;
  inmueble uuid;
  x jsonb;
  t jsonb;
  etapa uuid;
  doc uuid;
  carga record;
  otra uuid;
  i integer := 0;
  j integer;
  canal_texto text;
  docs_lista jsonb := '{}';
begin
  if not public.fortius_inmuebles_is_staff() then
    raise sqlstate 'PT403' using message = 'Sin acceso';
  end if;
  select * into c from public.fortius_inmuebles_consultas where id = p_consulta for update;
  if not found or not public.fortius_inmuebles_puede_ver_consulta(p_consulta) then
    raise sqlstate 'PT403' using message = 'Sin acceso a esa consulta';
  end if;
  if c.version <> p_version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió esta consulta';
  end if;
  if c.estado = 'asunto' then
    raise sqlstate '22023' using message = 'Esta consulta ya abrió su asunto';
  end if;
  -- Lo que elige quien abre (el papel de quien llama, los encargos, el tipo del inmueble) tiene que ofrecerse. El papel
  -- puede ser cualquiera que se ofrezca; el panel elige entre Propietario, Comprador y Contacto.
  if not public.fortius_inmuebles_catalogo_acepta('papel', p_papel) then
    raise sqlstate '22023' using message = 'Ese papel no está en la lista de papeles';
  end if;
  if exists (select 1 from unnest(coalesce(p_encargos, '{}')) e where not public.fortius_inmuebles_catalogo_acepta('encargo', e)) then
    raise sqlstate '22023' using message = 'Uno de los encargos ya no se ofrece';
  end if;
  -- El tipo del inmueble: uno que se ofrezca, o el que ya traía la consulta (desactivar no borra).
  if nullif(p_inmueble ->> 'tipo', '') is not null
     and not public.fortius_inmuebles_catalogo_acepta('tipo_inmueble', p_inmueble ->> 'tipo')
     and p_inmueble ->> 'tipo' is distinct from c.datos ->> 'tipo' then
    raise sqlstate '22023' using message = 'Ese tipo de inmueble ya no se ofrece';
  end if;
  if jsonb_typeof(coalesce(p_plan, '[]')) <> 'array' then
    raise sqlstate '22023' using message = 'Plan no válido';
  end if;
  -- De aquí en adelante se copia lo que ya traía la consulta (las otras personas con su papel, el tipo del inmueble):
  -- se conserva aunque se haya desactivado después de capturarlo. Quién hace cada tarea del plan se revisa abajo.
  perform set_config('fortius_inmuebles.conserva_catalogos', 'on', true);

  -- Quien llama: la ficha elegida, si sigue viva y quien abre el asunto la puede ver (la regla de visibilidad por asunto
  -- no mira si la ficha está en Eliminados); si no, una nueva con lo que se anotó en la consulta. Nunca se cuelga del
  -- asunto una ficha ajena o eliminada, ni se frena por eso. Se bloquea para que nadie la cambie a la vez.
  if c.persona_id is not null then
    perform 1 from public.fortius_inmuebles_personas p where p.id = c.persona_id for update;
  end if;
  if c.persona_id is not null
     and exists (select 1 from public.fortius_inmuebles_personas p where p.id = c.persona_id and p.deleted_at is null)
     and public.fortius_inmuebles_puede_ver_persona(c.persona_id) then
    persona := c.persona_id;
    update public.fortius_inmuebles_personas set archivada_el = null where id = persona and archivada_el is not null;
  else
    -- Cómo prefiere que le contacten (otra lista, la de la ficha de la persona): igual que antes.
    canal_texto := case c.canal when 'llamada' then 'Llamada' when 'whatsapp' then 'WhatsApp' when 'en_persona' then 'En persona'
                                when 'sitio' then 'Sitio' else 'Otro' end;
    insert into public.fortius_inmuebles_personas (nombre, telefonos, correo, canal, responsable_id, es_ejemplo, creado_por)
    values (coalesce(nullif(btrim(c.quien_nombre), ''), 'Sin nombre'), c.quien_telefonos, nullif(btrim(coalesce(c.quien_correo, '')), ''),
            canal_texto, c.responsable_id, c.es_ejemplo, auth.uid())
    returning id into persona;
  end if;

  insert into public.fortius_inmuebles_asuntos (nombre, encargos, responsable_id, consulta_id, situacion, es_ejemplo, creado_por)
  values (left(coalesce(nullif(btrim(p_nombre), ''), 'Asunto sin nombre'), 160), coalesce(p_encargos, '{}'), c.responsable_id,
          c.id, c.que_pasa, c.es_ejemplo, auth.uid())
  returning id, folio into asunto, v_folio;

  insert into public.fortius_inmuebles_apartados (asunto_id, clave, orden, creado_por)
  select asunto, k, case k when 'inmueble' then 20 when 'interesados' then 30 when 'situacion' then 40 when 'documentos' then 50
                           when 'opinion' then 60 when 'honorarios' then 70 else 75 end, auth.uid()
    from unnest(coalesce(p_apartados, '{}')) k
   where k in ('inmueble', 'interesados', 'situacion', 'documentos', 'opinion', 'honorarios')
  on conflict do nothing;

  insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, principal, orden, creado_por)
  values (asunto, persona, p_papel, true, 0, auth.uid());

  -- Las otras personas del caso, cada una con su ficha y su papel.
  for x in select * from jsonb_array_elements(c.otras_personas) loop
    i := i + 1;
    if coalesce(btrim(x->>'nombre'), '') = '' then continue; end if;
    insert into public.fortius_inmuebles_personas (nombre, fallecida, telefonos, responsable_id, es_ejemplo, creado_por)
    values (left(btrim(x->>'nombre'), 160), coalesce((x->>'fallecida')::boolean, false),
            case when coalesce(x->>'numero', '') <> '' and not coalesce((x->>'fallecida')::boolean, false)
                 then jsonb_build_array(jsonb_build_object('pais', coalesce(nullif(x->>'pais', ''), '+52'), 'numero', x->>'numero'))
                 else '[]'::jsonb end,
            c.responsable_id, c.es_ejemplo, auth.uid())
    returning id into otra;
    insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, orden, creado_por)
    values (asunto, otra, coalesce(nullif(x->>'papel', ''), 'contacto'), i, auth.uid())
    on conflict do nothing;
  end loop;

  -- El inmueble, si se describió.
  if p_inmueble is not null and jsonb_typeof(p_inmueble) = 'object' then
    inm := public.fortius_inmuebles_crear_inmueble(asunto, p_inmueble);
    inmueble := (inm->>'id')::uuid;
  end if;

  -- La lista de documentos (sin lo que se quitó). Entra como recibido lo que se marcó recibido o tiene un archivo
  -- ligado; lo demás, como falta. Una consulta guardada antes, sin marcas ni archivos ligados, entra igual que antes.
  i := 0;
  for x in select * from jsonb_array_elements(c.documentos_pedir) loop
    if coalesce((x->>'quitado')::boolean, false) or coalesce(btrim(x->>'nombre'), '') = '' then continue; end if;
    i := i + 1;
    insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, grupo, estado, entrega_papel, inmueble_id, origen, orden, creado_por)
    values (asunto, left(btrim(x->>'nombre'), 200), nullif(x->>'grupo', ''),
            case when coalesce((x->>'recibido')::boolean, false)
                   or exists (select 1 from public.fortius_inmuebles_cargas_por_acomodar k
                               where k.consulta_id = c.id and k.estado = 'por_acomodar' and k.documento = btrim(x->>'nombre'))
                 then 'recibido' else 'falta' end,
            coalesce(nullif(x->>'entrega_papel', ''), 'cliente'),
            case when x->>'grupo' = 'inmueble' then inmueble end, 'consulta', i, auth.uid())
    returning id into doc;
    docs_lista := docs_lista || jsonb_build_object(left(btrim(x->>'nombre'), 200), doc);
  end loop;

  -- Los archivos: el ligado a un documento de la lista cae en ese documento; el suelto (o ligado a uno que se quitó)
  -- crea su propio documento, como recibido, igual que antes.
  for carga in select * from public.fortius_inmuebles_cargas_por_acomodar
                where consulta_id = c.id and estado = 'por_acomodar' order by created_at loop
    if carga.documento is not null and docs_lista ? carga.documento then
      doc := (docs_lista ->> carga.documento)::uuid;
    else
      i := i + 1;
      insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, estado, entrega_papel, origen, orden, creado_por)
      values (asunto, left(regexp_replace(carga.nombre_original, '\.[A-Za-z0-9]{1,5}$', ''), 200), 'recibido', 'cliente', 'consulta', i, auth.uid())
      returning id into doc;
    end if;
    insert into public.fortius_inmuebles_documento_archivos (documento_id, asunto_id, path, nombre_original, mime, byte_length, sha256, subido_por)
    values (doc, asunto, carga.path, carga.nombre_original, carga.mime, carga.byte_length, carga.sha256, carga.usuario_id);
    update public.fortius_inmuebles_cargas_por_acomodar
       set estado = 'acomodado', documento_id = doc, asunto_id = asunto, updated_at = now()
     where id = carga.id;
  end loop;

  -- El primer plan.
  i := 0;
  for x in select * from jsonb_array_elements(coalesce(p_plan, '[]')) loop
    i := i + 1;
    insert into public.fortius_inmuebles_plan_etapas (asunto_id, nombre, orden, creado_por)
    values (asunto, left(coalesce(nullif(btrim(x->>'nombre'), ''), 'Pendientes'), 120), i, auth.uid())
    returning id into etapa;
    j := 0;
    for t in select * from jsonb_array_elements(coalesce(x->'tareas', '[]')) loop
      j := j + 1;
      if coalesce(btrim(t->>'titulo'), '') = '' then continue; end if;
      insert into public.fortius_inmuebles_tareas (asunto_id, etapa_id, titulo, quien, responsable_id, fecha, origen, orden, creado_por)
      values (asunto, etapa, left(btrim(t->>'titulo'), 300),
              case when public.fortius_inmuebles_catalogo_acepta('quien_tarea', t->>'quien') then t->>'quien' else 'fortius' end,
              c.responsable_id,
              case when t ? 'dias' and jsonb_typeof(t->'dias') = 'number' then public.fortius_inmuebles_hoy() + least(greatest((t->>'dias')::integer, 0), 365) end,
              'consulta', j, auth.uid());
    end loop;
  end loop;

  update public.fortius_inmuebles_consultas set estado = 'asunto', asunto_id = asunto, persona_id = persona where id = c.id;

  insert into public.fortius_inmuebles_historial (entidad, entidad_id, asunto_id, clase, resumen, actor_id, actor_tipo)
  values ('asunto', asunto::text, asunto, 'nota',
          left('Nació de una consulta' || case c.canal when 'llamada' then ' por llamada' when 'whatsapp' then ' por WhatsApp'
               when 'en_persona' then ' en persona' when 'sitio' then ' del sitio' else '' end || '.'
               || coalesce(' ' || nullif(btrim(c.que_pasa), ''), ''), 2000),
          auth.uid(), 'usuario');

  return jsonb_build_object('id', asunto, 'folio', v_folio, 'persona_id', persona, 'inmueble_id', inmueble);
end; $$;
revoke all on function public.fortius_inmuebles_abrir_asunto_desde_consulta(uuid, bigint, text, text[], text[], text, jsonb, jsonb) from public, anon;
grant execute on function public.fortius_inmuebles_abrir_asunto_desde_consulta(uuid, bigint, text, text[], text[], text, jsonb, jsonb) to authenticated, service_role;

-- ── 4. La revisión de las listas corre como dueña ─────────────────────────────────────────────────────
-- Solo lee las listas y las filas de origen de una copia, y responde sí o no; nadie la llama directo (es de disparador).
-- La pregunta de si una copia conserva el valor sigue cerrada a todos: solo estas dos revisiones la hacen.
alter function public.fortius_inmuebles_valida_catalogos() security definer;
alter function public.fortius_inmuebles_valida_consulta_catalogos() security definer;
revoke all on function public.fortius_inmuebles_valida_catalogos() from public, anon, authenticated, service_role;
revoke all on function public.fortius_inmuebles_valida_consulta_catalogos() from public, anon, authenticated, service_role;

-- ── 5. Una consulta nueva por consulta del sitio ──────────────────────────────────────────────────────
-- La consulta nueva recuerda de qué consulta del sitio salió. Solo puede haber una abierta por cada una; cerrada (guardada
-- como contacto, sin proceder o con su asunto), se puede abrir otra.
alter table public.fortius_inmuebles_consultas add column if not exists desde_lead text
  check (desde_lead is null or desde_lead ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$');
create unique index if not exists fortius_inmuebles_consultas_una_abierta_por_lead
  on public.fortius_inmuebles_consultas (desde_lead)
  where desde_lead is not null and estado = 'abierta' and deleted_at is null;

notify pgrst, 'reload schema';
commit;
