-- C-40 (titular, 13/11/2026: un asesor puede ligar trabajos de Herramientas a cualquier inmueble).
-- El guardián de app_runs comprobaba que el inmueble existiera con una consulta sujeta a la RLS de
-- quien llama; desde 20261113120000_propiedades_por_asesor un asesor no ve los inmuebles de otro y
-- guardar la ficha comercial del inmueble de un compañero (o seguir con sus trabajos de un inmueble
-- que le reasignaron a otro) fallaba con «Inmueble no disponible».
-- Ahora la existencia se comprueba con una función SECURITY DEFINER que solo responde sí/no y solo
-- a personal activo; el inmueble ajeno sigue sin poder leerse. El resto del guardián no cambia.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_property_exists(p_slug text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.fortius_inmuebles_is_staff()
    and exists(select 1 from public.fortius_inmuebles_records where collection='propiedades' and id=p_slug);
$$;
revoke all on function public.fortius_inmuebles_property_exists(text) from public, anon;
grant execute on function public.fortius_inmuebles_property_exists(text) to authenticated, service_role;

create or replace function public.fortius_inmuebles_guard_app_run() returns trigger language plpgsql set search_path='' as $$
declare e public.fortius_inmuebles_expedientes; begin
 if tg_op='UPDATE' then
  if new.id<>old.id or new.owner_id<>old.owner_id or new.slug<>old.slug or new.context<>old.context or new.expediente_id is distinct from old.expediente_id or new.created_at<>old.created_at then raise sqlstate 'PT400' using message='Identidad del trabajo inmutable'; end if;
  if new.version<>old.version+1 then raise sqlstate 'PT409' using message='Version desactualizada'; end if;
 else
  if new.version<>1 or new.deleted_at is not null then raise sqlstate 'PT400' using message='Version inicial invalida'; end if;
 end if;
 if (new.context->>'expedienteId') is distinct from new.expediente_id::text then raise sqlstate 'PT400' using message='Contexto invalido'; end if;
 if new.expediente_id is not null then
  select * into e from public.fortius_inmuebles_expedientes where id=new.expediente_id for share;
  if not found or e.deleted_at is not null or not public.fortius_inmuebles_can_access_expediente(e.id) then raise sqlstate 'PT403' using message='Expediente no disponible'; end if;
  if (new.context ? 'clienteId' and new.context->>'clienteId' is distinct from e.cliente_id) or (new.context ? 'inmuebleId' and new.context->>'inmuebleId' is distinct from e.propiedad_slug) then raise sqlstate 'PT400' using message='Referencias inconsistentes'; end if;
 end if;
 if new.context ? 'clienteId' and not public.fortius_inmuebles_can_access_client_id(new.context->>'clienteId') then raise sqlstate 'PT403' using message='Cliente no disponible'; end if;
 if new.context ? 'inmuebleId' and not public.fortius_inmuebles_property_exists(new.context->>'inmuebleId') then raise sqlstate 'PT400' using message='Inmueble no disponible'; end if;
 new.updated_at:=clock_timestamp(); return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_app_run() from public,anon,authenticated;

notify pgrst,'reload schema';
commit;
