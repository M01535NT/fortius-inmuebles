-- Panel · etapa 12, paso 1: las funciones de la base dejan de traer copias de las listas
-- (20261118200000_panel_14_catalogos.sql). Mismas funciones que en 20261118100000_arregla_pendientes_revision.sql, con
-- solo estos cambios:
--  · Abrir el asunto desde la consulta: el papel de quien llama se revisa contra el catálogo de papeles (antes, una lista
--    de once escrita aquí), y el nombre de por dónde llegó sale del catálogo de fuentes. La nota del historial queda
--    «Nació de una consulta (WhatsApp).».
--  · Guardar como contacto: el nombre de por dónde llegó sale del catálogo de fuentes.
--  · El primer plan: quién hace cada tarea se revisa contra el catálogo «Quién hace una tarea»; si no se ofrece, Fortius.
--  · Lo que sale en el sitio: cada tipo de inmueble sale como dice su catálogo («Sale en el sitio como»), en lugar de la
--    traducción escrita aquí. Un tipo nuevo sale como una de las siete clases que el sitio conoce.
-- Sigue escrito aquí, porque no es catálogo: el orden de los apartados.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

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
  if not public.fortius_inmuebles_catalogo_acepta('papel', p_papel) then
    raise sqlstate '22023' using message = 'Ese papel no está en la lista de papeles';
  end if;
  if jsonb_typeof(coalesce(p_plan, '[]')) <> 'array' then
    raise sqlstate '22023' using message = 'Plan no válido';
  end if;

  -- Quien llama: la ficha elegida, si quien abre el asunto la puede ver; si no (una ficha de otro asesor), una nueva
  -- con lo que se anotó en la consulta. Nunca se cuelga una ficha ajena del asunto ni se frena por eso.
  if c.persona_id is not null and public.fortius_inmuebles_puede_ver_persona(c.persona_id) then
    persona := c.persona_id;
  else
    canal_texto := public.fortius_inmuebles_catalogo_etiqueta('fuente', c.canal);
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

  -- Lo que hay que pedirle (sin lo que se quitó).
  i := 0;
  for x in select * from jsonb_array_elements(c.documentos_pedir) loop
    if coalesce((x->>'quitado')::boolean, false) or coalesce(btrim(x->>'nombre'), '') = '' then continue; end if;
    i := i + 1;
    insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, grupo, entrega_papel, inmueble_id, origen, orden, creado_por)
    values (asunto, left(btrim(x->>'nombre'), 200), nullif(x->>'grupo', ''), coalesce(nullif(x->>'entrega_papel', ''), 'cliente'),
            case when x->>'grupo' = 'inmueble' then inmueble end, 'consulta', i, auth.uid());
  end loop;

  -- Lo que ya mandó: cada archivo cae en su documento, como recibido.
  for carga in select * from public.fortius_inmuebles_cargas_por_acomodar
                where consulta_id = c.id and estado = 'por_acomodar' order by created_at loop
    i := i + 1;
    insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, estado, entrega_papel, origen, orden, creado_por)
    values (asunto, left(regexp_replace(carga.nombre_original, '\.[A-Za-z0-9]{1,5}$', ''), 200), 'recibido', 'cliente', 'consulta', i, auth.uid())
    returning id into doc;
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
          left('Nació de una consulta (' || public.fortius_inmuebles_catalogo_etiqueta('fuente', c.canal) || ').'
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
            public.fortius_inmuebles_catalogo_etiqueta('fuente', c.canal),
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

notify pgrst, 'reload schema';
commit;
