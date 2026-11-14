-- Metodología M-01 y M-02 (auditoría del flujo, 14/11/2026). El inmueble publicado sale del sitio
-- cuando su captación deja de autorizar la publicación. Ya pasaba al pausar, descartar, cambiar el
-- contexto o retirar una revisión; faltaban dos casos:
-- 1. El contrato de intermediación termina, o se corrige y vuelve a quedar por revisar (RP-91: sin
--    contrato firmado, revisado y vigente no se publica).
-- 2. La operación se regresa a captación o documentación, antes de la publicación.
-- El retiro sigue la regla existente: solo si ninguna otra captación del inmueble está lista para
-- publicar. No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
  anchor text := $m$invalidate_publication:=(new.flujo ? 'resolucion'$m$;
begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 -- Ya aplicada: no se repite el reemplazo.
 if position('M-01' in definition)>0 then return;end if;
 if position(anchor in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_log_expediente_operation';end if;
 definition:=replace(definition,anchor,$m$invalidate_publication:=/* M-01 */ (public.fortius_inmuebles_signature_ok(old.flujo) and not public.fortius_inmuebles_signature_ok(new.flujo))
   /* M-02 */ or (new.etapa in ('captacion','documentacion') and old.etapa not in ('captacion','documentacion'))
   or (new.flujo ? 'resolucion'$m$);
 execute definition;
end; $$;

notify pgrst,'reload schema';
commit;
