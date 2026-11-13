-- COR-23 y DEC-43, segunda parte (12/11/2026): las revisiones que la matriz MRP-01 reserva al director
-- («quién revisa», aprobada el 26/10/2026) solo las marca él:
-- 1. Revisado o «no aplica» en lo jurídico (titularidad, factibilidad, revisión para cerrar), el precio,
--    los contratos (intermediación, contrato de renta, firma) y la autorización de publicar.
--    El asesor los deja «Lo tengo» (recibido) o anota un problema (observado); bajar una revisión sigue permitido.
-- 2. Tomar el encargo (decisión «aceptada» o «condicionada»). Pausar, rechazar, referir o cancelar
--    sigue en manos del asesor de la operación.
-- La firma del contrato ya era revisión del director (20261112120000_firma_del_contrato).
-- Corre después de la validación de la operación (fortius_01_…), con los requisitos ya combinados.
-- Las funciones del servidor sin sesión de usuario no cambian. No toca datos guardados.
begin;
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_guard_director_reviews() returns trigger
language plpgsql security definer set search_path='' as $$
declare k text; r jsonb; previous jsonb; before_resolution jsonb;
begin
 if auth.uid() is null or public.fortius_inmuebles_is_admin() or new.flujo is null then return new; end if;
 for k,r in select key,value from jsonb_each(coalesce(new.flujo->'requisitos','{}'::jsonb)) loop
  if k in ('titularidad','factibilidad','revision_cierre','precio','intermediacion','contrato_renta','firma','publicacion')
   and r->>'estado' in ('revisado','no_aplica') then
   previous := case when tg_op='UPDATE' then old.flujo->'requisitos'->k else null end;
   if previous is null or (r-'registradoPor'-'registradoEl') is distinct from (previous-'registradoPor'-'registradoEl') then
    raise sqlstate 'PT403' using message='Esta revisión la marca el director; déjala como «Lo tengo»';
   end if;
  end if;
 end loop;
 if new.flujo->'resolucion'->>'tipo' in ('aceptada','condicionada') then
  before_resolution := case when tg_op='UPDATE' then old.flujo->'resolucion' else null end;
  if new.flujo->'resolucion' is distinct from before_resolution then
   raise sqlstate 'PT403' using message='Tomar el encargo lo decide el director';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_director_reviews() from public, anon, authenticated;

drop trigger if exists fortius_02_guard_director_reviews on public.fortius_inmuebles_expedientes;
create trigger fortius_02_guard_director_reviews before insert or update on public.fortius_inmuebles_expedientes
 for each row execute function public.fortius_inmuebles_guard_director_reviews();

notify pgrst,'reload schema';
commit;
