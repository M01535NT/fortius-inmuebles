-- Arreglos que dejó la revisión del panel nuevo (18/11/2026).
--
-- 1. Solicitud del sitio con la ficha de otro asesor: la base buscaba a la persona por teléfono o correo entre todas
--    las fichas y la ligaba aunque fuera de otro asesor; quien recibía la solicitud no la veía («Sin nombre»), «Abrir
--    asunto» fallaba y «Guardar como contacto» escribía en la ficha ajena. Ahora solo se reutiliza una ficha que el
--    responsable de la solicitud puede ver; si no hay, nace una a su nombre. La consulta no acepta una ficha que quien
--    la atiende no ve, y «Abrir asunto» y «Guardar como contacto» usan una ficha nueva en lugar de tocar la ajena.
-- 2. Un interesado descartado que regresa por el sitio se reabre en el panel provisional y ahora también llega como
--    solicitud nueva al panel nuevo (cada regreso es una vuelta más de la misma solicitud del sitio).
-- 3. Las fechas de negocio se toman con el día de Tijuana, no con el de UTC: ofertas y cobros anotados en la tarde,
--    tareas del primer plan, «volver a preguntar», vigencia y seguimiento del presupuesto.
-- 4. Cambiar a quién le toca una tarea: solo quien lleva el asunto o el director (antes la base lo cuidaba solo al crearla).
-- 5. Recibos: el número es consecutivo por asunto y lo reserva la base al crear el renglón, con un candado por asunto y un
--    índice único, así dos recibos hechos a la vez no salen con el mismo número.
-- 6. «Unir fichas» fallaba si la ficha que se va tenía papeles ya retirados en un asunto donde tiene cobros o
--    presupuestos: la que se queda no estaba en ese asunto. Ahora recibe también esos papeles, retirados, con su fecha.
-- 7. Sitio: cada inmueble publicado del panel nuevo lleva su municipio, y un compartido sale como colaboración aunque
--    no tenga anotado el nombre de la inmobiliaria.
-- 8. «Continuar en un asunto nuevo» ya no copia los recibos: son del asunto donde se cobró.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- ── El día de hoy en Tijuana ──────────────────────────────────────────────────────────────────────────
create or replace function public.fortius_inmuebles_hoy() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Tijuana')::date;
$$;
revoke all on function public.fortius_inmuebles_hoy() from public, anon;
grant execute on function public.fortius_inmuebles_hoy() to authenticated, service_role;

alter table public.fortius_inmuebles_ofertas alter column fecha set default public.fortius_inmuebles_hoy();
alter table public.fortius_inmuebles_cobros alter column fecha set default public.fortius_inmuebles_hoy();

