-- Eliminar un prospecto o un cliente manda también sus tareas a Eliminados (titular, 15/11/2026).
-- Antes, una tarea que lo nombraba (leadId, clienteId) impedía borrarlo y la pantalla solo decía
-- «tiene referencias», aunque la ventana prometía «Podrás restaurarlo desde Eliminados». Ahora sus
-- tareas (abiertas o terminadas) se eliminan con él, la base guarda la copia de cada una ligada a la
-- eliminación del prospecto (deleted_with) y restaurarlo las devuelve juntas. Las demás referencias
-- (citas, notas, asuntos) siguen impidiendo el borrado como hasta hoy.
begin;
select pg_advisory_xact_lock(781023);

alter table public.fortius_inmuebles_record_history
  add column if not exists deleted_with uuid references public.fortius_inmuebles_record_history(id) on delete set null;
create index if not exists fortius_record_history_deleted_with on public.fortius_inmuebles_record_history(deleted_with) where deleted_with is not null;

create or replace function public.fortius_inmuebles_delete_record(p_collection text, p_id text, p_version bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare r public.fortius_inmuebles_records; tasks text[]; parent uuid;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
  if not public.fortius_inmuebles_is_staff() then raise sqlstate 'PT403' using message='Membresía requerida'; end if;
  if p_collection not in ('propiedades','asesores','leads','clientes','eventos','tareas','notas','posts','archivos','contenido','config','tramites') or p_version is null or p_version < 1 then raise sqlstate 'PT400' using message='Solicitud inválida'; end if;
  perform pg_advisory_xact_lock(781023);
  select * into r from public.fortius_inmuebles_records where collection=p_collection and id=p_id and version=p_version for update;
  if not found then raise sqlstate 'PT409' using message='El registro cambió; recarga antes de eliminar'; end if;
  -- Legacy external/local file URLs are references too, not only new storage paths.
  if p_collection='archivos' and exists(select 1 from public.fortius_inmuebles_records x where (x.collection,x.id) <> (r.collection,r.id)
    and ((length(coalesce(r.data->>'url','')) > 0 and position(r.data->>'url' in x.data::text)>0)
      or (length(coalesce(r.data->>'path','')) > 0 and position(r.data->>'path' in x.data::text)>0))) then
    raise sqlstate 'PT409' using message='El archivo tiene referencias; retíralas primero';
  end if;
  -- Un prospecto o cliente se va con sus tareas; los disparadores de cada tarea siguen revisando el acceso.
  if p_collection in ('leads','clientes') then
    select coalesce(array_agg(distinct x.source_id),'{}') into tasks from public.fortius_inmuebles_record_references x
      where x.target_collection=p_collection and x.target_id=p_id and x.source_collection='tareas';
    if cardinality(tasks) > 0 then
      delete from public.fortius_inmuebles_records where collection='tareas' and id=any(tasks);
    end if;
  end if;
  delete from public.fortius_inmuebles_records where collection=p_collection and id=p_id;
  if cardinality(coalesce(tasks,'{}')) > 0 then
    select id into parent from public.fortius_inmuebles_record_history
      where collection=p_collection and record_id=p_id and action='DELETE' order by created_at desc limit 1;
    update public.fortius_inmuebles_record_history set deleted_with=parent
      where collection='tareas' and record_id=any(tasks) and action='DELETE' and deleted_with is null and created_at >= now();
  end if;
  return true;
exception when foreign_key_violation or restrict_violation then raise sqlstate 'PT409' using message='El registro tiene referencias; retíralas primero';
end;$$;

create or replace function public.fortius_inmuebles_restore_record(p_history_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare h public.fortius_inmuebles_record_history; t public.fortius_inmuebles_record_history; d jsonb; result jsonb;
begin
  if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='Solo el administrador restaura registros'; end if;
  perform pg_advisory_xact_lock(781023);
  select * into h from public.fortius_inmuebles_record_history where id=p_history_id for update;
  if not found or h.action<>'DELETE' or h.restored_at is not null then raise sqlstate 'PT409' using message='La eliminación ya no está disponible'; end if;
  if h.collection not in ('propiedades','posts','notas','eventos','leads','clientes') then raise sqlstate 'PT400' using message='Esta colección no admite recuperación automática'; end if;
  if exists(select 1 from public.fortius_inmuebles_records where collection=h.collection and id=h.record_id)
    or exists(select 1 from public.fortius_inmuebles_record_history where collection=h.collection and record_id=h.record_id and created_at>h.created_at)
    then raise sqlstate 'PT409' using message='Existe un registro posterior; no se puede reemplazar'; end if;
  d:=h.snapshot;
  if h.collection='propiedades' then d:=jsonb_set(d,'{publicada}','false'); end if;
  if h.collection='posts' then d:=jsonb_set(d,'{estado}','"borrador"'); end if;
  -- Existing RPC keeps validation, references and monotonically increasing revisions.
  perform set_config('fortius.restaurando', 'on', true);
  result:=public.fortius_inmuebles_put_record(h.collection,h.record_id,d,null);
  -- Las tareas que se fueron con él regresan con él, salvo que alguien haya creado otra con el mismo id.
  for t in select * from public.fortius_inmuebles_record_history where deleted_with=h.id and restored_at is null order by created_at for update loop
    if not exists(select 1 from public.fortius_inmuebles_records where collection=t.collection and id=t.record_id)
      and not exists(select 1 from public.fortius_inmuebles_record_history where collection=t.collection and record_id=t.record_id and created_at>t.created_at) then
      perform public.fortius_inmuebles_put_record(t.collection,t.record_id,t.snapshot,null);
      update public.fortius_inmuebles_record_history set restored_at=clock_timestamp() where id=t.id;
    end if;
  end loop;
  perform set_config('fortius.restaurando', 'off', true);
  update public.fortius_inmuebles_record_history set restored_at=clock_timestamp() where id=h.id;
  return result;
end;$$;

commit;
