-- One atomic, private conversion per lead. Existing leads and clients are unchanged.
begin;
select pg_advisory_xact_lock(781023);

-- JSONB adds spacing to dense future fields. Reserve bounded server metadata
-- overhead for verified converted rows; keep every ordinary capture limit.
alter table public.mnt_records drop constraint mnt_records_data_check;
alter table public.mnt_records add constraint mnt_records_data_check check (
  jsonb_typeof(data)='object' and octet_length(data::text)<=case
    when (collection='clientes' and coalesce(data->>'leadId','')<>'')
      or (collection='leads' and coalesce(data->>'clienteId','')<>'') then 270336 else 262144 end
);
do $$
declare definition text;
begin
  select pg_get_functiondef('public.mnt_validate_record(text,text,jsonb)'::regprocedure) into definition;
  if position('octet_length(d::text) > 262144' in definition)=0 then raise exception 'Unexpected record size validator'; end if;
  execute replace(definition,'octet_length(d::text) > 262144',
    'octet_length(d::text) > (case when (c=''clientes'' and coalesce(d->>''leadId'','''')<>'''') or (c=''leads'' and coalesce(d->>''clienteId'','''')<>'''') then 270336 else 262144 end)');
end;
$$;

create table public.mnt_lead_conversions (
  lead_id text primary key,
  lead_collection text not null default 'leads' check (lead_collection='leads'),
  cliente_id text not null unique,
  cliente_collection text not null default 'clientes' check (cliente_collection='clientes'),
  converted_by uuid not null references auth.users(id) on delete restrict,
  converted_at timestamptz not null default clock_timestamp(),
  source_data jsonb not null check (jsonb_typeof(source_data)='object' and octet_length(source_data::text)<=262144),
  foreign key (lead_collection,lead_id) references public.mnt_records(collection,id) on delete restrict,
  -- The conversion receipt is inserted before the client in this transaction.
  foreign key (cliente_collection,cliente_id) references public.mnt_records(collection,id)
    on delete no action deferrable initially deferred
);
alter table public.mnt_lead_conversions enable row level security;
revoke all on public.mnt_lead_conversions from public,anon,authenticated,service_role;

