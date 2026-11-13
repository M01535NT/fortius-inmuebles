-- SEG-B6 (auditoría del 13/11/2026): la regla de «URL pública» solo descartaba los buckets privado y
-- de carga, las rutas /api/admin/ y las URL firmadas. Dejaba pasar otros buckets privados
-- (expedientes, comercial, fortius-app-integrations), las lecturas autenticadas de Storage y los
-- enlaces de compartir de Apps (/api/apps/shared/<token>), que abren un archivo privado durante días.
-- Si alguien del personal pegaba uno en la galería, en documentos o en un enlace del sitio, quedaba
-- público. Ahora, de Storage solo pasa el bucket público de Fortius; también se descartan /api/apps/
-- y /api/auth/. Los enlaces externos (redes, fuentes del blog, videos, recorridos) no cambian.
-- La proyección pública y la vista del equipo dejan fuera lo que no pase; la configuración del sitio
-- rechaza guardarlo. No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_public_url(u text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(u ~ '^(https?://[^/[:space:]]+|/[^/])' and u !~ '[[:cntrl:]]'
    and u !~* '((cota|mnt|fortius-inmuebles)-(private|staging)|/api/(admin|apps|auth)/|/storage/v1/object/sign/)'
    and (u !~* '/storage/v1/(object|render/image)/' or u ~* '/storage/v1/(object|render/image)/public/fortius-inmuebles-public/'),false);
$$;

notify pgrst,'reload schema';
commit;
