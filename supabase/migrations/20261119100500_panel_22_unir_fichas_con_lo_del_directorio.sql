-- Panel · Unir dos fichas junta también lo del Directorio (19/11/2026, SPEC.md sección 6).
--  Hasta hoy, al unir dos fichas de la misma persona, lo que nació con el Directorio (lo que sigue, qué busca y qué
--  ofrece con su presupuesto y zona, el canal, el aviso de privacidad y si está archivada) se quedaba en la ficha que
--  se va a Eliminados. Ahora la ficha que se queda conserva lo suyo y toma de la otra lo que tenga vacío:
--   · Textos (lo que sigue, qué busca, qué ofrece, zona, canal) y presupuesto (con su moneda): si los suyos están vacíos.
--   · Aviso de privacidad: si el suyo está pendiente, el de la otra, con su fecha.
--   · Archivada: solo si las dos lo estaban; si cualquiera seguía en la lista diaria, queda en ella.
--   · Historial de contacto: no se mueve, porque solo se agrega; la ficha que se queda ya lo muestra por el registro de
--     uniones (que no admite cadenas), y quien la ve lo lee.
--   · Queda en su historial «Se unió otra ficha de esta persona», con los campos que tomó (sin sus valores).
--  La función de unir es la de 20261118100000_arregla_pendientes_revision.sql con solo eso agregado; la de los sellos de
--  la persona, la de 20261119100000_panel_17_directorio.sql con una excepción mientras se unen fichas.
-- Se puede volver a correr. No reescribe registros.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── Los sellos de la persona respetan lo que copia la unión ───────────────────────────────────────────
create or replace function public.fortius_inmuebles_sellos_persona() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- Al unir dos fichas, la base copia el aviso y el archivo de la otra con su fecha y quién: se respeta lo que trae.
  if tg_op = 'UPDATE' and current_setting('fortius_inmuebles.uniendo_fichas', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.archivada_por := case when new.archivada_el is null then null else auth.uid() end;
    new.aviso_privacidad_el := case when new.aviso_privacidad = 'pendiente' then null else public.fortius_inmuebles_hoy() end;
    return new;
  end if;
  if new.archivada_el is distinct from old.archivada_el then
    new.archivada_por := case when new.archivada_el is null then null else auth.uid() end;
  else
    new.archivada_por := old.archivada_por;
  end if;
  if new.aviso_privacidad is distinct from old.aviso_privacidad then
    new.aviso_privacidad_el := case when new.aviso_privacidad = 'pendiente' then null else public.fortius_inmuebles_hoy() end;
  else
    new.aviso_privacidad_el := old.aviso_privacidad_el;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_sellos_persona() from public, anon, authenticated;

-- ── Unir dos fichas ───────────────────────────────────────────────────────────────────────────────────
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

  -- La ficha que se queda junta teléfonos, correo y nota; «no contactar» se respeta si cualquiera lo pidió. Lo del
  -- Directorio (panel 17): lo que tiene la que se queda manda y toma de la otra lo que tenga vacío; el aviso de
  -- privacidad, con su fecha; sigue en la lista diaria si cualquiera de las dos lo estaba.
  perform set_config('fortius_inmuebles.uniendo_fichas', 'on', true);
  update public.fortius_inmuebles_personas set
    telefonos = (select coalesce(jsonb_agg(t), '[]') from (select distinct on (regexp_replace(coalesce(t->>'pais', '') || (t->>'numero'), '\D', '', 'g')) t
                   from jsonb_array_elements(d.telefonos || o.telefonos) t) x where true),
    correo = coalesce(d.correo, o.correo),
    no_contactar = d.no_contactar or o.no_contactar,
    fallecida = d.fallecida or o.fallecida,
    nota = left(btrim(d.nota || case when o.nota <> '' and d.nota <> o.nota then E'\n' || o.nota else '' end), 2000),
    volver_a_llamar = coalesce(d.volver_a_llamar, o.volver_a_llamar),
    canal = coalesce(nullif(btrim(d.canal), ''), o.canal),
    lo_que_sigue = case when btrim(d.lo_que_sigue) = '' then o.lo_que_sigue else d.lo_que_sigue end,
    que_busca = case when btrim(d.que_busca) = '' then o.que_busca else d.que_busca end,
    que_ofrece = case when btrim(d.que_ofrece) = '' then o.que_ofrece else d.que_ofrece end,
    zona = case when btrim(d.zona) = '' then o.zona else d.zona end,
    presupuesto = coalesce(d.presupuesto, o.presupuesto),
    presupuesto_moneda = case when d.presupuesto is null and o.presupuesto is not null then o.presupuesto_moneda else d.presupuesto_moneda end,
    aviso_privacidad = case when d.aviso_privacidad = 'pendiente' then o.aviso_privacidad else d.aviso_privacidad end,
    aviso_privacidad_el = case when d.aviso_privacidad = 'pendiente' then o.aviso_privacidad_el else d.aviso_privacidad_el end,
    archivada_el = case when d.archivada_el is not null and o.archivada_el is not null then d.archivada_el end,
    archivada_por = case when d.archivada_el is not null and o.archivada_el is not null then d.archivada_por end,
    version = d.version
   where id = p_destino;
  perform set_config('fortius_inmuebles.uniendo_fichas', 'off', true);

  update public.fortius_inmuebles_personas set deleted_at = now(), deleted_by = auth.uid(), version = o.version where id = p_origen;
  insert into public.fortius_inmuebles_persona_uniones (origen_id, destino_id, detalle)
    values (p_origen, p_destino, jsonb_build_object('nombre', o.nombre));
  -- En el historial de la que se queda: que se unió y qué tomó de la otra (los nombres de los campos, no sus valores).
  -- Su historial de contacto no se mueve (solo se agrega): la ficha que se queda lo muestra por el registro de uniones.
  insert into public.fortius_inmuebles_historial (entidad, entidad_id, clase, resumen, detalle, actor_id, actor_tipo)
  values ('persona', p_destino::text, 'sistema', 'Se unió otra ficha de esta persona', jsonb_build_object(
    'origen_id', p_origen,
    'campos', to_jsonb(array_remove(array[
      case when nullif(btrim(d.canal), '') is null and nullif(btrim(o.canal), '') is not null then 'canal' end,
      case when btrim(d.lo_que_sigue) = '' and btrim(o.lo_que_sigue) <> '' then 'lo_que_sigue' end,
      case when btrim(d.que_busca) = '' and btrim(o.que_busca) <> '' then 'que_busca' end,
      case when btrim(d.que_ofrece) = '' and btrim(o.que_ofrece) <> '' then 'que_ofrece' end,
      case when btrim(d.zona) = '' and btrim(o.zona) <> '' then 'zona' end,
      case when d.presupuesto is null and o.presupuesto is not null then 'presupuesto' end,
      case when d.aviso_privacidad = 'pendiente' and o.aviso_privacidad <> 'pendiente' then 'aviso_privacidad' end,
      case when d.archivada_el is not null and o.archivada_el is null then 'archivada_el' end
    ]::text[], null)),
    'contactos', (select count(*) from public.fortius_inmuebles_persona_contactos c where c.persona_id = p_origen)),
    auth.uid(), 'usuario');
end; $$;
revoke all on function public.fortius_inmuebles_unir_personas(uuid, uuid) from public, anon;
grant execute on function public.fortius_inmuebles_unir_personas(uuid, uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
