-- SEG-M2 (auditoría del 13/11/2026): el candado del arranque del propietario vivía solo en la ruta
-- del panel (operation-gates.ts). Con su propia sesión, un asesor podía mover su operación fuera de
-- captación por la API de datos sin la entrevista inicial (02), el levantamiento (04) ni el checklist
-- de documentos. Este disparador aplica la misma regla en la base, con las mismas palabras:
-- en una venta o renta del propietario (rutas «captacion» y «arrendador»), salir de captación exige
-- el 02 y el 04 emitidos en su versión vigente y el checklist completo («No aplica» con motivo cuenta).
-- El inventario heredado (COR-24) queda fuera, como en el panel.
-- No reescribe registros; solo rechaza el avance que falte.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_guard_initial_gate() returns trigger
language plpgsql security definer set search_path='' as $$
declare route text; pending text[] := array[]::text[]; steps jsonb; d record; emitted boolean;
begin
  if new.operacion not in ('venta','renta') or coalesce(new.flujo->'heredado','null'::jsonb) not in ('null'::jsonb,'false'::jsonb) then return new; end if;
  if coalesce(old.etapa,'captacion')<>'captacion' or coalesce(new.etapa,'captacion')='captacion' then return new; end if;
  route := coalesce(new.flujo->>'ruta', case when new.operacion='renta' then 'arrendador' else 'captacion' end);
  if route not in ('captacion','arrendador') then return new; end if;

  select r.data->'pasos' into steps from public.fortius_inmuebles_records r where r.collection='tareas' and r.id='checklist-'||new.id::text;
  if jsonb_typeof(steps) is distinct from 'array'
    or not exists(select 1 from jsonb_array_elements(steps) p where jsonb_typeof(p)='object')
    or exists(select 1 from jsonb_array_elements(steps) p where jsonb_typeof(p)='object'
      and coalesce(p->>'hecho','false')<>'true' and btrim(coalesce(p->>'noAplica',''))='') then
    pending := array_append(pending, 'Recibe los documentos del checklist');
  end if;

  for d in select x.prefix, x.label from (values ('02','Termina la entrevista inicial (02) y genera su PDF'),('04','Termina el levantamiento (04) y genera su PDF')) as x(prefix,label) loop
    select exists(select 1 from public.fortius_inmuebles_formato_emissions em where em.draft_id=f.id and em.draft_version=f.version) into emitted
    from public.fortius_inmuebles_formato_drafts f
    where f.expediente_id=new.id and (case when d.prefix='02' then f.formato_id='02' else f.formato_id like '04%' end)
    order by f.updated_at desc limit 1;
    if not coalesce(emitted,false) then pending := array_append(pending, d.label::text); end if;
  end loop;

  if cardinality(pending)>0 then
    raise sqlstate 'PT409' using message='Antes de avanzar: '||array_to_string(pending,'; ');
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_initial_gate() from public, anon, authenticated, service_role;
create trigger fortius_04_guard_initial_gate before update of etapa on public.fortius_inmuebles_expedientes
for each row execute function public.fortius_inmuebles_guard_initial_gate();

notify pgrst,'reload schema';
commit;
