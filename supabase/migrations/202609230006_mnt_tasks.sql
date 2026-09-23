-- Private manual tasks. Apply after 005; no public projection or grants change.
begin;
select pg_advisory_xact_lock(781023);
lock table public.mnt_records in access exclusive mode;

alter table public.mnt_records drop constraint mnt_records_collection_check;
alter table public.mnt_records add constraint mnt_records_collection_check check (collection in ('propiedades','asesores','leads','clientes','eventos','tareas','notas','posts','archivos','contenido','config'));

create function public.mnt_validate_task(record_id text,d jsonb) returns void
language plpgsql set search_path='' as $$
declare k text; p jsonb; parsed_date date;
begin
  if d is null or jsonb_typeof(d) <> 'object' or octet_length(d::text)>250000
    or record_id is null or record_id !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
    or jsonb_typeof(d->'id') is distinct from 'string' or d->>'id' is distinct from record_id then
    raise sqlstate 'PT400' using message='Tarea inválida';
  end if;
  foreach k in array array['titulo','categoria','estado','prioridad'] loop
    if jsonb_typeof(d->k) is distinct from 'string' then raise sqlstate 'PT400' using message='Falta campo de tarea: '||k; end if;
  end loop;
  if length(btrim(d->>'titulo')) not between 1 and 160
    or d->>'categoria' not in ('captacion','leads','visitas','documentacion','comercializacion','negociacion','cierre','arrendamientos','mantenimiento','administracion')
    or d->>'estado' not in ('pendiente','en-curso','en-espera','completada','cancelada')
    or d->>'prioridad' not in ('baja','normal','alta','urgente') then raise sqlstate 'PT400' using message='Tarea inválida'; end if;
  foreach k in array array['descripcion','motivoEspera','nuevaNota','vence','asesorId','leadId','clienteId','propiedadSlug'] loop
    if d ? k and jsonb_typeof(d->k) is distinct from 'string' then raise sqlstate 'PT400' using message='Campo de tarea inválido: '||k; end if;
  end loop;
  if length(coalesce(d->>'descripcion',''))>20000 or length(coalesce(d->>'motivoEspera',''))>5000 or length(coalesce(d->>'nuevaNota',''))>5000
    or (d->>'estado'='en-espera' and length(btrim(coalesce(d->>'motivoEspera','')))=0) then raise sqlstate 'PT400' using message='Descripción, nota o motivo de espera inválido'; end if;
  foreach k in array array['asesorId','leadId','clienteId','propiedadSlug'] loop
    if coalesce(d->>k,'')<>'' and d->>k !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' then raise sqlstate 'PT400' using message='Referencia inválida'; end if;
  end loop;
  if coalesce(d->>'vence','')<>'' then
    if d->>'vence' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise sqlstate 'PT400' using message='Fecha inválida'; end if;
    begin
      parsed_date := (d->>'vence')::date;
      if to_char(parsed_date,'YYYY-MM-DD')<>d->>'vence' then raise sqlstate 'PT400' using message='Fecha inválida'; end if;
    exception when invalid_datetime_format or datetime_field_overflow then raise sqlstate 'PT400' using message='Fecha inválida'; end;
  end if;
  if d ? 'pasos' then
    if jsonb_typeof(d->'pasos') is distinct from 'array' then raise sqlstate 'PT400' using message='Pasos inválidos'; end if;
    if jsonb_array_length(d->'pasos')>100 then raise sqlstate 'PT400' using message='Demasiados pasos'; end if;
    for p in select value from jsonb_array_elements(d->'pasos') loop
      if jsonb_typeof(p) is distinct from 'object' or jsonb_typeof(p->'id') is distinct from 'string'
        or p->>'id' !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' or jsonb_typeof(p->'texto') is distinct from 'string'
        or length(btrim(p->>'texto')) not between 1 and 500 or jsonb_typeof(p->'hecho') is distinct from 'boolean' then raise sqlstate 'PT400' using message='Paso inválido'; end if;
    end loop;
    if exists(select 1 from jsonb_array_elements(d->'pasos') x group by x->>'id' having count(*)>1) then raise sqlstate 'PT400' using message='Paso duplicado'; end if;
  end if;
end;
$$;
revoke all on function public.mnt_validate_task(text,jsonb) from public,anon,authenticated,service_role;

-- Preserve function identities, SECURITY DEFINER settings and existing ACLs.
-- Fail transactionally if the expected baseline definitions have changed.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.mnt_validate_record(text,text,jsonb)'::regprocedure) into definition;
  definition := replace(definition,E'\r\n',E'\n');
  if position(E'begin\n' in definition)=0 then raise exception 'Unexpected validator definition'; end if;
  definition := replace(definition,E'begin\n',E'begin\n  if c=''tareas'' then perform public.mnt_validate_task(record_id,d); return; end if;\n');
  execute definition;
  select pg_get_functiondef('public.mnt_delete_record(text,text,bigint)'::regprocedure) into definition;
  if position('''eventos'',''notas''' in definition)=0 then raise exception 'Unexpected delete definition'; end if;
  execute replace(definition,'''eventos'',''notas''','''eventos'',''tareas'',''notas''');
end;
$$;

create function public.mnt_stamp_task() returns trigger
language plpgsql security definer set search_path='' as $$
declare stamp text := to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  history jsonb := '[]'::jsonb; actor jsonb; action text; note text; previous jsonb := '{}'::jsonb;
begin
  if new.collection<>'tareas' then return new; end if;
  perform public.mnt_validate_task(new.id,new.data);
  if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar una tarea'; end if;
  actor := jsonb_build_object('fecha',stamp,'actorId',auth.uid()::text);
  if tg_op='UPDATE' then previous := old.data; history := coalesce(old.data->'historial','[]'::jsonb); end if;
  action := case when tg_op='INSERT' then 'creada' when new.data->>'estado' is distinct from previous->>'estado' then 'estado' else 'actualizada' end;
  history := history || jsonb_build_array(actor || jsonb_build_object('accion',action) ||
    case when action='estado' then jsonb_build_object('texto',(previous->>'estado')||' → '||(new.data->>'estado')) else '{}'::jsonb end);
  note := btrim(coalesce(new.data->>'nuevaNota',''));
  if note<>'' then history := history || jsonb_build_array(actor || jsonb_build_object('accion','nota','texto',note)); end if;
  new.data := (new.data - array['historial','nuevaNota','creadoEl','actualizadoEl','completadoEl','completadoPor']) || jsonb_build_object(
    'descripcion',coalesce(new.data->>'descripcion',''),'pasos',coalesce(new.data->'pasos','[]'::jsonb),
    'creadoEl',coalesce(previous->>'creadoEl',stamp),'actualizadoEl',stamp,'historial',history);
  if new.data->>'estado'='completada' then
    new.data := new.data || jsonb_build_object('completadoEl',case when previous->>'estado'='completada' then coalesce(previous->>'completadoEl',stamp) else stamp end,
      'completadoPor',case when previous->>'estado'='completada' then coalesce(previous->>'completadoPor',auth.uid()::text) else auth.uid()::text end);
  end if;
  -- Never silently truncate audit entries. At the shared record size limit, reject
  -- atomically so the existing history and revision remain intact.
  if octet_length(new.data::text)>250000 then raise sqlstate 'PT400' using message='La tarea alcanzó el límite de historial; conserva este registro y crea una continuación'; end if;
  return new;
end;
$$;
revoke all on function public.mnt_stamp_task() from public,anon,authenticated,service_role;
create trigger mnt_task_history before insert or update on public.mnt_records
  for each row execute function public.mnt_stamp_task();
commit;