-- ── 1. Fichas visibles para quien recibe la solicitud ─────────────────────────────────────────────────
-- Igual que puede_ver_persona, pero para una persona del equipo dada (el disparador del sitio no tiene sesión).
create or replace function public.fortius_inmuebles_persona_visible_para(p_persona uuid, p_usuario uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  -- Solo cuenta quien sigue activo en el equipo, igual que la regla con sesión.
  select p_persona is not null and p_usuario is not null
    and exists (select 1 from public.fortius_inmuebles_staff s where s.user_id = p_usuario and s.active) and (
    exists (select 1 from public.fortius_inmuebles_staff s where s.user_id = p_usuario and s.active and s.role = 'admin')
    or exists (select 1 from public.fortius_inmuebles_personas p
                where p.id = p_persona and p.deleted_at is null and p.responsable_id = p_usuario)
    or exists (select 1 from public.fortius_inmuebles_asunto_personas ap
                 join public.fortius_inmuebles_asuntos a on a.id = ap.asunto_id and a.deleted_at is null
                where ap.persona_id = p_persona and ap.retirado_el is null
                  and (a.responsable_id = p_usuario
                       or exists (select 1 from public.fortius_inmuebles_asunto_miembros m
                                   where m.asunto_id = a.id and m.usuario_id = p_usuario and m.retirado_el is null))));
$$;
revoke all on function public.fortius_inmuebles_persona_visible_para(uuid, uuid) from public, anon, authenticated;
grant execute on function public.fortius_inmuebles_persona_visible_para(uuid, uuid) to service_role;

-- ── 2. Cada regreso por el sitio es una vuelta de la misma solicitud ──────────────────────────────────
alter table public.fortius_inmuebles_solicitudes add column vuelta integer not null default 0 check (vuelta >= 0);
alter table public.fortius_inmuebles_solicitudes drop constraint fortius_inmuebles_solicitudes_lead_id_key;
alter table public.fortius_inmuebles_solicitudes
  add constraint fortius_inmuebles_solicitudes_lead_vuelta_key unique (lead_id, vuelta);

-- Solo el director cambia a quién va; al atenderla se anota quién y cuándo. Lo que llegó del sitio no se reescribe.
create or replace function public.fortius_inmuebles_guard_solicitud() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.asignada_a is distinct from old.asignada_a then
    if auth.uid() is not null and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director pasa una solicitud a otra persona';
    end if;
    new.asignada_el := case when new.asignada_a is null then null else now() end;
  end if;
  if (new.lead_id, new.vuelta, new.nombre, new.telefono, new.correo, new.mensaje, new.recibida_el, new.inmueble_id)
     is distinct from (old.lead_id, old.vuelta, old.nombre, old.telefono, old.correo, old.mensaje, old.recibida_el, old.inmueble_id) then
    raise sqlstate '22023' using message = 'Lo que llegó del sitio no se cambia';
  end if;
  if new.estado <> old.estado then
    new.atendida_el := case when new.estado = 'por_atender' then null else now() end;
    new.atendida_por := case when new.estado = 'por_atender' then null else auth.uid() end;
  end if;
  return new;
end; $$;

-- De records/leads a solicitudes: al llegar y cada vez que alguien descartado regresa (capture_lead anota «reabiertoEl»).
create or replace function public.fortius_inmuebles_lead_a_solicitud() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  d jsonb := new.data;
  v_slug text := nullif(btrim(coalesce(d->>'propiedadSlug', '')), '');
  v_inm public.fortius_inmuebles_inmuebles%rowtype;
  v_asunto uuid; v_responsable uuid; v_persona uuid; v_interesado uuid; v_sol uuid;
  v_digitos text := regexp_replace(coalesce(d->>'telefono', ''), '\D', '', 'g');
  v_pais text; v_numero text; v_correo text := nullif(lower(btrim(coalesce(d->>'email', ''))), '');
  v_vuelta integer := 0; v_recibida timestamptz;
begin
  if new.collection <> 'leads' then return new; end if;
  if tg_op = 'UPDATE' then
    if nullif(d->>'reabiertoEl', '') is null or d->>'reabiertoEl' is not distinct from old.data->>'reabiertoEl' then
      return new;
    end if;
    select coalesce(max(s.vuelta) + 1, 0) into v_vuelta from public.fortius_inmuebles_solicitudes s where s.lead_id = new.id;
    begin v_recibida := (d->>'reabiertoEl')::timestamptz; exception when others then v_recibida := now(); end;
  else
    begin v_recibida := coalesce(nullif(d->>'creadoEl', '')::timestamptz, new.created_at, now());
    exception when others then v_recibida := coalesce(new.created_at, now()); end;
  end if;

  if v_slug is not null then
    select i.* into v_inm from public.fortius_inmuebles_inmuebles i
     where i.slug = v_slug and i.publicado and i.deleted_at is null limit 1;
    if v_inm.id is not null then
      select ai.asunto_id, a.responsable_id into v_asunto, v_responsable
        from public.fortius_inmuebles_asunto_inmuebles ai
        join public.fortius_inmuebles_asuntos a on a.id = ai.asunto_id and a.deleted_at is null and a.en_que_va <> 'cerrado'
       where ai.inmueble_id = v_inm.id and ai.retirado_el is null
       order by ai.created_at desc limit 1;
      v_responsable := coalesce(v_responsable, v_inm.responsable_id);
    end if;
  end if;

  insert into public.fortius_inmuebles_solicitudes (lead_id, vuelta, nombre, telefono, correo, mensaje, inmueble_id, asunto_id, recibida_el, asignada_a, asignada_el)
  values (new.id, v_vuelta, left(btrim(coalesce(d->>'nombre', '')), 160), left(btrim(coalesce(d->>'telefono', '')), 40), left(v_correo, 200),
          left(btrim(coalesce(d->>'mensaje', '')), 4000), v_inm.id, v_asunto, v_recibida, v_responsable,
          case when v_responsable is null then null else now() end)
  on conflict (lead_id, vuelta) do nothing
  returning id into v_sol;
  if v_sol is null or v_asunto is null then return new; end if;

  -- La persona: la misma si su teléfono o su correo ya están en una ficha que ve quien lleva el asunto (primero las
  -- que lleva él); si no, una ficha nueva a su cargo. Nunca se liga la ficha de otro asesor.
  if length(v_digitos) >= 6 then
    if length(v_digitos) > 10 then v_pais := '+' || left(v_digitos, length(v_digitos) - 10); v_numero := right(v_digitos, 10);
    else v_pais := '+52'; v_numero := v_digitos; end if;
    select p.id into v_persona from public.fortius_inmuebles_personas p
     where p.deleted_at is null and p.telefonos_normales @> array[substring(v_pais from 2) || v_numero]
       and public.fortius_inmuebles_persona_visible_para(p.id, v_responsable)
     order by (p.responsable_id = v_responsable) desc, p.created_at limit 1;
  end if;
  if v_persona is null and v_correo is not null then
    select p.id into v_persona from public.fortius_inmuebles_personas p
     where p.deleted_at is null and p.correo = v_correo and public.fortius_inmuebles_persona_visible_para(p.id, v_responsable)
     order by (p.responsable_id = v_responsable) desc, p.created_at limit 1;
  end if;
  begin
    if v_persona is null then
      insert into public.fortius_inmuebles_personas (nombre, telefonos, correo, canal, responsable_id, creado_por)
      values (coalesce(nullif(left(btrim(coalesce(d->>'nombre', '')), 160), ''), 'Sin nombre'),
              case when v_numero is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('pais', v_pais, 'numero', v_numero)) end,
              case when v_correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then v_correo end, 'sitio', v_responsable, null)
      returning id into v_persona;
    end if;
    select x.id into v_interesado from public.fortius_inmuebles_interesados x
     where x.asunto_id = v_asunto and x.persona_id = v_persona and x.deleted_at is null;
    if v_interesado is null then
      insert into public.fortius_inmuebles_interesados (asunto_id, persona_id, solicitud_id, nota, orden, creado_por)
      values (v_asunto, v_persona, v_sol, left('Del sitio: ' || btrim(coalesce(d->>'mensaje', '')), 2000),
              coalesce((select max(x.orden) from public.fortius_inmuebles_interesados x where x.asunto_id = v_asunto), 0) + 10, null)
      returning id into v_interesado;
    else
      -- Si se había descartado y vuelve a escribir, vuelve a estar interesado.
      update public.fortius_inmuebles_interesados set estado = 'nuevo'
       where id = v_interesado and estado = 'descartado';
    end if;
    insert into public.fortius_inmuebles_interesado_inmuebles (interesado_id, inmueble_id, asunto_id)
    values (v_interesado, v_inm.id, v_asunto) on conflict do nothing;
    update public.fortius_inmuebles_solicitudes set persona_id = v_persona, interesado_id = v_interesado where id = v_sol;
  exception when others then
    -- Un teléfono o un correo raro no detiene la solicitud: queda en Por atender, sin interesado.
    return new;
  end;
  return new;
