-- B10 / C-16 (auditoría del 13/11/2026): el alta del inventario heredado (COR-24) eran cuatro
-- escrituras separadas (propietario, operación, tarea y avance). Si una fallaba a la mitad quedaba
-- un propietario o una operación sueltos, y dos altas a la vez del mismo inmueble podían crear dos
-- operaciones del propietario. Ahora las cuatro van en una sola transacción, con un candado por
-- inmueble. La función corre con los permisos de quien la llama (el director): las mismas
-- validaciones y disparadores de siempre revisan cada paso; no se salta ninguna protección.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

create or replace function public.fortius_inmuebles_alta_heredado(
  p_slug text, p_cliente_id text, p_cliente jsonb, p_operacion text, p_flujo jsonb, p_tarea_id text, p_tarea jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r public.fortius_inmuebles_expedientes;
begin
  if not public.fortius_inmuebles_is_admin() then
    raise exception 'El inventario heredado lo da de alta el director' using errcode = 'PT403';
  end if;
  if p_operacion not in ('venta', 'renta') or jsonb_typeof(p_cliente) <> 'object' or jsonb_typeof(p_tarea) <> 'object' then
    raise exception 'Alta de inventario heredado inválida' using errcode = 'PT400';
  end if;
  -- Dos altas del mismo inmueble a la vez: la segunda espera y ve la operación de la primera.
  perform pg_advisory_xact_lock(hashtextextended('fortius_inmuebles_heredado:' || p_slug, 0));
  if exists (
    select 1 from public.fortius_inmuebles_expedientes e
     where e.propiedad_slug = p_slug and e.deleted_at is null
       and e.flujo->>'ruta' in ('captacion', 'arrendador') and coalesce(e.flujo->>'estado', '') <> 'descartada'
  ) then
    raise exception 'Este inmueble ya tiene una operación del propietario' using errcode = 'PT409';
  end if;

  perform public.fortius_inmuebles_put_record('clientes', p_cliente_id, p_cliente, null);
  insert into public.fortius_inmuebles_expedientes (cliente_id, asesor_id, propiedad_slug, operacion, unidad, flujo)
  values (p_cliente_id, p_cliente->>'asesorId', p_slug, p_operacion, '', p_flujo)
  returning * into r;
  perform public.fortius_inmuebles_put_record('tareas', p_tarea_id, jsonb_set(p_tarea, '{expedienteId}', to_jsonb(r.id::text)), null);
  -- Avanzar a verificación pide la próxima tarea con fecha: la de regularizar, recién creada.
  return public.fortius_inmuebles_update_operation(r.id, r.version, 'documentacion', null, coalesce(r.checklist, '{}'::jsonb), r.flujo, null, false);
end;
$$;

revoke all on function public.fortius_inmuebles_alta_heredado(text, text, jsonb, text, jsonb, text, jsonb) from public, anon, service_role;
grant execute on function public.fortius_inmuebles_alta_heredado(text, text, jsonb, text, jsonb, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
