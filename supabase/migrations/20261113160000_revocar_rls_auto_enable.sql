-- Aviso del asesor de seguridad de Supabase (13/11/2026): public.rls_auto_enable() es la función del
-- disparador de eventos `ensure_rls` que Supabase crea para activar RLS en cada tabla nueva. Es
-- SECURITY DEFINER y, por los permisos por defecto, anon y authenticated la tienen como ejecutable
-- en /rest/v1/rpc. Una función de disparador de eventos no se puede llamar directamente, así que no
-- hay riesgo práctico; se quita el permiso para que no quede expuesta ni aparezca en el asesor.
-- El disparador sigue funcionando: Postgres no revisa EXECUTE al dispararlo. No toca datos.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end; $$;

notify pgrst,'reload schema';
commit;
