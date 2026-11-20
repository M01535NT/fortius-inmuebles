-- Panel · etapa 12, paso 1: las columnas que usaban una lista fija ahora se validan contra su catálogo
-- (20261118200000_panel_14_catalogos.sql). Se quitan los candados con la lista escrita y se pone una sola revisión:
--  · El valor tiene que existir en su catálogo (activo o no). Eso cuida la base como antes lo hacía la lista.
--  · Lo que la persona escribe desde el panel tiene que ser un valor que se ofrece (activo, o de los iniciales si la
--    lista se quedó vacía). Si la fila ya lo tenía, se conserva aunque se haya desactivado: desactivar no borra.
--  · «La persona» es cualquier escritura hecha con la sesión de alguien del equipo: directa desde el panel o dentro de
--    una función de la base que el equipo llama (crear un inmueble, continuar un asunto, abrir desde la consulta). Lo
--    que escribe sin sesión (el sitio, las tareas programadas, el servidor con su llave) solo tiene que existir.
--  · Una copia conserva lo que traía el original aunque se haya desactivado: la siguiente vez de una tarea que se
--    repite, un punto de la opinión que pasa al plan, continuar un asunto, unir fichas, copiar una guía, lo que ya venía
--    en la consulta al abrir el asunto, y los casos de ejemplo. Las funciones que copian lo avisan con una marca que
--    dura solo esa operación; las demás copias se reconocen por su original.
-- Columnas: asuntos (encargos, en qué va, resultado), inmuebles ligados (resultado), personas del asunto (papel),
-- tareas (cómo va y quién la hace), puntos de la opinión jurídica (quién lo hace), inmuebles (tipo) y consultas (por dónde llegó, el tipo de inmueble y el papel de las otras personas).
-- Los datos de prueba que ya hay usan solo valores de la lista: nada que corregir.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── La revisión ──────────────────────────────────────────────────────────────────────────────────────
-- Uso: before insert or update ... execute function fortius_inmuebles_valida_catalogos('papel', 'papel', ...)
-- (pares catálogo, columna; la columna puede ser texto o una lista de texto).
-- Quién escribe lo dice la sesión (auth.uid()), no el rol: así cuenta también lo que pasa por una función de la base.

