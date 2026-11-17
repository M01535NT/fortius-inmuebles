-- Inmuebles del panel nuevo · interruptor «Dirección exacta» (boceto 16/11/2026, DECISIONES «Inmuebles», función 9).
-- Apagado (y por defecto, como hoy): el sitio muestra la colonia, la zona y la referencia que escribió el asesor
-- en `direccionAproximada`; nunca calle ni número. Encendido: la proyección pública pone la dirección completa
-- (`direccionCompleta`, dato privado del registro) en lugar de la referencia. Nada más sale al sitio.
-- Sin aplicar: se aplica al integrar en main, como las demás.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $migration$
declare original text; definition text; root_marker text := 'if jsonb_typeof(d->''informacionPublica'')=''object'' then';
begin
  select pg_get_functiondef('public.fortius_inmuebles_public_records(text)'::regprocedure) into original;
  if original is null or position(root_marker in original)=0 then raise exception 'Unexpected property projection; migration not applied'; end if;
  if position('direccionCompleta' in original)>0 then raise exception 'Dirección exacta ya está en la proyección; migration not applied'; end if;
  definition := replace(original, root_marker, $new$if d->'direccionExacta'='true'::jsonb and jsonb_typeof(d->'direccionCompleta')='string'
        and length(btrim(d->>'direccionCompleta')) between 3 and 200 then
        result := result || jsonb_build_object('direccionAproximada',btrim(d->>'direccionCompleta'));
      end if;
      $new$ || root_marker);
  if definition = original then raise exception 'Unexpected property projection; migration not applied'; end if;
  execute definition;
end;
$migration$;

notify pgrst,'reload schema';
commit;
