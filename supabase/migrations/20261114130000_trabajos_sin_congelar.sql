-- C-50 (13/11/2026). El guardián de app_runs revisaba las referencias (expediente, cliente, inmueble)
-- en cada UPDATE, también al mandar el trabajo a Eliminados, que solo cambia deleted_at y la versión.
-- Si el inmueble ligado ya se había eliminado, o la operación cambió de inmueble, el trabajo quedaba
-- congelado: visible pero sin poder editarse ni eliminarse.
-- En UPDATE la identidad y el contexto ya son inmutables (se revisa arriba) y la política
-- apps_update sigue exigiendo acceso al expediente, así que las referencias se revisan solo al crear.
-- Igual que 20261114110000 salvo ese «if tg_op='INSERT'».
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_guard_app_run() returns trigger language plpgsql set search_path='' as $$
declare e public.fortius_inmuebles_expedientes; begin
 if tg_op='UPDATE' then
  if new.id<>old.id or new.owner_id<>old.owner_id or new.slug<>old.slug or new.context<>old.context or new.expediente_id is distinct from old.expediente_id or new.created_at<>old.created_at then raise sqlstate 'PT400' using message='Identidad del trabajo inmutable'; end if;
  if new.version<>old.version+1 then raise sqlstate 'PT409' using message='Version desactualizada'; end if;
 else
  if new.version<>1 or new.deleted_at is not null then raise sqlstate 'PT400' using message='Version inicial invalida'; end if;
  if (new.context->>'expedienteId') is distinct from new.expediente_id::text then raise sqlstate 'PT400' using message='Contexto invalido'; end if;
  if new.expediente_id is not null then
   select * into e from public.fortius_inmuebles_expedientes where id=new.expediente_id for share;
   if not found or e.deleted_at is not null or not public.fortius_inmuebles_can_access_expediente(e.id) then raise sqlstate 'PT403' using message='Expediente no disponible'; end if;
   if (new.context ? 'clienteId' and new.context->>'clienteId' is distinct from e.cliente_id) or (new.context ? 'inmuebleId' and new.context->>'inmuebleId' is distinct from e.propiedad_slug) then raise sqlstate 'PT400' using message='Referencias inconsistentes'; end if;
  end if;
  if new.context ? 'clienteId' and not public.fortius_inmuebles_can_access_client_id(new.context->>'clienteId') then raise sqlstate 'PT403' using message='Cliente no disponible'; end if;
  if new.context ? 'inmuebleId' and not public.fortius_inmuebles_property_exists(new.context->>'inmuebleId') then raise sqlstate 'PT400' using message='Inmueble no disponible'; end if;
 end if;
 new.updated_at:=clock_timestamp(); return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_app_run() from public,anon,authenticated;

notify pgrst,'reload schema';
commit;
