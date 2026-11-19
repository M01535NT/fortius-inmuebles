-- Panel · etapa 12, paso 1: las funciones de la base dejan de traer copias de las listas
-- (20261118200000_panel_14_catalogos.sql). Mismas funciones que en 20261118100000_arregla_pendientes_revision.sql, con
-- solo estos cambios:
--  · Abrir el asunto desde la consulta: el papel de quien llama, los encargos y el tipo del inmueble se revisan contra
--    sus catálogos (antes, una lista de once papeles escrita aquí); lo que ya traía la consulta se conserva aunque se
--    haya desactivado. La nota del historial y cómo prefiere que le contacten quedan igual que antes.
--  · Documentos de la consulta: cada archivo cargado dice a qué documento de la lista pertenece; al abrir el asunto, lo
--    recibido (marcado o con archivo) entra como recibido con su archivo, lo demás como falta y lo suelto como antes.
--  · Guardar como contacto: igual que antes (se vuelve a escribir para que todo quede en un solo lugar).
--  · El primer plan: quién hace cada tarea se revisa contra el catálogo «Quién hace una tarea»; si no se ofrece, Fortius.
--  · Nuevas: unir fichas y continuar un asunto conservando los papeles y encargos del original, y copiar el plan de una
--    guía de la Biblioteca todo junto (antes podía quedar a medias).
--  · Lo que sale en el sitio: cada tipo de inmueble sale como dice su catálogo («Sale en el sitio como»), en lugar de la
--    traducción escrita aquí. Un tipo nuevo sale como una de las siete clases que el sitio conoce.
-- Sigue escrito aquí, porque no es catálogo: el orden de los apartados.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── Documentos de la consulta: una sola lista que se marca al recibir (SPEC.md, sección 4) ──────────────────────
-- Cada archivo que se carga en la consulta dice a qué documento de la lista pertenece (su nombre exacto); vacío es un
-- archivo suelto. Quien atiende la consulta lo cambia con su sesión (RLS de siempre).
alter table public.fortius_inmuebles_cargas_por_acomodar add column if not exists documento text
  check (documento is null or char_length(documento) between 1 and 200);
grant update (documento) on public.fortius_inmuebles_cargas_por_acomodar to authenticated;

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

  -- Quien llama: la ficha elegida, si quien abre el asunto la puede ver; si no (una ficha de otro asesor), una nueva
  -- con lo que se anotó en la consulta. Nunca se cuelga una ficha ajena del asunto ni se frena por eso.
  if c.persona_id is not null and public.fortius_inmuebles_puede_ver_persona(c.persona_id) then
    persona := c.persona_id;
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
  if c.persona_id is not null and public.fortius_inmuebles_puede_ver_persona(c.persona_id) then
    persona := c.persona_id;
    update public.fortius_inmuebles_personas set volver_a_llamar = p_volver,
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