end; $$;
create trigger fortius_zz_solicitud_regreso after update of data on public.fortius_inmuebles_records
  for each row when (new.collection = 'leads' and (new.data->>'reabiertoEl') is distinct from (old.data->>'reabiertoEl'))
  execute function public.fortius_inmuebles_lead_a_solicitud();

-- La consulta solo se liga a una ficha que ve quien la lleva (la sesión; el servidor privilegiado ya comprobó).
create or replace function public.fortius_inmuebles_guard_consulta() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' and new.responsable_id is distinct from auth.uid() and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director abre una consulta a nombre de otra persona';
    end if;
    if tg_op = 'UPDATE' and new.responsable_id is distinct from old.responsable_id and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director cambia quién atiende la consulta';
    end if;
    if new.persona_id is not null and (tg_op = 'INSERT' or new.persona_id is distinct from old.persona_id)
       and not public.fortius_inmuebles_puede_ver_persona(new.persona_id) then
      raise sqlstate 'PT403' using message = 'Sin acceso a esa persona';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.estado = 'asunto' and (new.estado <> 'asunto' or new.asunto_id <> old.asunto_id) then
    raise sqlstate '22023' using message = 'Esta consulta ya abrió su asunto';
  end if;
  if new.estado <> 'abierta' and (tg_op = 'INSERT' or old.estado = 'abierta') then
    new.cerrada_el := now();
  elsif new.estado = 'abierta' then
    new.cerrada_el := null;
    new.motivo := null;
  end if;
  return new;
