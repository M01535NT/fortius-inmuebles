-- COR-23 y DEC-43 (decidida por el titular el 12/11/2026): qué escribe un asesor y qué solo el director.
-- La regla vive en la base para que valga por cualquier camino (panel, API o llamada directa al RPC):
-- 1. Configuración, Sitio web (contenido), Blog (posts) y Equipo (asesores) solo los cambia el director.
-- 2. Un asesor da de alta inmuebles solo a su nombre y edita o elimina solo los suyos.
-- 3. Reasignar el asesor de un inmueble, publicarlo y destacarlo en la portada lo hace solo el director.
--    Retirar la publicación sigue permitido al asesor del inmueble (el cierre y los controles lo hacen solos).
-- Las funciones del servidor sin sesión de usuario (captura pública) no cambian. No toca datos guardados.
begin;
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_guard_staff_scope() returns trigger
language plpgsql security definer set search_path='' as $$
declare target text; mine text; before_featured jsonb;
begin
 -- Sin usuario (servidor con service_role) o director: sin cambios.
 if auth.uid() is null or public.fortius_inmuebles_is_admin() then return coalesce(new, old); end if;
 if tg_op='DELETE' then target := old.collection; else target := new.collection; end if;
 if target in ('config','contenido','posts','asesores') then
  raise sqlstate 'PT403' using message='Solo el director cambia esta sección';
 end if;
 if target<>'propiedades' then return coalesce(new, old); end if;
 mine := public.fortius_inmuebles_current_asesor_id();
 if tg_op<>'INSERT' and (mine is null or old.data->>'asesorId' is distinct from mine) then
  raise sqlstate 'PT403' using message='Este inmueble es de otro asesor: solo él o el director lo cambian';
 end if;
 if tg_op='DELETE' then return old; end if;
 if tg_op='INSERT' and (mine is null or new.data->>'asesorId' is distinct from mine) then
  raise sqlstate 'PT403' using message='Da de alta el inmueble a tu nombre; el director asigna otros asesores';
 end if;
 if tg_op='UPDATE' and new.data->>'asesorId' is distinct from old.data->>'asesorId' then
  raise sqlstate 'PT403' using message='Solo el director reasigna el asesor de un inmueble';
 end if;
 if new.data->'publicada'='true'::jsonb and (tg_op='INSERT' or old.data->'publicada' is distinct from 'true'::jsonb) then
  raise sqlstate 'PT403' using message='Solo el director publica un inmueble';
 end if;
 before_featured := 'false'::jsonb;
 if tg_op='UPDATE' then before_featured := coalesce(old.data->'destacada','false'::jsonb); end if;
 if coalesce(new.data->'destacada','false'::jsonb) is distinct from before_featured then
  raise sqlstate 'PT403' using message='Solo el director destaca un inmueble en la portada';
 end if;
 return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_staff_scope() from public, anon, authenticated;

drop trigger if exists fortius_inmuebles_guard_staff_scope on public.fortius_inmuebles_records;
create trigger fortius_inmuebles_guard_staff_scope before insert or update or delete on public.fortius_inmuebles_records
 for each row execute function public.fortius_inmuebles_guard_staff_scope();

notify pgrst,'reload schema';
commit;