create or replace function public.fortius_inmuebles_inmuebles_publicos() returns setof jsonb
language plpgsql stable security definer set search_path = '' as $$
declare i record; result jsonb; galeria jsonb; num jsonb; estado text;
begin
  for i in select x.*, c.slug as slug_conjunto, c.publicado as conjunto_publicado, c.deleted_at as conjunto_borrado
             from public.fortius_inmuebles_inmuebles x
             left join public.fortius_inmuebles_inmuebles c on c.id = x.conjunto_id
            where x.publicado and x.deleted_at is null and x.operacion is not null and x.tipo is not null
              and x.estado <> 'retirado'
            order by x.publicado_el desc nulls last, x.id loop
    select coalesce(jsonb_agg(jsonb_build_object('src', m.url, 'alt', coalesce(nullif(btrim(m.alt), ''), i.nombre))
                              order by (m.id = i.portada_id) desc, m.orden, m.created_at), '[]'::jsonb)
      into galeria
      from public.fortius_inmuebles_inmueble_medios m
     where m.inmueble_id = i.id and m.tipo = 'foto' and m.retirado_el is null and public.fortius_inmuebles_public_url(m.url);
    if jsonb_array_length(galeria) = 0 then continue; end if;
    estado := case i.estado when 'libre' then 'disponible' when 'apartado' then 'apartada'
                            when 'vendido' then 'vendida' when 'rentado' then 'rentada' end;
    num := (select coalesce(jsonb_object_agg(k.publico, i.ficha -> k.panel), '{}'::jsonb)
              from (values ('terreno', 'terrenoM2'), ('construccion', 'construccionM2'), ('recamaras', 'recamaras'),
                           ('banos', 'banos'), ('estac', 'estacionamientos')) k(panel, publico)
             where jsonb_typeof(i.ficha -> k.panel) = 'number' and (i.ficha ->> k.panel)::numeric between 0 and 1e9);
    if jsonb_typeof(i.ficha -> 'anio') = 'number' and (i.ficha ->> 'anio')::int between 1900 and 2100 then
      num := num || jsonb_build_object('antiguedad', 'Construida en ' || (i.ficha ->> 'anio'));
    end if;
    result := jsonb_build_object(
      'slug', coalesce(i.slug, lower(i.folio)),
      'codigo', i.folio,
      'titulo', i.nombre,
      'tipo', coalesce(public.fortius_inmuebles_catalogo_significado('tipo_inmueble', i.tipo), i.tipo),
      'operacion', i.operacion,
      'zona', coalesce(i.colonia, ''),
      'municipio', coalesce(i.ciudad, ''),
      'direccionAproximada', case when i.mostrar_direccion and length(btrim(coalesce(i.direccion_exacta, ''))) between 3 and 200
                                  then btrim(i.direccion_exacta)
                                  else concat_ws(', ', nullif(btrim(coalesce(i.colonia, '')), ''), i.ciudad) end,
      'descripcion', (select coalesce(jsonb_agg(btrim(p) order by n), '[]'::jsonb)
                        from regexp_split_to_table(i.descripcion, '\n\s*\n') with ordinality s(p, n)
                       where length(btrim(p)) > 0 and n <= 100),
      'amenidades', '[]'::jsonb,
      'asesorId', '',
      'creditoDisponible', false,
      'destacada', false,
      'estado', estado,
      'publicadaEl', coalesce(to_char(i.publicado_el at time zone 'America/Tijuana', 'YYYY-MM-DD'), ''),
      'demo', i.es_ejemplo,
      'publicada', true,
      'precio', case when i.precio is null or i.precio = 0 then jsonb_build_object('modalidad', 'consulta')
                     else jsonb_build_object('modalidad', 'publico', 'monto', i.precio, 'moneda', i.moneda)
                          || case when i.operacion = 'renta' then jsonb_build_object('periodo', 'mensual') else '{}'::jsonb end end,
      'ficha', num,
      'galeria', galeria,
      'puntosDeInteres', '[]'::jsonb,
      'documentos', '[]'::jsonb);
    if i.conjunto_id is not null and i.conjunto_publicado and i.conjunto_borrado is null and i.slug_conjunto is not null then
      result := result || jsonb_build_object('conjunto', i.slug_conjunto);
    end if;
    -- Un compartido sale como colaboración aunque no tenga anotado el nombre de la inmobiliaria (el sitio no lo muestra).
    if i.compartido then
      result := result || jsonb_build_object('colaboracion', true);
    end if;
    -- Video y recorrido son opcionales: si no hay, el inmueble sale igual, sin ellos.
    result := result || coalesce((
      select jsonb_build_object('videoUrl', m.url)
        from public.fortius_inmuebles_inmueble_medios m
       where m.inmueble_id = i.id and m.tipo = 'video' and m.retirado_el is null and public.fortius_inmuebles_public_url(m.url)
       order by m.orden, m.created_at limit 1), '{}'::jsonb);
    result := result || coalesce((
      select jsonb_build_object('tour360Url', m.url)
        from public.fortius_inmuebles_inmueble_medios m
       where m.inmueble_id = i.id and m.tipo = 'recorrido_360' and m.path is null and m.retirado_el is null
         and public.fortius_inmuebles_public_url(m.url)
       order by m.orden, m.created_at limit 1), '{}'::jsonb);
    return next result;
  end loop;
end; $$;

-- ── Copias que conservan lo que traía el original ────────────────────────────────────────────────────
-- Desactivar no borra: lo que una copia trae de su original se conserva aunque ya no se ofrezca. Estas funciones lo
-- avisan con una marca que dura solo esta operación (fortius_inmuebles.conserva_catalogos), y luego hacen lo de siempre.

