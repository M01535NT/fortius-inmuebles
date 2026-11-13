-- DEC-41 (titular 12/11/2026, excepción a RP-91): visita autorizada antes de la firma.
-- Un inmueble «En evaluación» se puede enseñar a un interesado concreto antes de firmar la
-- intermediación si el propietario firma una carta breve de autorización de visita (texto que
-- valida el abogado) y el director da el visto bueno con motivo. Sin publicar y sin mandar fotos
-- ni ficha. La guía acepta «visitasPrevias»: cada una con el interesado, la carta (archivo privado
-- que de verdad se subió) y el motivo; el servidor anota quién la autorizó y cuándo.
-- Solo el director la agrega, la cambia o la retira. No cambia datos existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_prior_visits(v jsonb,prev jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $body$
declare item jsonb; before_item jsonb; content jsonb; result jsonb:='[]'::jsonb;
 stamp text:=to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 v:=coalesce(v,'[]'::jsonb); prev:=coalesce(prev,'[]'::jsonb);
 if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>20 then raise sqlstate 'PT400' using message='Visitas antes de la firma inválidas';end if;
 if jsonb_typeof(prev)<>'array' then prev:='[]'::jsonb;end if;
 for item in select x from jsonb_array_elements(v) x loop
  if jsonb_typeof(item)<>'object'
   or exists(select 1 from jsonb_object_keys(item) x where x not in ('id','interesado','leadId','carta','motivo','autorizadoPor','autorizadoEl'))
   or jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id') not between 1 and 80
   or jsonb_typeof(item->'interesado') is distinct from 'string' or length(btrim(item->>'interesado')) not between 2 and 160
   or (item ? 'leadId' and (jsonb_typeof(item->'leadId')<>'string' or length(item->>'leadId')>160))
   or jsonb_typeof(item->'motivo') is distinct from 'string' or length(btrim(item->>'motivo')) not between 3 and 1000
   or jsonb_typeof(item->'carta') is distinct from 'object'
   or exists(select 1 from jsonb_object_keys(item->'carta') x where x not in ('path','nombre'))
   or jsonb_typeof(item->'carta'->'path') is distinct from 'string' or length(item->'carta'->>'path') not between 1 and 300
   or (item->'carta' ? 'nombre' and (jsonb_typeof(item->'carta'->'nombre')<>'string' or length(item->'carta'->>'nombre')>160)) then
   raise sqlstate 'PT400' using message='Para autorizar la visita indica el interesado, el motivo y la carta firmada del propietario';
  end if;
  if exists(select 1 from jsonb_array_elements(result) r where r->>'id'=item->>'id') then
   raise sqlstate 'PT400' using message='Visitas antes de la firma inválidas';
  end if;
  content:=item-'autorizadoPor'-'autorizadoEl';
  before_item:=null;
  select x into before_item from jsonb_array_elements(prev) x where x->>'id'=item->>'id' limit 1;
  if before_item is not null and content=(before_item-'autorizadoPor'-'autorizadoEl') then
   result:=result||jsonb_build_array(content||jsonb_build_object('autorizadoPor',before_item->'autorizadoPor','autorizadoEl',before_item->'autorizadoEl'));
  else
   if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para autorizar la visita';end if;
   if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='Solo el director autoriza una visita antes de la firma';end if;
   if not exists(select 1 from public.fortius_inmuebles_file_uploads u where u.bucket='fortius-inmuebles-private' and u.path=item->'carta'->>'path') then
    raise sqlstate 'PT409' using message='Adjunta la carta de autorización de visita firmada por el propietario';
   end if;
   result:=result||jsonb_build_array(content||jsonb_build_object('autorizadoPor',auth.uid()::text,'autorizadoEl',stamp));
  end if;
 end loop;
 -- Retirar una visita autorizada también es decisión del director.
 if exists(select 1 from jsonb_array_elements(prev) p where not exists(select 1 from jsonb_array_elements(result) r where r->>'id'=p->>'id'))
  and auth.uid() is not null and not public.fortius_inmuebles_is_admin() then
  raise sqlstate 'PT403' using message='Solo el director retira una visita autorizada';
 end if;
 return case when jsonb_array_length(result)=0 then null else result end;
end; $body$;
revoke all on function public.fortius_inmuebles_prior_visits(jsonb,jsonb) from public,anon,authenticated,service_role;

-- La guía acepta «visitasPrevias» y las valida antes que el resto.
do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='''firmaContrato'',''avaluo'',''cierre'',''heredado'')';
 if position(anchor in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'''firmaContrato'',''avaluo'',''cierre'',''heredado'',''visitasPrevias'')');
 anchor:='if exists(select 1 from jsonb_object_keys(new.flujo) key';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'if new.flujo ? ''visitasPrevias'' or (tg_op=''UPDATE'' and old.flujo ? ''visitasPrevias'') then
     new.flujo:=case when public.fortius_inmuebles_prior_visits(new.flujo->''visitasPrevias'',case when tg_op=''UPDATE'' then old.flujo->''visitasPrevias'' end) is null
       then new.flujo-''visitasPrevias''
       else jsonb_set(new.flujo,''{visitasPrevias}'',public.fortius_inmuebles_prior_visits(new.flujo->''visitasPrevias'',case when tg_op=''UPDATE'' then old.flujo->''visitasPrevias'' end)) end;
   end if;
   '||anchor);
 execute definition;
end; $$;

notify pgrst, 'reload schema';
commit;