end; $$;

-- Abrir el asunto desde la consulta (misma función; cambia de dónde sale la persona y el día de las tareas).
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
  if p_papel not in ('contacto', 'propietario', 'titular', 'heredero', 'copropietario', 'comprador', 'vendedor', 'inquilino',
                     'inversionista', 'contraparte', 'apoderado') then
    raise sqlstate '22023' using message = 'Papel no válido';
  end if;
  if jsonb_typeof(coalesce(p_plan, '[]')) <> 'array' then
    raise sqlstate '22023' using message = 'Plan no válido';
  end if;

  -- Quien llama: la ficha elegida, si quien abre el asunto la puede ver; si no (una ficha de otro asesor), una nueva
  -- con lo que se anotó en la consulta. Nunca se cuelga una ficha ajena del asunto ni se frena por eso.
  if c.persona_id is not null and public.fortius_inmuebles_puede_ver_persona(c.persona_id) then
    persona := c.persona_id;
  else
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
              case when t->>'quien' in ('fortius', 'cliente', 'abogado', 'notaria', 'otro') then t->>'quien' else 'fortius' end,
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

-- Guardar como contacto: escribe solo en una ficha que quien atiende puede ver; si no la ve, nace una a su nombre.
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

-- ── 3. Presupuesto: vigencia y seguimiento con el día de Tijuana ─────────────────────────────────────
create or replace function public.fortius_inmuebles_guard_presupuesto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext('presupuesto:' || new.asunto_id::text));
    new.numero := coalesce((select max(numero) from public.fortius_inmuebles_presupuestos where asunto_id = new.asunto_id), 0) + 1;
  elsif new.asunto_id <> old.asunto_id or new.numero <> old.numero then
    raise sqlstate '22023' using message = 'Un presupuesto no cambia de asunto ni de número';
  end if;
  if new.documento_id is not null and not exists (
       select 1 from public.fortius_inmuebles_asunto_documentos d where d.id = new.documento_id and d.asunto_id = new.asunto_id) then
    raise sqlstate '22023' using message = 'El documento es de otro asunto';
  end if;
  if new.estado = 'enviado' and (tg_op = 'INSERT' or old.estado <> 'enviado') then
    new.enviado_el := coalesce(new.enviado_el, now());
    new.vigente_hasta := coalesce(new.vigente_hasta, public.fortius_inmuebles_hoy() + 15);
  end if;
  return new;
end; $$;

create or replace function public.fortius_inmuebles_seguimiento_presupuesto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'enviado' and (tg_op = 'INSERT' or old.estado <> 'enviado') then
    insert into public.fortius_inmuebles_tareas (asunto_id, clase, titulo, quien, fecha, origen, responsable_id, creado_por, orden)
    values (new.asunto_id, 'seguimiento', 'Dar seguimiento al presupuesto', 'fortius', public.fortius_inmuebles_hoy() + 3, 'sistema',
            coalesce(auth.uid(), (select responsable_id from public.fortius_inmuebles_asuntos where id = new.asunto_id)),
            auth.uid(),
            coalesce((select max(orden) + 10 from public.fortius_inmuebles_tareas where asunto_id = new.asunto_id), 10));
  end if;
  return null;
end; $$;

