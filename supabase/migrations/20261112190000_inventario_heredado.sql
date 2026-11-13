-- COR-24 (12/11/2026): alta del inventario que un asesor trae con contrato ya firmado.
-- La operación lleva la marca «heredado» con la fecha desde la que el inmueble está con Fortius.
-- Solo el director la pone, la cambia o la quita; el servidor anota quién y cuándo.
-- Con la decisión del titular del 12/11/2026, la marca no salta ninguna protección: titularidad,
-- factibilidad y valor se revisan antes de publicar (RP-96), y el contrato se registra como
-- cualquier firma. Lo demás (entrevista, levantamiento y plan) se cubre con excepciones (COR-20).
-- No toca datos guardados.
begin;
select pg_advisory_xact_lock(781023);

do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='''firmaContrato'',''avaluo'',''cierre'')';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'''firmaContrato'',''avaluo'',''cierre'',''heredado'')');
 execute definition;
end; $$;

create or replace function public.fortius_inmuebles_guard_director_reviews() returns trigger
language plpgsql security definer set search_path='' as $$
declare k text; r jsonb; previous jsonb; before_resolution jsonb; e jsonb; e_before jsonb; h jsonb; h_before jsonb;
begin
 if new.flujo is null then return new; end if;

 -- COR-24: la marca de inventario heredado solo la pone, cambia o quita el director.
 h := new.flujo->'heredado';
 h_before := case when tg_op='UPDATE' then old.flujo->'heredado' else null end;
 if h is not null then
  if jsonb_typeof(h)<>'object' or exists(select 1 from jsonb_object_keys(h) x where x not in ('desde','registradoPor','registradoEl'))
   or coalesce(h->>'desde','') !~ '^\d{4}-\d{2}-\d{2}$' then
   raise sqlstate 'PT400' using message='Inventario heredado inválido';
  end if;
  perform (h->>'desde')::date;
 end if;
 if (h-'registradoPor'-'registradoEl') is distinct from (h_before-'registradoPor'-'registradoEl') then
  if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar inventario heredado'; end if;
  if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='El inventario heredado lo registra el director'; end if;
  if h is not null then
   new.flujo := jsonb_set(new.flujo,'{heredado}',(h-'registradoPor'-'registradoEl')||jsonb_build_object('registradoPor',auth.uid(),'registradoEl',clock_timestamp()));
  end if;
 elsif h is not null then
  new.flujo := jsonb_set(new.flujo,'{heredado}',h_before);
 end if;
 for k,r in select key,value from jsonb_each(coalesce(new.flujo->'requisitos','{}'::jsonb)) loop
  previous := case when tg_op='UPDATE' then old.flujo->'requisitos'->k else null end;
  if r ? 'excepcion' then
   e := r->'excepcion';
   e_before := previous->'excepcion';
   if jsonb_typeof(e)<>'object' or exists(select 1 from jsonb_object_keys(e) x where x not in ('motivo','autorizadoPor','autorizadoEl'))
    or jsonb_typeof(e->'motivo') is distinct from 'string' or length(btrim(e->>'motivo')) not between 10 and 1000 then
    raise sqlstate 'PT400' using message='Escribe el motivo de la excepción (al menos 10 caracteres)';
   end if;
   if k in ('titularidad','factibilidad','valor','revision_cierre','firma','pago') then
    raise sqlstate 'PT400' using message='Este requisito protege al cliente y no admite excepción';
   end if;
   if e_before is null or (e-'autorizadoPor'-'autorizadoEl') is distinct from (e_before-'autorizadoPor'-'autorizadoEl') then
    if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para autorizar una excepción'; end if;
    if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='Solo el director autoriza una excepción'; end if;
    e := (e-'autorizadoPor'-'autorizadoEl') || jsonb_build_object('autorizadoPor',auth.uid(),'autorizadoEl',clock_timestamp());
   else
    e := e_before;
   end if;
   new.flujo := jsonb_set(new.flujo,array['requisitos',k,'excepcion'],e);
  end if;
  if auth.uid() is not null and not public.fortius_inmuebles_is_admin()
   and k in ('titularidad','factibilidad','revision_cierre','precio','intermediacion','contrato_renta','firma','publicacion')
   and r->>'estado' in ('revisado','no_aplica') then
   if previous is null or (r-'registradoPor'-'registradoEl'-'excepcion') is distinct from (previous-'registradoPor'-'registradoEl'-'excepcion') then
    raise sqlstate 'PT403' using message='Esta revisión la marca el director; déjala como «Lo tengo»';
   end if;
  end if;
 end loop;
 if auth.uid() is not null and not public.fortius_inmuebles_is_admin() and new.flujo->'resolucion'->>'tipo' in ('aceptada','condicionada') then
  before_resolution := case when tg_op='UPDATE' then old.flujo->'resolucion' else null end;
  if new.flujo->'resolucion' is distinct from before_resolution then
   raise sqlstate 'PT403' using message='Tomar el encargo lo decide el director';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_director_reviews() from public, anon, authenticated;

notify pgrst,'reload schema';
commit;