create function public.mnt_guard_lead_conversion() returns trigger
language plpgsql security definer set search_path='' as $$
declare receipt public.mnt_lead_conversions; original jsonb; stamp text;
begin
  if new.collection not in ('leads','clientes') then return new; end if;
  if new.collection='leads' then
    select * into receipt from public.mnt_lead_conversions where lead_id=new.id;
  else
    select * into receipt from public.mnt_lead_conversions where cliente_id=new.id;
  end if;
  if receipt.lead_id is null then
    if (new.collection='leads' and new.data ?| array['clienteId','convertidoEl','convertidoPor'])
      or (new.collection='clientes' and new.data ?| array['leadId','leadOriginal','convertidoEl','convertidoPor']) then
      raise sqlstate 'PT403' using message='Solo la conversión verificada crea estos vínculos';
    end if;
    return new;
  end if;
  stamp := to_char(receipt.converted_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  if new.data->>'convertidoEl' is distinct from stamp
    or new.data->>'convertidoPor' is distinct from receipt.converted_by::text
    or (new.collection='leads' and new.data->>'clienteId' is distinct from receipt.cliente_id)
    or (new.collection='clientes' and new.data->>'leadId' is distinct from receipt.lead_id) then
    raise sqlstate 'PT403' using message='El vínculo de conversión es inmutable';
  end if;
  if new.collection='clientes' then
    original := public.mnt_pick(receipt.source_data,array['id','creadoEl','notas']);
    if new.data->'leadOriginal' is distinct from original then
      raise sqlstate 'PT403' using message='El historial de origen es inmutable';
    end if;
  end if;
  if new.collection='leads' and nullif(new.data->>'asesorId','') is distinct from
    nullif((select data->>'asesorId' from public.mnt_records where collection='clientes' and id=receipt.cliente_id),'') then
    raise sqlstate 'PT403' using message='Reasigna al asesor desde la ficha del cliente';
  end if;
  return new;
end;
$$;
revoke all on function public.mnt_guard_lead_conversion() from public,anon,authenticated,service_role;
create trigger mnt_guard_lead_conversion before insert or update on public.mnt_records
  for each row execute function public.mnt_guard_lead_conversion();

create function public.mnt_sync_converted_client_adviser() returns trigger
language plpgsql security definer set search_path='' as $$
declare source public.mnt_records;
begin
  if new.collection<>'clientes' or coalesce(new.data->>'leadId','')=''
    or new.data->>'asesorId' is not distinct from old.data->>'asesorId' then return new; end if;
  if not public.mnt_is_admin() then raise sqlstate 'PT403' using message='Solo el administrador reasigna'; end if;
  select * into source from public.mnt_records where collection='leads' and id=new.data->>'leadId' for update;
  perform public.mnt_put_record('leads',source.id,
    (source.data - 'asesorId') || case when coalesce(new.data->>'asesorId','')='' then '{}'::jsonb else jsonb_build_object('asesorId',new.data->>'asesorId') end,
    source.version);
  return new;
end;
$$;
revoke all on function public.mnt_sync_converted_client_adviser() from public,anon,authenticated,service_role;
create trigger mnt_sync_converted_client_adviser after update on public.mnt_records
  for each row execute function public.mnt_sync_converted_client_adviser();

create function public.mnt_convert_lead(p_lead_id text,p_version bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare source public.mnt_records; customer public.mnt_records; receipt public.mnt_lead_conversions;
  stamp text; client_data jsonb; client_result jsonb; lead_result jsonb;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
  if not public.mnt_is_staff() then raise sqlstate 'PT403' using message='Membresía requerida'; end if;
  if p_lead_id is null or p_lead_id !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
    or p_version is null or p_version not between 1 and 9007199254740991 then
    raise sqlstate 'PT400' using message='Solicitud inválida';
  end if;
  -- Same lock as every generic write: conversion and edits cannot interleave.
  perform pg_advisory_xact_lock(781023);
  select * into source from public.mnt_records where collection='leads' and id=p_lead_id for update;
  if source.id is null then raise sqlstate 'PT404' using message='Lead no encontrado'; end if;
  if not public.mnt_record_visible('leads',source.data) then raise sqlstate 'PT403' using message='Registro ajeno'; end if;
  select * into receipt from public.mnt_lead_conversions where lead_id=p_lead_id;
  if receipt.lead_id is not null then
    select * into customer from public.mnt_records where collection='clientes' and id=receipt.cliente_id;
    if not public.mnt_record_visible('clientes',customer.data) then raise sqlstate 'PT403' using message='Registro ajeno'; end if;
    -- An acknowledged retry never rewrites the client or its later edits.
    return jsonb_build_object('cliente',jsonb_build_object('id',customer.id,'data',customer.data,'version',customer.version,'createdAt',customer.created_at,'updatedAt',customer.updated_at),
      'lead',jsonb_build_object('id',source.id,'data',source.data,'version',source.version,'createdAt',source.created_at,'updatedAt',source.updated_at));
  end if;
  if source.version<>p_version then raise sqlstate 'PT409' using message='El lead cambió; recarga antes de convertir'; end if;
  insert into public.mnt_lead_conversions(lead_id,cliente_id,converted_by,source_data)
    values(p_lead_id,gen_random_uuid()::text,auth.uid(),source.data) returning * into receipt;
  stamp := to_char(receipt.converted_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  -- Preserve structured qualification and future fields. Original notes retain
  -- their IDs/dates in the immutable receipt. Only history is embedded in the
  -- client: do not duplicate long current fields and exceed capture limits.
  client_data := (source.data - array['estado','notas']) || jsonb_build_object(
    'id',receipt.cliente_id,'leadId',source.id,'leadOriginal',public.mnt_pick(source.data,array['id','creadoEl','notas']),
    'tipo',case source.data->'perfil'->>'operacion' when 'comprar' then 'comprador'
      when 'vender' then 'propietario' when 'rentar' then 'arrendatario'
      when 'arrendar' then 'arrendador' else 'otro' end,
    'notas','','creadoEl',stamp,'actualizadoEl',stamp,'convertidoEl',stamp,'convertidoPor',auth.uid()::text);
  client_result := public.mnt_put_record('clientes',receipt.cliente_id,client_data,null);
  lead_result := public.mnt_put_record('leads',source.id,source.data || jsonb_build_object(
    'clienteId',receipt.cliente_id,'convertidoEl',stamp,'convertidoPor',auth.uid()::text),p_version);
  return jsonb_build_object('cliente',client_result,'lead',lead_result);
end;
$$;
revoke all on function public.mnt_convert_lead(text,bigint) from public,anon,authenticated,service_role;
grant execute on function public.mnt_convert_lead(text,bigint) to authenticated;
notify pgrst,'reload schema';
commit;
