-- PN-03 · «Unir con un duplicado» en Personas (16/11/2026). Sin aplicar: depende de PN-02 (persona_uniones, pendientes,
-- asunto_personas e historial) y se aplica con ellas al integrar en main.
-- Una sola transacción: la ficha que se queda recibe los datos elegidos, se le pasan los asuntos (con sus documentos y
-- formatos, que cuelgan del asunto), las personas de asuntos, los pendientes, las consultas, las tareas, las citas y los
-- trámites de la otra; la otra se archiva (no se borra) y queda anotada en persona_uniones y en el historial.
-- Las notas internas solo se agregan (no se reapuntan): se leen desde la ficha unida.
-- Solo el director une: pasar asuntos de una persona a otra es reasignar, y eso ya es solo de dirección
-- (fortius_inmuebles_guard_expediente_update). Versión optimista de las dos fichas: si cambió alguna, 409.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_unir_personas(
  p_queda text, p_se_va text, p_version_queda bigint, p_version_se_va bigint, p_datos_queda jsonb, p_motivo text default ''
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  queda public.fortius_inmuebles_records;
  se_va public.fortius_inmuebles_records;
  r record;
  n_asuntos int := 0; n_papeles int := 0; n_pendientes int := 0; n_consultas int := 0; n_tareas int := 0; n_citas int := 0; n_tramites int := 0;
  perfil jsonb;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message = 'Sesión requerida'; end if;
  if not public.fortius_inmuebles_is_admin() then
    raise sqlstate 'PT403' using message = 'Por ahora solo el director une fichas de personas';
  end if;
  if p_queda is null or p_se_va is null or p_queda = p_se_va then
    raise sqlstate 'PT400' using message = 'Elige dos personas distintas';
  end if;
  if p_datos_queda is null or jsonb_typeof(p_datos_queda) <> 'object' or p_datos_queda->>'id' is distinct from p_queda then
    raise sqlstate 'PT400' using message = 'Los datos que se conservan no corresponden a la ficha que se queda';
  end if;
  if length(coalesce(p_motivo, '')) > 500 then raise sqlstate 'PT400' using message = 'El motivo es muy largo'; end if;

  perform pg_advisory_xact_lock(781023);
  select * into queda from public.fortius_inmuebles_records where collection = 'clientes' and id = p_queda for update;
  select * into se_va from public.fortius_inmuebles_records where collection = 'clientes' and id = p_se_va for update;
  if queda.id is null or se_va.id is null then raise sqlstate 'PT404' using message = 'Una de las dos personas ya no existe'; end if;
  if queda.version <> p_version_queda or se_va.version <> p_version_se_va then
    raise sqlstate 'PT409' using message = 'Alguien cambió una de las fichas; vuelve a abrirlas antes de unir';
  end if;
  if exists (select 1 from public.fortius_inmuebles_persona_uniones where persona_id in (p_queda, p_se_va)) then
    raise sqlstate 'PT409' using message = 'Una de las fichas ya está unida a otra';
  end if;

  -- 1. La ficha que se queda, con los datos elegidos (misma validación que al guardar desde la app).
  perform public.fortius_inmuebles_validate_record('clientes', p_queda, p_datos_queda);
  update public.fortius_inmuebles_records set data = p_datos_queda, updated_at = clock_timestamp()
    where collection = 'clientes' and id = p_queda;
  perform public.fortius_inmuebles_sync_references('clientes', p_queda, p_datos_queda);

  -- 2. Asuntos (documentos, formatos y emisiones cuelgan del asunto y se van con él).
  update public.fortius_inmuebles_expedientes set cliente_id = p_queda, version = version + 1 where cliente_id = p_se_va;
  get diagnostics n_asuntos = row_count;

  -- 3. Personas de asuntos: si las dos ya estaban en el mismo asunto con el mismo papel, se conserva la de la que se queda.
  delete from public.fortius_inmuebles_asunto_personas o
    where o.persona_id = p_se_va
      and exists (select 1 from public.fortius_inmuebles_asunto_personas d where d.asunto_id = o.asunto_id and d.papel = o.papel and d.persona_id = p_queda);
  update public.fortius_inmuebles_asunto_personas set persona_id = p_queda where persona_id = p_se_va;
  get diagnostics n_papeles = row_count;

  -- 4. Pendientes (la versión la sube su propio disparador).
  update public.fortius_inmuebles_pendientes set persona_id = p_queda where persona_id = p_se_va;
  get diagnostics n_pendientes = row_count;

  -- 5. Consultas, tareas, citas y trámites guardados como registros: cambia `clienteId`.
  for r in select collection, id, data from public.fortius_inmuebles_records
            where collection in ('leads', 'tareas', 'eventos', 'tramites') and data->>'clienteId' = p_se_va for update loop
    update public.fortius_inmuebles_records set data = jsonb_set(r.data, '{clienteId}', to_jsonb(p_queda)), updated_at = clock_timestamp()
      where collection = r.collection and id = r.id;
    perform public.fortius_inmuebles_sync_references(r.collection, r.id, jsonb_set(r.data, '{clienteId}', to_jsonb(p_queda)));
    case r.collection
      when 'leads' then n_consultas := n_consultas + 1;
      when 'tareas' then n_tareas := n_tareas + 1;
      when 'eventos' then n_citas := n_citas + 1;
      else n_tramites := n_tramites + 1;
    end case;
  end loop;

  -- 6. La otra ficha se archiva (se recupera desde «Ver archivados»); nunca se borra.
  perfil := coalesce(se_va.data->'perfil', '{}'::jsonb) || jsonb_build_object('archivado', true, 'unidaEn', p_queda, 'unidaEl', to_jsonb(clock_timestamp()));
  update public.fortius_inmuebles_records set data = jsonb_set(se_va.data, '{perfil}', perfil), updated_at = clock_timestamp()
    where collection = 'clientes' and id = p_se_va;

  -- 7. Registro de la unión (sin cadenas: lo que apuntaba a la que se va, ahora apunta a la que se queda).
  update public.fortius_inmuebles_persona_uniones set unida_en = p_queda where unida_en = p_se_va;
  insert into public.fortius_inmuebles_persona_uniones (persona_id, unida_en, motivo) values (p_se_va, p_queda, coalesce(p_motivo, ''));

  perform public.fortius_inmuebles_anotar_historial('persona', p_queda, null, 'union',
    left(format('Se unió con %s', coalesce(nullif(btrim(se_va.data->>'nombre'), ''), 'otra ficha')), 500),
    jsonb_build_object('unida', p_se_va, 'asuntos', n_asuntos, 'papeles', n_papeles, 'pendientes', n_pendientes,
                       'consultas', n_consultas, 'tareas', n_tareas, 'citas', n_citas, 'tramites', n_tramites));

  return jsonb_build_object('queda', p_queda, 'seVa', p_se_va, 'asuntos', n_asuntos, 'papeles', n_papeles, 'pendientes', n_pendientes,
    'consultas', n_consultas, 'tareas', n_tareas, 'citas', n_citas, 'tramites', n_tramites);
exception
  when foreign_key_violation then raise sqlstate 'PT400' using message = 'Referencia inexistente al unir';
  when unique_violation then raise sqlstate 'PT409' using message = 'La unión chocó con otro cambio; vuelve a intentarlo';
end; $$;
revoke all on function public.fortius_inmuebles_unir_personas(text, text, bigint, bigint, jsonb, text) from public, anon;
grant execute on function public.fortius_inmuebles_unir_personas(text, text, bigint, bigint, jsonb, text) to authenticated, service_role;

commit;