-- Unir fichas: los papeles de la ficha que se va pasan tal cual a la que se queda.
create function public.fortius_inmuebles_unir_personas_conservando(p_origen uuid, p_destino uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  perform set_config('fortius_inmuebles.conserva_catalogos', 'on', true);
  perform public.fortius_inmuebles_unir_personas(p_origen, p_destino);
end; $$;
revoke all on function public.fortius_inmuebles_unir_personas_conservando(uuid, uuid) from public, anon;
grant execute on function public.fortius_inmuebles_unir_personas_conservando(uuid, uuid) to authenticated, service_role;

-- Continuar un asunto: las personas con su papel y los encargos del original pasan tal cual. Un encargo que se elija de
-- nuevo tiene que ofrecerse.
create function public.fortius_inmuebles_continuar_asunto_conservando(p_asunto uuid, p_nombre text, p_encargos text[])
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare previos text[];
begin
  select encargos into previos from public.fortius_inmuebles_asuntos where id = p_asunto and deleted_at is null;
  if exists (select 1 from unnest(coalesce(p_encargos, '{}')) e
              where not public.fortius_inmuebles_catalogo_acepta('encargo', e) and not e = any(coalesce(previos, '{}'))) then
    raise sqlstate '22023' using message = 'Uno de los encargos ya no se ofrece';
  end if;
  perform set_config('fortius_inmuebles.conserva_catalogos', 'on', true);
  return public.fortius_inmuebles_continuar_asunto(p_asunto, p_nombre, p_encargos);
end; $$;
revoke all on function public.fortius_inmuebles_continuar_asunto_conservando(uuid, text, text[]) from public, anon;
grant execute on function public.fortius_inmuebles_continuar_asunto_conservando(uuid, text, text[]) to authenticated, service_role;

-- Copiar el plan de una guía de la Biblioteca a un asunto: sus etapas y sus tareas, todo o nada, y la nota del historial.
-- Quién hace cada tarea es el de la guía. Devuelve cuántas tareas agregó. Con la sesión de quien copia (RLS).
create function public.fortius_inmuebles_copiar_plan_de_guia(p_guia uuid, p_asunto uuid) returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  g record;
  e jsonb;
  t jsonb;
  etapa uuid;
  orden_etapa numeric;
  orden_tarea numeric;
  n integer := 0;
begin
  if not public.fortius_inmuebles_puede_ver_asunto(p_asunto) then
    raise sqlstate 'PT403' using message = 'Sin acceso a ese asunto';
  end if;
  select id, nombre, version, contenido into g from public.fortius_inmuebles_biblioteca
   where id = p_guia and clase = 'que_hacer' and deleted_at is null;
  if not found then
    raise sqlstate '22023' using message = 'Esa guía ya no está en la Biblioteca';
  end if;
  perform set_config('fortius_inmuebles.conserva_catalogos', 'on', true);
  orden_etapa := coalesce((select max(orden) from public.fortius_inmuebles_plan_etapas where asunto_id = p_asunto and deleted_at is null), 0) + 10;
  orden_tarea := coalesce((select max(orden) from public.fortius_inmuebles_tareas where asunto_id = p_asunto and deleted_at is null), 0) + 10;
  for e in select * from jsonb_array_elements(case when jsonb_typeof(g.contenido -> 'etapas') = 'array' then g.contenido -> 'etapas' else '[]'::jsonb end) loop
    insert into public.fortius_inmuebles_plan_etapas (asunto_id, nombre, orden, biblioteca_id, biblioteca_version, creado_por)
    values (p_asunto, coalesce(nullif(left(btrim(e ->> 'nombre'), 120), ''), 'Etapa'), orden_etapa, g.id, g.version, auth.uid())
    returning id into etapa;
    orden_etapa := orden_etapa + 10;
    for t in select * from jsonb_array_elements(case when jsonb_typeof(e -> 'tareas') = 'array' then e -> 'tareas' else '[]'::jsonb end) loop
      continue when coalesce(btrim(t ->> 'titulo'), '') = '';
      insert into public.fortius_inmuebles_tareas (asunto_id, etapa_id, titulo, quien, fecha, responsable_id, orden, creado_por)
      values (p_asunto, etapa, left(btrim(t ->> 'titulo'), 300), coalesce(nullif(t ->> 'quien', ''), 'fortius'),
              case when jsonb_typeof(t -> 'dias') = 'number' then public.fortius_inmuebles_hoy() + least(greatest((t ->> 'dias')::integer, 0), 3650) end,
              auth.uid(), orden_tarea, auth.uid());
      orden_tarea := orden_tarea + 10;
      n := n + 1;
    end loop;
  end loop;
  if n > 0 then
    perform public.fortius_inmuebles_anotar_historial('asunto', p_asunto::text, p_asunto, 'nota', 'De la Biblioteca: ' || g.nombre);
  end if;
  return n;
end; $$;
revoke all on function public.fortius_inmuebles_copiar_plan_de_guia(uuid, uuid) from public, anon;
grant execute on function public.fortius_inmuebles_copiar_plan_de_guia(uuid, uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