-- ── 4. A quién le toca una tarea ──────────────────────────────────────────────────────────────────────
-- Darla a otra persona, al crearla o después, es de quien lleva el asunto o del director; cualquiera puede tomarla
-- para sí. Volver a preguntar se cuenta desde el día de Tijuana.
create or replace function public.fortius_inmuebles_guard_tarea() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.etapa_id is not null and not exists (
       select 1 from public.fortius_inmuebles_plan_etapas e where e.id = new.etapa_id and e.asunto_id is not distinct from new.asunto_id) then
    raise sqlstate '22023' using message = 'La etapa es de otro asunto';
  end if;
  if tg_op = 'UPDATE' and old.asunto_id is not null and new.asunto_id is distinct from old.asunto_id then
    raise sqlstate '22023' using message = 'Una tarea no cambia de asunto';
  end if;
  if auth.uid() is not null and new.responsable_id is distinct from auth.uid()
     and (tg_op = 'INSERT' or new.responsable_id is distinct from old.responsable_id)
     and not public.fortius_inmuebles_is_admin()
     and not (new.asunto_id is not null and public.fortius_inmuebles_lleva_asunto(new.asunto_id)) then
    raise sqlstate 'PT403' using message = 'Solo quien lleva el asunto o el director asignan tareas a otra persona';
  end if;
  if new.estado = 'hecha' and (tg_op = 'INSERT' or old.estado <> 'hecha') then
    new.hecha_el := now();
    new.hecha_por := auth.uid();
  elsif new.estado <> 'hecha' then
    new.hecha_el := null;
    new.hecha_por := null;
  end if;
  if new.estado in ('pendiente', 'hecha') then
    new.motivo := null;
  end if;
  if new.quien <> 'fortius' and new.volver_a_preguntar is null and new.estado = 'pendiente' then
    new.volver_a_preguntar := coalesce(new.fecha, public.fortius_inmuebles_hoy()) + 3;
  end if;
  if tg_op = 'UPDATE' and new.estado = 'pendiente' and old.fecha is not null and new.fecha > old.fecha then
    new.pospuesta := old.pospuesta + 1;
  end if;
  return new;
end; $$;

-- ── 5. Número de recibo, uno por asunto y sin repetirse ──────────────────────────────────────────────
alter table public.fortius_inmuebles_asunto_documentos add column recibo_numero integer check (recibo_numero > 0);
-- Los recibos que ya existan quedan numerados en el orden en que se hicieron (la revisión no encontró ninguno).
update public.fortius_inmuebles_asunto_documentos d set recibo_numero = x.n
  from (select id, row_number() over (partition by asunto_id order by created_at, id) as n
          from public.fortius_inmuebles_asunto_documentos where es_recibo) x
 where d.id = x.id;
create unique index fortius_inmuebles_recibo_numero_uno
  on public.fortius_inmuebles_asunto_documentos (asunto_id, recibo_numero) where recibo_numero is not null;

create or replace function public.fortius_inmuebles_numero_recibo() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_folio text;
begin
  if tg_op = 'UPDATE' then
    new.recibo_numero := old.recibo_numero;   -- el número no se cambia
    return new;
  end if;
  if not new.es_recibo then
    new.recibo_numero := null;
    return new;
  end if;
  -- Una restauración (servidor, sin sesión) conserva el número que traía.
  if auth.uid() is null and new.recibo_numero is not null then return new; end if;
  perform pg_advisory_xact_lock(hashtext('recibo:' || new.asunto_id::text));
  new.recibo_numero := coalesce((select max(d.recibo_numero) from public.fortius_inmuebles_asunto_documentos d
                                  where d.asunto_id = new.asunto_id), 0) + 1;
  if new.nombre = 'Recibo' then
    select a.folio into v_folio from public.fortius_inmuebles_asuntos a where a.id = new.asunto_id;
    new.nombre := 'Recibo ' || v_folio || '-R' || lpad(new.recibo_numero::text, 2, '0');
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_numero_recibo() from public, anon, authenticated, service_role;
create trigger fortius_03_numero_recibo before insert or update on public.fortius_inmuebles_asunto_documentos
  for each row execute function public.fortius_inmuebles_numero_recibo();

