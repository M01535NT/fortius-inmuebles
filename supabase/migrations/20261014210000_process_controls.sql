-- Non-destructive process corrections. No historical records are rewritten.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- Extend the existing validator, retaining all unrelated validation rules.
do $$ declare definition text; old_rule text := '''disponible'',''apartada'''; begin
 select pg_get_functiondef('public.fortius_inmuebles_validate_record(text,text,jsonb)'::regprocedure) into definition;
 if position(old_rule in definition)=0 then raise exception 'Unexpected property state validator'; end if;
 execute replace(definition,old_rule,'''evaluacion'',''disponible'',''apartada''');
end; $$;

-- Private evaluation is neither commercial availability nor publication.
create function public.fortius_inmuebles_guard_evaluation_property() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.collection='propiedades' and new.data->>'estado'='evaluacion' and
   (new.data->>'publicada'='true' or coalesce(new.data->>'publicadaEl','')<>'') then
   raise sqlstate 'PT400' using message='Un inmueble en evaluación permanece privado y sin fecha de publicación';
 end if;
 return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_evaluation_property() from public,anon,authenticated,service_role;
create trigger fortius_02_guard_evaluation_property before insert or update of data on public.fortius_inmuebles_records
 for each row execute function public.fortius_inmuebles_guard_evaluation_property();

-- Do not update a corrected address with the previous interview's support.
-- Initial admission still links its property before advancing; corrections
-- replace the address and current review together after freezing the snapshot.
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 if position('if house is distinct from e.propiedad_slug or' in definition)=0 then raise exception 'Unexpected intake context update'; end if;
 definition:=replace(definition,'if house is distinct from e.propiedad_slug or (r.intencion in (''vender'',''arrendar'') and address<>'''' and e.unidad is distinct from address) then',
  'if (r.anterior_id is null or e.etapa=''captacion'') and (house is distinct from e.propiedad_slug or (r.intencion in (''vender'',''arrendar'') and address<>'''' and e.unidad is distinct from address)) then');
 definition:=replace(definition,'''asesorId'',r.asesor_id,''estado'',''disponible'',''publicadaEl'',to_char(stamp at time zone ''America/Tijuana'',''YYYY-MM-DD'')',
  '''asesorId'',r.asesor_id,''estado'',''evaluacion'',''publicadaEl'',''''');
 definition:=replace(definition,'set flujo=coalesce(flow,flujo),etapa=case when first_admission',
  'set unidad=case when r.intencion in (''vender'',''arrendar'') and address<>'''' then address else unidad end,flujo=coalesce(flow,flujo),etapa=case when first_admission');
 execute definition;
end; $$;

-- Publication authorization applies to every type and both transaction kinds.
-- A listing already public remains editable; withdrawing and republishing
-- requires a fresh authorization. This is an internal control, not a claim
-- that a single legal regime applies to every property.
create or replace function public.fortius_inmuebles_guard_guided_publication() returns trigger
language plpgsql security definer set search_path='' as $$
declare was_public boolean:=false;
begin
 if new.collection<>'propiedades' or new.data->>'publicada' is distinct from 'true' then return new; end if;
 if tg_op='UPDATE' then was_public:=old.data->>'publicada'='true' and old.data->>'operacion' is not distinct from new.data->>'operacion'; end if;
 if not coalesce(was_public,false) and not exists(select 1 from public.fortius_inmuebles_expedientes e
   where e.propiedad_slug=new.id and e.operacion=new.data->>'operacion' and public.fortius_inmuebles_can_access_expediente(e.id)
   and public.fortius_inmuebles_flow_publish_ready(e.id)) then
   raise sqlstate 'PT409' using message='Completa y autoriza la captación vinculada antes de publicar';
 end if;
 return new;
end; $$;

-- Temporary floor for legacy rent operations; the differentiated routes in
-- the next migration supply their requirements without changing old stages.
create function public.fortius_inmuebles_guard_rent_progress() returns trigger
language plpgsql security definer set search_path='' as $$
declare stages text[]:=array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'];
begin
 if new.operacion<>'renta' then return new; end if;
 if tg_op='INSERT' then
  if new.etapa<>'captacion' then raise sqlstate 'PT409' using message='El arrendamiento inicia en captación o perfil'; end if;
 elsif new.etapa is distinct from old.etapa then
  if array_position(stages,new.etapa)>array_position(stages,old.etapa)+1 then raise sqlstate 'PT409' using message='Avanza una etapa a la vez'; end if;
  if new.etapa not in ('captacion','documentacion') and new.flujo is null then raise sqlstate 'PT409' using message='Adopta la guía de arrendamiento y documenta sus revisiones antes de avanzar'; end if;
  if new.etapa='cerrado' and exists(select 1 from public.fortius_inmuebles_records t where t.collection='tareas' and t.data->>'expedienteId'=new.id::text and t.data->>'estado' not in ('completada','cancelada')) then raise sqlstate 'PT409' using message='Resuelve los pendientes antes de archivar'; end if;
 end if;
 return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_rent_progress() from public,anon,authenticated,service_role;
create trigger fortius_03_guard_rent_progress before insert or update on public.fortius_inmuebles_expedientes
 for each row execute function public.fortius_inmuebles_guard_rent_progress();

notify pgrst,'reload schema';
commit;
