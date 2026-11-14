-- TRA-01 (aceptación del titular): en una venta, la firma no avanza sin la cancelación de hipoteca
-- inscrita o la decisión del director. El freno vivía solo en la ruta del panel; con su propia sesión,
-- un asesor podía llamar fortius_inmuebles_update_operation directo, o escribir en la tabla, y pasar
-- a la firma. Como el candado de arranque (20261113124000_candado_de_arranque), este disparador
-- aplica la regla en la base y cubre la RPC y la tabla, con las mismas palabras del panel:
-- entrar a «cierre» o a una etapa posterior se rechaza mientras un trámite ligado a la operación
-- (expedienteId) no tenga cerrado el paso del Registro Público y no tenga firmaSinCancelacion, la
-- decisión que solo toma el director (20261114211000_tramites). Un trámite cancelado sigue frenando.
-- Se dispara antes que la guía (fortius_01_*) para que el motivo sea el de la firma.
-- No reescribe registros ni funciones existentes; se puede volver a correr.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_guard_mortgage_signing() returns trigger
language plpgsql security definer set search_path='' as $$
declare stages text[]:=array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'];
 hasta integer; desde integer;
begin
 if new.operacion is distinct from 'venta' or new.etapa is not distinct from old.etapa then return new; end if;
 hasta:=coalesce(array_position(stages,new.etapa),0); desde:=coalesce(array_position(stages,old.etapa),0);
 if hasta<array_position(stages,'cierre') or hasta<=desde then return new; end if;
 if exists(select 1 from public.fortius_inmuebles_records t where t.collection='tramites' and t.data->>'expedienteId'=new.id::text
   and (t.data->>'pasoActual')::int < 6 and jsonb_typeof(t.data->'firmaSinCancelacion') is distinct from 'object') then
  raise sqlstate 'PT409' using message='Antes de la firma: la cancelación de hipoteca de esta venta debe quedar inscrita en el Registro Público. Si se firma sin ella, lo decide el director en el trámite, con su motivo.';
 end if;
 return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_mortgage_signing() from public, anon, authenticated, service_role;
drop trigger if exists fortius_00b_guard_mortgage_signing on public.fortius_inmuebles_expedientes;
create trigger fortius_00b_guard_mortgage_signing before update on public.fortius_inmuebles_expedientes
for each row execute function public.fortius_inmuebles_guard_mortgage_signing();

notify pgrst,'reload schema';
commit;
