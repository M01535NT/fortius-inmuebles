-- Metodología M-07 (decisión del titular, 14/11/2026): cuando se emite una versión nueva del
-- documento que respalda una revisión, esa revisión vuelve a «Lo tengo» hasta revisar la nueva.
-- «Versión nueva» es otra versión del mismo borrador o un borrador distinto del mismo formato en la
-- misma operación. Volver a emitir la misma versión no cambia nada. Solo baja lo que estaba
-- «revisado» con una emisión; quita esa evidencia vieja para que se elija la nueva y deja una nota de
-- actividad. No reescribe registros existentes: actúa al emitir.
-- La ruta de emisión inserta con la cuenta de servicio, sin sesión. El cambio se registra a nombre de
-- quien emitió (created_by, que el servidor toma de la sesión) para que los guardianes de la
-- operación lo acepten y anoten quién fue; al terminar se restaura la identidad anterior.
-- Si la emisión nueva viene de un borrador distinto, solo cuenta si ese borrador es igual o más
-- nuevo que el que respaldaba la revisión.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_supersede_reviews() returns trigger
language plpgsql security definer set search_path='' as $$
declare d record; e public.fortius_inmuebles_expedientes; flow jsonb; k text; r jsonb; moved text[]:=array[]::text[]; who text;
begin
 select x.expediente_id,x.formato_id,x.created_at into d from public.fortius_inmuebles_formato_drafts x where x.id=new.draft_id;
 if d.expediente_id is null then return null; end if;
 select * into e from public.fortius_inmuebles_expedientes where id=d.expediente_id and deleted_at is null and flujo is not null for update;
 if not found then return null; end if;
 flow:=e.flujo;
 for k,r in select key,value from jsonb_each(coalesce(flow->'requisitos','{}'::jsonb)) loop
  if r->>'estado'='revisado' and r->'evidencia'->>'tipo'='emision' and r->'evidencia'->>'referencia'<>new.id::text
   and exists(select 1 from public.fortius_inmuebles_formato_emissions m join public.fortius_inmuebles_formato_drafts x on x.id=m.draft_id
     where m.id::text=r->'evidencia'->>'referencia' and x.expediente_id=d.expediente_id and x.formato_id=d.formato_id
       and (m.draft_id=new.draft_id and m.draft_version<new.draft_version or m.draft_id<>new.draft_id and x.created_at<=d.created_at)) then
   flow:=jsonb_set(flow,array['requisitos',k],(r-'evidencia')||jsonb_build_object('estado','recibido'));
   moved:=moved||k;
  end if;
 end loop;
 if cardinality(moved)=0 then return null; end if;
 who:=current_setting('request.jwt.claim.sub',true);
 perform set_config('request.jwt.claim.sub',coalesce(auth.uid(),new.created_by)::text,true);
 -- Una corrección no retira la publicación (titular, 14/11/2026; lo aplica 20261114206000).
 perform set_config('fortius.version_nueva','1',true);
 update public.fortius_inmuebles_expedientes set flujo=flow,version=version+1 where id=e.id;
 perform set_config('fortius.version_nueva','',true);
 perform set_config('request.jwt.claim.sub',coalesce(who,''),true);
 insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by)
  values(e.id,'nota',left('Se emitió una versión nueva del formato '||d.formato_id||'; vuelve a revisar: '||array_to_string(moved,', '),1000),coalesce(auth.uid(),new.created_by));
 return null;
end; $$;
revoke all on function public.fortius_inmuebles_supersede_reviews() from public, anon, authenticated;

drop trigger if exists fortius_inmuebles_supersede_reviews on public.fortius_inmuebles_formato_emissions;
create trigger fortius_inmuebles_supersede_reviews after insert on public.fortius_inmuebles_formato_emissions
 for each row execute function public.fortius_inmuebles_supersede_reviews();

notify pgrst,'reload schema';
commit;
