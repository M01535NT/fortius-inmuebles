-- Editorial metadata and first-publication dates. Existing articles are not rewritten.
begin;

create function public.mnt_stamp_post() returns trigger
language plpgsql set search_path = '' as $$
declare k text; previous jsonb := '{}'::jsonb;
  stamp text := to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if new.collection <> 'posts' then return new; end if;
  if tg_op='UPDATE' then previous := old.data; end if;
  if new.data ? 'categoria' and (jsonb_typeof(new.data->'categoria') is distinct from 'string'
    or new.data->>'categoria' not in ('comprar','vender','rentar','mercado','tramites')) then
    raise sqlstate 'PT400' using message='Tema editorial inválido';
  end if;
  if new.data ? 'formato' and (jsonb_typeof(new.data->'formato') is distinct from 'string'
    or new.data->>'formato' not in ('guia','actualidad')) then
    raise sqlstate 'PT400' using message='Tipo editorial inválido';
  end if;
  if new.data ? 'destacado' and jsonb_typeof(new.data->'destacado') is distinct from 'boolean' then
    raise sqlstate 'PT400' using message='Destacado inválido';
  end if;
  foreach k in array array['autor','ambito','fuenteNombre','fuenteUrl'] loop
    if new.data ? k and (jsonb_typeof(new.data->k) is distinct from 'string'
      or length(new.data->>k) > case when k='fuenteUrl' then 2048 else 500 end) then
      raise sqlstate 'PT400' using message='Campo editorial inválido: '||k;
    end if;
  end loop;
  if coalesce(new.data->>'fuenteUrl','')<>'' and
    (new.data->>'fuenteUrl' !~ '^https?://[^/[:space:]]+' or new.data->>'fuenteUrl' ~ '[[:cntrl:][:space:]\\]') then
    raise sqlstate 'PT400' using message='Enlace de fuente inválido';
  end if;
  new.data := (new.data - 'publicadoEl') || jsonb_build_object('actualizadoEl',stamp);
  if previous ? 'publicadoEl' then
    new.data := new.data || jsonb_build_object('publicadoEl',previous->'publicadoEl');
  elsif new.data->>'estado'='publicado' and previous->>'estado' is distinct from 'publicado' then
    new.data := new.data || jsonb_build_object('publicadoEl',stamp);
  end if;
  return new;
end;
$$;
revoke all on function public.mnt_stamp_post() from public,anon,authenticated,service_role;
create trigger mnt_post_editorial before insert or update on public.mnt_records
  for each row execute function public.mnt_stamp_post();

-- Extend the existing allowlist without changing function identity or grants.
do $migration$
declare original text; definition text;
begin
  select pg_get_functiondef('public.mnt_public_records(text)'::regprocedure) into original;
  definition := replace(original,
    $old$result:=public.mnt_pick(d,array['id','slug','titulo','resumen','contenido','estado','actualizadoEl']);$old$,
    $new$result:=public.mnt_pick(d,array['id','slug','titulo','resumen','contenido','estado','actualizadoEl','publicadoEl','categoria','formato','destacado','autor','ambito','fuenteNombre']);
      if public.mnt_public_url(d->>'fuenteUrl') then result:=result || jsonb_build_object('fuenteUrl',d->'fuenteUrl'); end if;$new$);
  if definition=original then raise exception 'Unexpected blog projection; migration not applied'; end if;
  execute definition;
end;
$migration$;
notify pgrst, 'reload schema';
commit;
