-- SEG-M3 (auditoría del 13/11/2026): el inmueble que nace de la entrevista de captación tomaba la
-- ubicación que declaró el propietario como título y como «dirección aproximada». Si se publicaba
-- sin editarlo, la dirección exacta salía en el sitio, los metadatos, la ficha PDF y los mensajes.
-- 1. Al crearlo, título y dirección aproximada usan la zona; la ubicación exacta sigue en la
--    operación (expedientes.unidad), que no es pública.
-- 2. Al publicar (o guardar ya publicado), se rechaza si el título o la dirección aproximada
--    contienen la ubicación exacta de su operación.
-- No reescribe registros existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
  title_from text := $m$coalesce(nullif(address,''),nullif(btrim(p_answers->>'zona'),''),'Captación')$m$;
  approx_from text := $m$'direccionAproximada',coalesce(nullif(address,''),left(coalesce(nullif(btrim(p_answers->>'zona'),''),'Por definir'),500))$m$;
begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 -- Ya aplicada: no se repite el reemplazo.
 if position(title_from in definition)=0 and position(approx_from in definition)=0
   and position($m$coalesce(nullif(btrim(p_answers->>'zona'),''),'Captación')$m$ in definition)>0 then return;end if;
 if position(title_from in definition)=0 or position(approx_from in definition)=0
 then raise exception 'Unexpected intake function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,title_from,$m$coalesce(nullif(btrim(p_answers->>'zona'),''),'Captación')$m$);
 definition:=replace(definition,approx_from,$m$'direccionAproximada',left(coalesce(nullif(btrim(p_answers->>'zona'),''),'Por definir'),500)$m$);
 execute definition;
end; $$;

create function public.fortius_inmuebles_guard_private_address() returns trigger
language plpgsql security definer set search_path='' as $$
declare exact text;
begin
  if new.collection<>'propiedades' or coalesce(new.data->>'publicada','false')<>'true' then return new; end if;
  for exact in select lower(btrim(e.unidad)) from public.fortius_inmuebles_expedientes e
    where e.propiedad_slug=new.id and e.deleted_at is null and length(btrim(coalesce(e.unidad,'')))>=8 loop
    if position(exact in lower(coalesce(new.data->>'titulo','')))>0 or position(exact in lower(coalesce(new.data->>'direccionAproximada','')))>0 then
      raise sqlstate 'PT409' using message='El título o la dirección aproximada llevan la dirección exacta del inmueble; usa la zona antes de publicar';
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_private_address() from public, anon, authenticated, service_role;
create trigger fortius_02_guard_private_address before insert or update of data on public.fortius_inmuebles_records
for each row execute function public.fortius_inmuebles_guard_private_address();

notify pgrst,'reload schema';
commit;
