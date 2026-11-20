-- Panel · «Recibir los documentos» se marca sola (19/11/2026).
--  1. Las tareas tienen `clave`: dice qué tarea es para que la base la reconozca aunque se le cambie el título. Por ahora
--     hay una: `recibir_documentos`. La pone la base a toda tarea de un asunto que nace con el título «Recibir los
--     documentos» (la del primer plan de una consulta, la de una guía de la Biblioteca o una escrita a mano). Lo que
--     mande la pantalla en ese campo al crear se respeta si es una clave válida; después no cambia.
--  2. Cuando en Documentos del asunto ya no queda ninguno en «falta» (se recibió, no aplica o se mandó a Eliminados),
--     la tarea `recibir_documentos` pendiente queda hecha, a nombre de quien hizo ese último cambio (el historial lo
--     dice). No se reabre sola si después se pide otro documento: nada frena, solo se anota.
-- Se puede volver a correr. No reescribe registros: las tareas que ya existen se quedan sin clave.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── 1. La clave de la tarea ───────────────────────────────────────────────────────────────────────────
alter table public.fortius_inmuebles_tareas add column if not exists clave text
  check (clave is null or clave ~ '^[a-z0-9][a-z0-9_-]{0,39}$');
create index if not exists fortius_inmuebles_tareas_asunto_clave
  on public.fortius_inmuebles_tareas (asunto_id, clave) where clave is not null and deleted_at is null;

create or replace function public.fortius_inmuebles_tarea_clave() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.clave := old.clave;
    return new;
  end if;
  if new.clave is null and new.asunto_id is not null
     and lower(regexp_replace(btrim(new.titulo), '\s+', ' ', 'g')) = 'recibir los documentos' then
    new.clave := 'recibir_documentos';
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_tarea_clave() from public, anon, authenticated, service_role;
drop trigger if exists fortius_00_clave on public.fortius_inmuebles_tareas;
create trigger fortius_00_clave before insert or update of clave on public.fortius_inmuebles_tareas
  for each row execute function public.fortius_inmuebles_tarea_clave();

-- ── 2. Sin documentos por recibir, la tarea queda hecha ──────────────────────────────────────────────
create or replace function public.fortius_inmuebles_documentos_ya_recibidos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.asunto_id is null then return null; end if;
  if exists (select 1 from public.fortius_inmuebles_asunto_documentos d
              where d.asunto_id = new.asunto_id and d.deleted_at is null and d.estado = 'falta') then
    return null;
  end if;
  update public.fortius_inmuebles_tareas set estado = 'hecha'
   where asunto_id = new.asunto_id and clave = 'recibir_documentos' and estado = 'pendiente' and deleted_at is null;
  return null;
end; $$;
revoke all on function public.fortius_inmuebles_documentos_ya_recibidos() from public, anon, authenticated, service_role;
drop trigger if exists fortius_zz_recibir_documentos on public.fortius_inmuebles_asunto_documentos;
create trigger fortius_zz_recibir_documentos after update of estado, deleted_at on public.fortius_inmuebles_asunto_documentos
  for each row when (old.estado is distinct from new.estado or old.deleted_at is distinct from new.deleted_at)
  execute function public.fortius_inmuebles_documentos_ya_recibidos();

notify pgrst, 'reload schema';
commit;