-- ¿Esta fila es una copia que conserva lo del original? (ver arriba). Solo responde sí o no.
create function public.fortius_inmuebles_catalogo_conserva(p_tabla text, p_fila jsonb, p_col text, p_valor text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  asunto uuid;
  de text;
begin
  -- Marca de las funciones que copian (continuar un asunto, unir fichas, copiar una guía, abrir desde la consulta).
  if coalesce(current_setting('fortius_inmuebles.conserva_catalogos', true), '') = 'on' then return true; end if;
  -- Los casos de ejemplo conservan lo que trae el ejemplo.
  if coalesce(p_fila ->> 'es_ejemplo', '') = 'true' then return true; end if;
  if coalesce(p_fila ->> 'asunto_id', '') ~ '^[0-9a-f-]{36}$' then
    asunto := (p_fila ->> 'asunto_id')::uuid;
    if exists (select 1 from public.fortius_inmuebles_asuntos a where a.id = asunto and a.es_ejemplo) then return true; end if;
  end if;
  if p_tabla = 'fortius_inmuebles_tareas' then
    -- La siguiente vez de una tarea que se repite: lo que tenía la anterior.
    de := p_fila -> 'repetir' ->> 'de';
    if coalesce(de, '') ~ '^[0-9a-f-]{36}$' and exists (
         select 1 from public.fortius_inmuebles_tareas t where t.id = de::uuid and to_jsonb(t) -> p_col = to_jsonb(p_valor)) then
      return true;
    end if;
    -- Un punto de la opinión jurídica que pasa al plan: quién lo hace, como en el punto.
    if p_col = 'quien' and p_fila ->> 'origen' = 'opinion' and asunto is not null and exists (
         select 1 from public.fortius_inmuebles_opinion_puntos o
          where o.asunto_id = asunto and o.quien = p_valor and o.tarea_id is null and o.deleted_at is null) then
      return true;
    end if;
  end if;
  return false;
end; $$;
revoke all on function public.fortius_inmuebles_catalogo_conserva(text, jsonb, text, text) from public, anon, authenticated, service_role;

create function public.fortius_inmuebles_valida_catalogos() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  i integer := 0;
  cat text;
  col text;
  fila_n jsonb := to_jsonb(new);
  fila_v jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  nuevo jsonb;
  viejo jsonb;
  v text;
  de_persona boolean := (select auth.uid()) is not null;
begin
  while i + 1 < tg_nargs loop
    cat := tg_argv[i];
    col := tg_argv[i + 1];
    i := i + 2;
    nuevo := fila_n -> col;
    if nuevo is null or jsonb_typeof(nuevo) = 'null' then continue; end if;
    viejo := fila_v -> col;
    if viejo is not null and nuevo = viejo then continue; end if;
    for v in select x from jsonb_array_elements_text(
               case when jsonb_typeof(nuevo) = 'array' then nuevo else jsonb_build_array(nuevo) end) x loop
      if viejo is not null and (viejo = to_jsonb(v) or (jsonb_typeof(viejo) = 'array' and viejo ? v)) then continue; end if;
      if not public.fortius_inmuebles_catalogo_existe(cat, v) then
        raise sqlstate '22023' using message = format('«%s» no es una opción de %s', v, public.fortius_inmuebles_catalogo_nombre(cat));
      end if;
      if de_persona and not public.fortius_inmuebles_catalogo_acepta(cat, v)
         and not public.fortius_inmuebles_catalogo_conserva(tg_table_name, fila_n, col, v) then
        raise sqlstate '22023' using message = format('«%s» ya no se ofrece en %s', public.fortius_inmuebles_catalogo_etiqueta(cat, v),
                                                      public.fortius_inmuebles_catalogo_nombre(cat));
      end if;
    end loop;
  end loop;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_valida_catalogos() from public, anon, authenticated, service_role;

create function public.fortius_inmuebles_catalogo_existe(p_catalogo text, p_clave text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.fortius_inmuebles_catalogo_valores v where v.catalogo = p_catalogo and v.clave = p_clave);
$$;
revoke all on function public.fortius_inmuebles_catalogo_existe(text, text) from public, anon;
grant execute on function public.fortius_inmuebles_catalogo_existe(text, text) to authenticated, service_role;

create function public.fortius_inmuebles_catalogo_nombre(p_catalogo text) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select lower(c.nombre) from public.fortius_inmuebles_catalogos c where c.clave = p_catalogo), p_catalogo);
$$;
revoke all on function public.fortius_inmuebles_catalogo_nombre(text) from public, anon;
grant execute on function public.fortius_inmuebles_catalogo_nombre(text) to authenticated, service_role;

-- ── Fuera los candados con la lista escrita; entra la revisión contra el catálogo ────────────────────
alter table public.fortius_inmuebles_asuntos drop constraint if exists fortius_inmuebles_asuntos_encargos_check;
alter table public.fortius_inmuebles_asuntos drop constraint if exists fortius_inmuebles_asuntos_en_que_va_check;
alter table public.fortius_inmuebles_asuntos drop constraint if exists fortius_inmuebles_asuntos_resultado_check;
create trigger fortius_zy_catalogos before insert or update on public.fortius_inmuebles_asuntos
  for each row execute function public.fortius_inmuebles_valida_catalogos(
    'encargo', 'encargos', 'en_que_va', 'en_que_va', 'resultado_cierre', 'resultado');

alter table public.fortius_inmuebles_asunto_inmuebles drop constraint if exists fortius_inmuebles_asunto_inmuebles_resultado_check;
create trigger fortius_zy_catalogos before insert or update on public.fortius_inmuebles_asunto_inmuebles
  for each row execute function public.fortius_inmuebles_valida_catalogos('resultado_cierre', 'resultado');

alter table public.fortius_inmuebles_asunto_personas drop constraint if exists fortius_inmuebles_asunto_personas_papel_check;
create trigger fortius_zy_catalogos before insert or update on public.fortius_inmuebles_asunto_personas
  for each row execute function public.fortius_inmuebles_valida_catalogos('papel', 'papel');

