-- B9 / C-19 (auditoría del 13/11/2026): el tope mensual de lecturas con IA no resistía peticiones
-- en paralelo; cada una sumaba el gasto antes de que las otras anotaran el suyo. Ahora el servidor
-- reserva la lectura en la base antes de llamar al servicio: la reserva se toma en fila (un candado
-- por transacción), cuenta para el tope y al terminar se convierte en la lectura con su costo real.
-- Una reserva abandonada (el servidor se cayó a la mitad) deja de contar a los 15 minutos.
-- C-19: mientras un documento se está leyendo, otra lectura del mismo documento responde PT409.
-- Solo la usa el servidor; nada cambia para el personal.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

alter table public.fortius_inmuebles_ia_lecturas drop constraint if exists fortius_inmuebles_ia_lecturas_estado_check;
alter table public.fortius_inmuebles_ia_lecturas add constraint fortius_inmuebles_ia_lecturas_estado_check
  check (estado in ('reservada','leido','error'));

create or replace function public.fortius_inmuebles_reservar_lectura_ia(
  p_archivo uuid, p_expediente uuid, p_requested_by uuid, p_tope numeric, p_reserva numeric
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gasto numeric;
  v_id uuid;
begin
  if p_tope is null or p_tope < 0 or p_reserva is null or p_reserva < 0 or p_reserva > 10 then
    raise exception 'Tope o reserva inválidos' using errcode = 'PT400';
  end if;
  -- Una sola reserva a la vez: la siguiente ve la anterior al sumar.
  perform pg_advisory_xact_lock(hashtextextended('fortius_inmuebles_ia_tope', 0));
  if exists (
    select 1 from public.fortius_inmuebles_ia_lecturas l
     where l.archivo_id = p_archivo and l.estado = 'reservada' and l.created_at > now() - interval '15 minutes'
  ) then
    raise exception 'Este documento ya se está leyendo' using errcode = 'PT409';
  end if;
  select coalesce(sum(l.costo_usd), 0) into v_gasto
    from public.fortius_inmuebles_ia_lecturas l
   where l.created_at >= date_trunc('month', now(), 'UTC')
     and (l.estado <> 'reservada' or l.created_at > now() - interval '15 minutes');
  if v_gasto >= p_tope then
    raise exception 'Se alcanzó el tope de lecturas de este mes' using errcode = 'PT429';
  end if;
  insert into public.fortius_inmuebles_ia_lecturas (archivo_id, expediente_id, requested_by, modelo, estado, costo_usd)
  values (p_archivo, p_expediente, p_requested_by, 'reservada', 'reservada', p_reserva)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.fortius_inmuebles_reservar_lectura_ia(uuid, uuid, uuid, numeric, numeric) from public, anon, authenticated;
grant execute on function public.fortius_inmuebles_reservar_lectura_ia(uuid, uuid, uuid, numeric, numeric) to service_role;

notify pgrst, 'reload schema';
commit;
