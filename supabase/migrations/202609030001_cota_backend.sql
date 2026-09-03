-- Dedicated COTA project only. No seeds, users, email-based grants or platform links.
begin;

create table public.cota_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.cota_staff enable row level security;
revoke all on public.cota_staff from anon, authenticated;
grant select on public.cota_staff to authenticated;
create policy cota_staff_self on public.cota_staff for select to authenticated
  using (user_id = (select auth.uid()));

create function public.cota_is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.cota_staff where user_id = auth.uid() and active and role in ('admin','editor'));
$$;
revoke all on function public.cota_is_staff() from public;
grant execute on function public.cota_is_staff() to authenticated;

create table public.cota_records (
  collection text not null check (collection in ('propiedades','asesores','leads','clientes','eventos','notas','posts','archivos','contenido','config')),
  id text not null check (id ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 262144),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
alter table public.cota_records enable row level security;
revoke all on public.cota_records from anon, authenticated;
grant select on public.cota_records to authenticated;
create policy cota_records_staff_read on public.cota_records for select to authenticated
  using ((select public.cota_is_staff()));

-- Foreign keys protect references even when two staff members edit concurrently.
create table public.cota_record_references (
  source_collection text not null,
  source_id text not null,
  field text not null,
  target_collection text not null,
  target_id text not null,
  primary key (source_collection,source_id,field),
  foreign key (source_collection,source_id) references public.cota_records(collection,id) on delete cascade,
  foreign key (target_collection,target_id) references public.cota_records(collection,id) on delete restrict
);
create index cota_references_target on public.cota_record_references(target_collection,target_id);
alter table public.cota_record_references enable row level security;
revoke all on public.cota_record_references from anon, authenticated;

create table public.cota_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.cota_rate_limits enable row level security;
revoke all on public.cota_rate_limits from anon, authenticated;

-- DB validation is independent of the BFF. Authenticated direct RPC calls cannot
-- escape the collection, identity, size, mandatory field and enum contract.
create function public.cota_validate_record(c text, record_id text, d jsonb) returns void
language plpgsql set search_path = '' as $$
declare required_strings text[]; required_arrays text[] := '{}'; k text; v jsonb;
begin
  if c is null or c not in ('propiedades','asesores','leads','clientes','eventos','notas','posts','archivos','contenido','config')
    or record_id is null or record_id !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
    or d is null or jsonb_typeof(d) <> 'object' or octet_length(d::text) > 262144 then
    raise sqlstate 'PT400' using message = 'Registro inválido';
  end if;
  if c in ('contenido','config') then
    if record_id <> 'singleton' then raise sqlstate 'PT400' using message = 'Identificador singleton requerido'; end if;
  elsif coalesce(d->>case when c='propiedades' then 'slug' else 'id' end,'') <> record_id then
    raise sqlstate 'PT400' using message = 'Identificador incongruente';
  end if;
  required_strings := case c
    when 'propiedades' then array['slug','codigo','titulo','tipo','operacion','zona','direccionAproximada','asesorId','estado','publicadaEl']
    when 'asesores' then array['id','nombre','cargo','iniciales']
    when 'leads' then array['id','nombre','telefono','origen','estado','creadoEl']
    when 'clientes' then array['id','nombre','telefono','tipo','creadoEl','actualizadoEl']
    when 'eventos' then array['id','titulo','fecha','tipo']
    when 'notas' then array['id','titulo','texto','actualizadoEl']
    when 'posts' then array['id','slug','titulo','resumen','contenido','estado','actualizadoEl']
    when 'archivos' then array['id','nombre','url','tipo']
    when 'contenido' then array['heroTitulo','heroSubtitulo','manifiestoTitulo','manifiestoTexto','seoTitle','seoDescription']
    when 'config' then array['nombreComercial','telefono','whatsapp','email','horario','facebook','instagram','videoInstitucionalUrl'] end;
  foreach k in array required_strings loop
    if jsonb_typeof(d->k) is distinct from 'string' then raise sqlstate 'PT400' using message = 'Falta campo de texto: ' || k; end if;
  end loop;
  if c in ('asesores','leads','clientes') and length(btrim(d->>'nombre')) < 1 then raise sqlstate 'PT400' using message='Nombre requerido'; end if;
  if c='propiedades' then
    required_arrays := array['descripcion','amenidades','galeria','puntosDeInteres'];
    if d->>'tipo' not in ('casa','departamento','terreno','local','oficina','nave-industrial')
      or d->>'operacion' not in ('venta','renta') or d->>'estado' not in ('disponible','apartada','vendida')
      or jsonb_typeof(d->'precio') is distinct from 'object' or jsonb_typeof(d->'ficha') is distinct from 'object'
      or jsonb_typeof(d->'demo') is distinct from 'boolean' or jsonb_typeof(d->'destacada') is distinct from 'boolean'
      or jsonb_typeof(d->'creditoDisponible') is distinct from 'boolean'
      or (d ? 'publicada' and jsonb_typeof(d->'publicada') <> 'boolean')
      or coalesce(d->'precio'->>'modalidad','') not in ('publico','consulta') then
      raise sqlstate 'PT400' using message='Propiedad inválida';
    end if;
    if d->'precio'->>'modalidad'='publico' then
      if jsonb_typeof(d->'precio'->'monto') is distinct from 'number' or coalesce(d->'precio'->>'moneda','') not in ('MXN','USD') then raise sqlstate 'PT400' using message='Precio inválido'; end if;
      if (d->'precio'->>'monto')::numeric < 0 then raise sqlstate 'PT400' using message='Precio inválido'; end if;
    end if;
  elsif c='asesores' and jsonb_typeof(d->'activo') is distinct from 'boolean' then raise sqlstate 'PT400' using message='Estado de asesor inválido';
  elsif c='leads' then
    required_arrays := array['notas'];
    if d->>'origen' not in ('evaluar','contacto','interes-propiedad','checklist','documentos','manual')
      or d->>'estado' not in ('nuevo','contactado','en-evaluacion','activo','cerrado','descartado') then raise sqlstate 'PT400' using message='Lead inválido'; end if;
  elsif c='clientes' and d->>'tipo' not in ('propietario','comprador','arrendador','arrendatario','otro') then raise sqlstate 'PT400' using message='Tipo de cliente inválido';
  elsif c='eventos' and d->>'tipo' not in ('visita','llamada','firma','reunion','otro') then raise sqlstate 'PT400' using message='Tipo de evento inválido';
  elsif c='posts' and d->>'estado' not in ('borrador','publicado') then raise sqlstate 'PT400' using message='Estado de publicación inválido';
  elsif c='archivos' and d->>'tipo' not in ('imagen','pdf','video','otro') then raise sqlstate 'PT400' using message='Tipo de archivo inválido';
  end if;
  foreach k in array required_arrays loop
    if jsonb_typeof(d->k) is distinct from 'array' then raise sqlstate 'PT400' using message='Falta lista: ' || k; end if;
  end loop;
  if c='propiedades' then
    foreach k in array array['descripcion','amenidades'] loop
      if exists(select 1 from jsonb_array_elements(d->k) x where jsonb_typeof(x)<>'string') then raise sqlstate 'PT400' using message='Lista de texto inválida'; end if;
    end loop;
    foreach k in array array['terrenoM2','construccionM2','recamaras','banos','estacionamientos'] loop
      if d->'ficha' ? k then
        if jsonb_typeof(d->'ficha'->k)<>'number' then raise sqlstate 'PT400' using message='Superficie o cantidad inválida'; end if;
        if (d->'ficha'->>k)::numeric<0 then raise sqlstate 'PT400' using message='Cantidad negativa'; end if;
      end if;
    end loop;
    if d->'ficha' ? 'antiguedad' and jsonb_typeof(d->'ficha'->'antiguedad')<>'string' then raise sqlstate 'PT400' using message='Antigüedad inválida'; end if;
    if d->'precio' ? 'periodo' and d->'precio'->>'periodo'<>'mensual' then raise sqlstate 'PT400' using message='Periodo inválido'; end if;
    for v in select x from jsonb_array_elements(d->'galeria') x loop
      if jsonb_typeof(v)<>'object' or jsonb_typeof(v->'src') is distinct from 'string' or jsonb_typeof(v->'alt') is distinct from 'string' then raise sqlstate 'PT400' using message='Imagen inválida'; end if;
    end loop;
    for v in select x from jsonb_array_elements(d->'puntosDeInteres') x loop
      if jsonb_typeof(v)<>'object' or jsonb_typeof(v->'lugar') is distinct from 'string' or jsonb_typeof(v->'minutos') is distinct from 'number' then raise sqlstate 'PT400' using message='Punto de interés inválido'; end if;
    end loop;
    if d ? 'documentos' then
      if jsonb_typeof(d->'documentos')<>'array' then raise sqlstate 'PT400' using message='Documentos inválidos'; end if;
      for v in select x from jsonb_array_elements(d->'documentos') x loop
        foreach k in array array['codigo','nombre','descripcion','url'] loop
          if jsonb_typeof(v->k) is distinct from 'string' then raise sqlstate 'PT400' using message='Documento inválido'; end if;
        end loop;
      end loop;
    end if;
    foreach k in array array['videoUrl','tour360Url'] loop
      if d ? k and jsonb_typeof(d->k)<>'string' then raise sqlstate 'PT400' using message='Multimedia inválida'; end if;
    end loop;
  end if;
  if c='propiedades' and d->'publicada'='true'::jsonb and jsonb_array_length(d->'galeria')=0 then raise sqlstate 'PT400' using message='Publicar requiere galería'; end if;
end;
$$;

create function public.cota_sync_references(c text, record_id text, d jsonb) returns void
language plpgsql set search_path = '' as $$
declare f text; target text;
begin
  delete from public.cota_record_references where source_collection=c and source_id=record_id;
  foreach f in array array['asesorId','propiedadSlug','leadId','clienteId'] loop
    target := case f when 'asesorId' then 'asesores' when 'propiedadSlug' then 'propiedades' when 'leadId' then 'leads' else 'clientes' end;
    if coalesce(d->>f,'') <> '' then
      insert into public.cota_record_references values(c,record_id,f,target,d->>f);
    end if;
  end loop;
end;
$$;

create function public.cota_put_record(p_collection text,p_id text,p_data jsonb,p_version bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.cota_records;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
  if not public.cota_is_staff() then raise sqlstate 'PT403' using message='Membresía requerida'; end if;
  perform public.cota_validate_record(p_collection,p_id,p_data);
  if p_version is not null and p_version < 1 then raise sqlstate 'PT400' using message='Versión inválida'; end if;
  perform pg_advisory_xact_lock(781023);
  if p_version is null then
    insert into public.cota_records(collection,id,data) values(p_collection,p_id,p_data) returning * into r;
  else
    update public.cota_records set data=p_data, version=version+1, updated_at=clock_timestamp()
      where collection=p_collection and id=p_id and version=p_version returning * into r;
    if not found then raise sqlstate 'PT409' using message='El registro cambió; recarga antes de guardar'; end if;
  end if;
  perform public.cota_sync_references(p_collection,p_id,p_data);
  return jsonb_build_object('id',r.id,'data',r.data,'version',r.version,'createdAt',r.created_at,'updatedAt',r.updated_at);
exception
  when unique_violation then raise sqlstate 'PT409' using message='El registro ya existe';
  when foreign_key_violation then raise sqlstate 'PT400' using message='Referencia inexistente';
end;
$$;

create function public.cota_delete_record(p_collection text,p_id text,p_version bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare r public.cota_records;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
  if not public.cota_is_staff() then raise sqlstate 'PT403' using message='Membresía requerida'; end if;
  if p_collection not in ('propiedades','asesores','leads','clientes','eventos','notas','posts','archivos','contenido','config') or p_version is null or p_version < 1 then raise sqlstate 'PT400' using message='Solicitud inválida'; end if;
  perform pg_advisory_xact_lock(781023);
  select * into r from public.cota_records where collection=p_collection and id=p_id and version=p_version for update;
  if not found then raise sqlstate 'PT409' using message='El registro cambió; recarga antes de eliminar'; end if;
  -- Legacy external/local file URLs are references too, not only new storage paths.
  if p_collection='archivos' and exists(select 1 from public.cota_records x where (x.collection,x.id) <> (r.collection,r.id)
    and ((length(coalesce(r.data->>'url','')) > 0 and position(r.data->>'url' in x.data::text)>0)
      or (length(coalesce(r.data->>'path','')) > 0 and position(r.data->>'path' in x.data::text)>0))) then
    raise sqlstate 'PT409' using message='El archivo tiene referencias; retíralas primero';
  end if;
  delete from public.cota_records where collection=p_collection and id=p_id;
  return true;
exception when foreign_key_violation or restrict_violation then raise sqlstate 'PT409' using message='El registro tiene referencias; retíralas primero';
end;
$$;

create function public.cota_pick(d jsonb, keys text[]) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each(d) where key=any(keys);
$$;
create function public.cota_public_url(u text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(u ~ '^(https?://[^/[:space:]]+|/[^/])' and u !~ '[[:cntrl:]]'
    and u !~* '(cota-private|/api/admin/|/storage/v1/object/sign/)',false);
$$;

-- Public output is constructed from allowlists at EVERY nesting level. No table
-- SELECT grant to anon; this function is the only public data-reading surface.
create function public.cota_public_records(p_collection text) returns table(data jsonb)
language plpgsql stable security definer set search_path = '' as $$
declare d jsonb; result jsonb; k text;
begin
  if p_collection not in ('propiedades','asesores','contenido','config','posts') then return; end if;
  for d in select r.data from public.cota_records r where r.collection=p_collection
    and (p_collection in ('contenido','config') or (p_collection='propiedades' and r.data->'publicada'='true'::jsonb)
      or (p_collection='asesores' and r.data->'activo'='true'::jsonb) or (p_collection='posts' and r.data->>'estado'='publicado'))
    order by r.created_at desc, r.id loop
    if p_collection='propiedades' then
      result := public.cota_pick(d,array['slug','codigo','titulo','tipo','operacion','zona','direccionAproximada','descripcion','amenidades','asesorId','creditoDisponible','destacada','estado','publicadaEl','demo','publicada']);
      result := result || jsonb_build_object('precio',case when d->'precio'->>'modalidad'='consulta' then jsonb_build_object('modalidad','consulta') else public.cota_pick(d->'precio',array['modalidad','monto','moneda','periodo']) end,
        'ficha',public.cota_pick(d->'ficha',array['terrenoM2','construccionM2','recamaras','banos','estacionamientos','antiguedad']),
        'galeria',(select coalesce(jsonb_agg(public.cota_pick(v,array['src','alt'])),'[]'::jsonb) from jsonb_array_elements(d->'galeria') v where public.cota_public_url(v->>'src')),
        'puntosDeInteres',(select coalesce(jsonb_agg(public.cota_pick(v,array['lugar','minutos'])),'[]'::jsonb) from jsonb_array_elements(d->'puntosDeInteres') v),
        'documentos',(select coalesce(jsonb_agg(public.cota_pick(v,array['codigo','nombre','descripcion','url'])),'[]'::jsonb) from jsonb_array_elements(coalesce(d->'documentos','[]'::jsonb)) v where public.cota_public_url(v->>'url')));
      if public.cota_public_url(d->>'videoUrl') then result:=result || jsonb_build_object('videoUrl',d->'videoUrl'); end if;
      if public.cota_public_url(d->>'tour360Url') then result:=result || jsonb_build_object('tour360Url',d->'tour360Url'); end if;
      if jsonb_array_length(result->'galeria')=0 then continue; end if;
    elsif p_collection='asesores' then
      result:=public.cota_pick(d,array['id','nombre','cargo','iniciales','activo']);
    elsif p_collection='contenido' then
      result:=public.cota_pick(d,array['heroTitulo','heroSubtitulo','manifiestoTitulo','manifiestoTexto','seoTitle','seoDescription']);
    elsif p_collection='config' then
      result:=public.cota_pick(d,array['nombreComercial','telefono','whatsapp','email','horario','facebook','instagram','videoInstitucionalUrl']);
      foreach k in array array['facebook','instagram','videoInstitucionalUrl','whatsapp'] loop
        if not public.cota_public_url(d->>k) and not (k='whatsapp' and coalesce(d->>k,'') ~ '^[+]?[0-9 ()-]{7,40}$') then
          result:=result || jsonb_build_object(k,'');
        end if;
      end loop;
    else
      result:=public.cota_pick(d,array['id','slug','titulo','resumen','contenido','estado','actualizadoEl']);
    end if;
    data:=result; return next;
  end loop;
end;
$$;

create function public.cota_capture_lead(p_data jsonb,p_rate_key text) returns text
language plpgsql security definer set search_path = '' as $$
declare d jsonb; lead_id text := gen_random_uuid()::text; n integer; k text;
begin
  if p_rate_key is null or length(p_rate_key) not between 1 and 128 or p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>16384 then raise sqlstate 'PT400' using message='Solicitud inválida'; end if;
  if length(btrim(coalesce(p_data->>'nombre',''))) not between 1 and 160
    or length(coalesce(p_data->>'telefono','')) not between 7 and 40
    or coalesce(p_data->>'origen','') not in ('evaluar','contacto','interes_propiedad','interes-propiedad','checklist','documentos','manual') then raise sqlstate 'PT400' using message='Datos de contacto inválidos'; end if;
  perform pg_advisory_xact_lock(781023);
  delete from public.cota_rate_limits where window_start < now()-interval '2 hours';
  foreach k in array array['minute:'||p_rate_key,'hour:'||p_rate_key,'global:hour'] loop
    insert into public.cota_rate_limits(key,window_start,attempts) values(k,date_trunc(case when k like 'minute:%' then 'minute' else 'hour' end,now()),1)
      on conflict(key) do update set attempts=case when cota_rate_limits.window_start=excluded.window_start then cota_rate_limits.attempts+1 else 1 end,window_start=excluded.window_start
      returning attempts into n;
    if n > (case when k like 'minute:%' then 5 when k='global:hour' then 200 else 20 end) then raise sqlstate 'PT429' using message='Demasiadas solicitudes; inténtalo más tarde'; end if;
  end loop;
  d:=public.cota_pick(p_data,array['nombre','telefono','email','origen','propiedadSlug','zona','tipoPropiedad','mensaje']) || jsonb_build_object('id',lead_id,'estado','nuevo','notas','[]'::jsonb,'creadoEl',now(),
    'origen',case when p_data->>'origen'='interes_propiedad' then 'interes-propiedad' else p_data->>'origen' end);
  perform public.cota_validate_record('leads',lead_id,d);
  insert into public.cota_records(collection,id,data) values('leads',lead_id,d);
  perform public.cota_sync_references('leads',lead_id,d);
  return lead_id;
exception when foreign_key_violation then raise sqlstate 'PT400' using message='Referencia inexistente';
end;
$$;

-- Every function grant is explicit. Default PUBLIC execution would bypass the BFF.
revoke all on function public.cota_validate_record(text,text,jsonb), public.cota_sync_references(text,text,jsonb),
  public.cota_pick(jsonb,text[]), public.cota_public_url(text), public.cota_put_record(text,text,jsonb,bigint),
  public.cota_delete_record(text,text,bigint), public.cota_public_records(text), public.cota_capture_lead(jsonb,text) from public, anon, authenticated;
grant execute on function public.cota_put_record(text,text,jsonb,bigint), public.cota_delete_record(text,text,bigint) to authenticated;
grant execute on function public.cota_public_records(text) to anon, authenticated;
grant execute on function public.cota_capture_lead(jsonb,text) to service_role;
-- Project-level automatic grants may be disabled. Server-side provisioning is
-- explicitly privileged, never available through the general collection API.
grant all on public.cota_staff, public.cota_records, public.cota_record_references, public.cota_rate_limits to service_role;
grant execute on function public.cota_validate_record(text,text,jsonb), public.cota_sync_references(text,text,jsonb) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('cota-staging','cota-staging',false,20971520,array['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/webm']),
 ('cota-private','cota-private',false,20971520,array['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/webm']),
 ('cota-public','cota-public',true,20971520,array['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/webm']);
create policy cota_storage_read on storage.objects for select to authenticated
  using (bucket_id in ('cota-private','cota-public') and (select public.cota_is_staff()));
-- No client insert/update/delete policy. Only the authenticated BFF can create
-- final files after byte validation; direct signed uploads target private staging.
-- Uploaded final objects are immutable. Metadata deletion does not destroy bytes.
-- Future final-file cleanup needs an explicit reference audit.
commit;