alter table public.fortius_inmuebles_tareas drop constraint if exists fortius_inmuebles_tareas_estado_check;
alter table public.fortius_inmuebles_tareas drop constraint if exists fortius_inmuebles_tareas_quien_check;
create trigger fortius_zy_catalogos before insert or update on public.fortius_inmuebles_tareas
  for each row execute function public.fortius_inmuebles_valida_catalogos('estado_tarea', 'estado', 'quien_tarea', 'quien');

alter table public.fortius_inmuebles_opinion_puntos drop constraint if exists fortius_inmuebles_opinion_puntos_quien_check;
create trigger fortius_zy_catalogos before insert or update on public.fortius_inmuebles_opinion_puntos
  for each row execute function public.fortius_inmuebles_valida_catalogos('quien_tarea', 'quien');

alter table public.fortius_inmuebles_inmuebles drop constraint if exists fortius_inmuebles_inmuebles_tipo_check;
create trigger fortius_zy_catalogos before insert or update on public.fortius_inmuebles_inmuebles
  for each row execute function public.fortius_inmuebles_valida_catalogos('tipo_inmueble', 'tipo');

alter table public.fortius_inmuebles_consultas drop constraint if exists fortius_inmuebles_consultas_canal_check;
create trigger fortius_zy_catalogos before insert or update on public.fortius_inmuebles_consultas
  for each row execute function public.fortius_inmuebles_valida_catalogos('fuente', 'canal');

-- La consulta guarda el tipo de inmueble y los papeles de las otras personas dentro de sus datos; se revisan igual.
create function public.fortius_inmuebles_valida_consulta_catalogos() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  de_persona boolean := (select auth.uid()) is not null;
  fila jsonb := to_jsonb(new);
  t text := nullif(new.datos ->> 'tipo', '');
  x jsonb;
  p text;
begin
  if t is not null and (tg_op = 'INSERT' or t is distinct from nullif(old.datos ->> 'tipo', '')) then
    if not public.fortius_inmuebles_catalogo_existe('tipo_inmueble', t) then
      raise sqlstate '22023' using message = format('«%s» no es una opción de %s', t, public.fortius_inmuebles_catalogo_nombre('tipo_inmueble'));
    end if;
    if de_persona and not public.fortius_inmuebles_catalogo_acepta('tipo_inmueble', t)
       and not public.fortius_inmuebles_catalogo_conserva(tg_table_name, fila, 'datos', t) then
      raise sqlstate '22023' using message = format('«%s» ya no se ofrece en %s', public.fortius_inmuebles_catalogo_etiqueta('tipo_inmueble', t),
                                                    public.fortius_inmuebles_catalogo_nombre('tipo_inmueble'));
    end if;
  end if;
  for x in select * from jsonb_array_elements(case when jsonb_typeof(new.otras_personas) = 'array' then new.otras_personas else '[]'::jsonb end) loop
    p := nullif(x ->> 'papel', '');
    if p is null then continue; end if;
    if tg_op = 'UPDATE' and jsonb_typeof(old.otras_personas) = 'array'
       and exists (select 1 from jsonb_array_elements(old.otras_personas) o where o ->> 'papel' = p) then continue; end if;
    if not public.fortius_inmuebles_catalogo_existe('papel', p) then
      raise sqlstate '22023' using message = format('«%s» no es una opción de %s', p, public.fortius_inmuebles_catalogo_nombre('papel'));
    end if;
    if de_persona and not public.fortius_inmuebles_catalogo_acepta('papel', p)
       and not public.fortius_inmuebles_catalogo_conserva(tg_table_name, fila, 'otras_personas', p) then
      raise sqlstate '22023' using message = format('«%s» ya no se ofrece en %s', public.fortius_inmuebles_catalogo_etiqueta('papel', p),
                                                    public.fortius_inmuebles_catalogo_nombre('papel'));
    end if;
  end loop;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_valida_consulta_catalogos() from public, anon, authenticated, service_role;
create trigger fortius_zy_catalogos_datos before insert or update of datos, otras_personas on public.fortius_inmuebles_consultas
  for each row execute function public.fortius_inmuebles_valida_consulta_catalogos();

notify pgrst, 'reload schema';
commit;
