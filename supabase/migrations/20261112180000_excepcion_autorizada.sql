-- COR-20 y RP-31 (12/11/2026): el director autoriza avanzar sin un requisito.
-- 1. Cada requisito admite «excepcion» con un motivo de 10 a 1000 caracteres. El servidor anota quién
--    la autorizó y cuándo (autorizadoPor, autorizadoEl), y la operación la registra en su historial
--    como cualquier cambio de requisitos.
-- 2. Solo el director (administrador) la pone o la cambia; quitarla lo puede hacer quien atiende la
--    operación, porque vuelve a pedir el requisito.
-- 3. Nunca se aplica a los requisitos de protección (B-13, RP-96): titularidad, factibilidad, valor,
--    revisión para cerrar, firma y pago.
-- 4. Un requisito con excepción cuenta como cubierto para avanzar y para publicar. Una observación
--    abierta sigue deteniendo la etapa, y si cambia el inmueble, el cliente o el asesor, la excepción se pierde
--    igual que las revisiones.
-- No toca datos guardados.
begin;
select pg_advisory_xact_lock(781023);

-- La guía acepta el campo y lo descarta cuando cambia el contexto de la operación.
do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='''registradoPor'',''registradoEl'',''evidencia'',''bloquea'')';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'''registradoPor'',''registradoEl'',''evidencia'',''bloquea'',''excepcion'')');
 anchor:='then r:=jsonb_set(r,''{estado}'',''"recibido"''::jsonb); end if;';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,anchor||'
       r:=r-''excepcion'';');
 execute definition;
end; $$;

-- Un requisito con excepción válida cuenta como cubierto.
do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_review_ok(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='select coalesce((flow->''requisitos''->key->>''estado''=''revisado''';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_review_ok';end if;
 -- coalesce: sin excepción la condición da null, y «null or false» no debe dejar avanzar.
 definition:=replace(definition,anchor,'select coalesce(key not in (''titularidad'',''factibilidad'',''valor'',''revision_cierre'',''firma'',''pago'')
   and jsonb_typeof(flow->''requisitos''->key->''excepcion''->''motivo'')=''string''
   and length(btrim(flow->''requisitos''->key->''excepcion''->>''motivo''))>=10,false)
 or coalesce((flow->''requisitos''->key->>''estado''=''revisado''');
 execute definition;
end; $$;

-- Quién la pone, con qué motivo y en qué requisitos. Corre junto a las revisiones del director,
-- después de la validación de la operación (fortius_01_…), con los requisitos ya combinados.
create or replace function public.fortius_inmuebles_guard_director_reviews() returns trigger
language plpgsql security definer set search_path='' as $$
declare k text; r jsonb; previous jsonb; before_resolution jsonb; e jsonb; e_before jsonb;
begin
 if new.flujo is null then return new; end if;
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