-- ── 6. Unir dos fichas de la misma persona ───────────────────────────────────────────────────────────
-- Solo el director. Todo lo de la ficha que se va pasa a la que se queda; los datos para contratos se completan
-- (lo que ya tiene la que se queda manda). Un papel repetido en el mismo asunto se retira en lugar de duplicarse.
-- Los papeles que la ficha que se va ya tenía retirados pasan también, retirados y con su fecha: así la que se queda
-- sigue «en el asunto» para sus cobros y presupuestos de entonces, y el historial no se pierde.
create or replace function public.fortius_inmuebles_unir_personas(p_origen uuid, p_destino uuid) returns void
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
  -- Los ya retirados: una copia retirada (si la que se queda ya tenía ese papel, activo o retirado, se deja el suyo).
  insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, inmueble_id, principal, nota, orden, creado_por, retirado_el)
  select ap.asunto_id, p_destino, ap.papel, ap.inmueble_id, false, ap.nota, ap.orden, auth.uid(), ap.retirado_el
    from public.fortius_inmuebles_asunto_personas ap
   where ap.persona_id = p_origen and ap.retirado_el is not null
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

-- ── 7. Lo que sale en el sitio: municipio y colaboración ─────────────────────────────────────────────
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
      'tipo', case i.tipo when 'nave_bodega' then 'nave-industrial' when 'plaza_conjunto' then 'plaza' else i.tipo end,
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

-- ── 8. Continuar en un asunto nuevo, sin los recibos ─────────────────────────────────────────────────
create or replace function public.fortius_inmuebles_continuar_asunto(p_asunto uuid, p_nombre text, p_encargos text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a record; nuevo record; docs jsonb := '{}'; d record; nd uuid;
begin
  if not public.fortius_inmuebles_puede_ver_asunto(p_asunto) then
    raise sqlstate 'PT403' using message = 'Sin acceso a ese asunto';
  end if;
  select * into a from public.fortius_inmuebles_asuntos where id = p_asunto and deleted_at is null;
  if not found then
    raise sqlstate '22023' using message = 'Ese asunto no existe';
  end if;
  insert into public.fortius_inmuebles_asuntos (nombre, encargos, responsable_id, viene_de, es_ejemplo, creado_por)
  values (coalesce(nullif(btrim(p_nombre), ''), left(a.nombre || ' (continúa)', 160)),
          coalesce(p_encargos, a.encargos), auth.uid(), a.id, a.es_ejemplo, auth.uid())
  returning id, folio into nuevo;

  insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, inmueble_id, principal, nota, orden, creado_por)
  select nuevo.id, persona_id, papel, inmueble_id, principal, nota, orden, auth.uid()
    from public.fortius_inmuebles_asunto_personas where asunto_id = a.id and retirado_el is null;
  insert into public.fortius_inmuebles_asunto_inmuebles (asunto_id, inmueble_id, orden, creado_por)
  select nuevo.id, inmueble_id, orden, auth.uid()
    from public.fortius_inmuebles_asunto_inmuebles where asunto_id = a.id and retirado_el is null;

  for d in select * from public.fortius_inmuebles_asunto_documentos where asunto_id = a.id and deleted_at is null and not es_recibo order by orden loop
    insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, grupo, estado, recibido_el, entrega_persona_id, entrega_papel,
                                                            de_persona_id, inmueble_id, vence_el, avisar_dias, origen, paso,
                                                            es_contrato, es_recibo, nota, orden, creado_por)
    values (nuevo.id, d.nombre, d.grupo, d.estado, d.recibido_el, d.entrega_persona_id, d.entrega_papel, d.de_persona_id, d.inmueble_id,
            d.vence_el, d.avisar_dias, d.origen, d.paso, d.es_contrato, d.es_recibo, d.nota, d.orden, auth.uid())
    returning id into nd;
    docs := docs || jsonb_build_object(d.id::text, nd);
  end loop;

  insert into public.fortius_inmuebles_historial (entidad, entidad_id, asunto_id, clase, resumen, actor_id, actor_tipo)
  values ('asunto', nuevo.id::text, nuevo.id, 'nota', 'Viene de ' || a.folio || ', ' || a.nombre || '.', auth.uid(), 'usuario'),
         ('asunto', a.id::text, a.id, 'nota', 'Continúa en ' || nuevo.folio || '.', auth.uid(), 'usuario');
  return jsonb_build_object('id', nuevo.id, 'folio', nuevo.folio, 'documentos', docs);
end; $$;

notify pgrst, 'reload schema';
commit;
