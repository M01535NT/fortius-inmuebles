-- Panel · etapa 12, paso 1: los catálogos (SPEC.md, sección 3, «Configuración y catálogos»).
-- Las listas del panel dejan de estar escritas en el programa: viven aquí, cada valor con su clave fija (lo que se
-- guarda en los asuntos y no cambia nunca), su etiqueta (lo que se ve y el director renombra), su orden, si está activo
-- y, cuando hace falta, lo que significa para el sistema (un resultado de cierre es logrado o no; un papel es de uno de
-- los cuatro lados, que son los grupos de Personas; un tipo de inmueble dice cómo sale en el sitio).
--  · Solo el director agrega, renombra, reordena y desactiva; todo el equipo lee (las listas desplegables lo necesitan).
--  · Desactivar no borra: deja de ofrecerse y lo que ya lo usa lo conserva. Nadie borra un valor.
--  · Los valores de sistema (los que el panel usa por su clave) se renombran, pero no se desactivan.
--  · Las listas fijas (en qué va un asunto, cómo va una tarea) no admiten valores nuevos: solo se renombran.
--  · Funciones del equipo: solo se crea y se siembra; asignarlas a cada persona llega después.
--  · Si una lista se queda sin ningún valor activo, se ofrecen los valores con que empezó (columna «inicial»).
--  · Cada cambio queda en el historial, con quién y cuándo, y se guarda con versión (conflicto 409).
-- Aditivo: tablas nuevas. Las columnas que ya usan estas listas pasan a validarse contra el catálogo en la migración
-- siguiente (20261118200100).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── Los catálogos ─────────────────────────────────────────────────────────────────────────────────────
-- Qué listas hay y qué reglas tiene cada una. Lo pone el programa (estas migraciones); nadie lo cambia desde el panel.
create table public.fortius_inmuebles_catalogos (
  clave text primary key check (clave ~ '^[a-z][a-z0-9_]{1,39}$'),
  nombre text not null check (length(btrim(nombre)) between 1 and 80),
  ayuda text not null default '' check (length(ayuda) <= 300),
  orden integer not null default 0,
  fijo boolean not null default false,          -- no admite valores nuevos (en qué va, cómo va una tarea)
  significado_nombre text check (length(significado_nombre) <= 80),   -- «Grupo en Personas», «Cuenta como»…
  significados jsonb not null default '[]'      -- [{clave, etiqueta}]: lo que puede significar cada valor
    check (jsonb_typeof(significados) = 'array'),
  padre text references public.fortius_inmuebles_catalogos (clave) on delete restrict,   -- subtipos: de qué tipo
  en_pantalla boolean not null default true      -- falso: ya existe, pero ninguna pantalla lo usa todavía
);
alter table public.fortius_inmuebles_catalogos enable row level security;
revoke all on public.fortius_inmuebles_catalogos from anon, authenticated;
grant select on public.fortius_inmuebles_catalogos to authenticated;
grant all on public.fortius_inmuebles_catalogos to service_role;
create policy catalogos_read on public.fortius_inmuebles_catalogos
  for select to authenticated using ((select public.fortius_inmuebles_is_staff()));

-- ── Los valores ───────────────────────────────────────────────────────────────────────────────────────
create table public.fortius_inmuebles_catalogo_valores (
  id uuid primary key default gen_random_uuid(),
  catalogo text not null references public.fortius_inmuebles_catalogos (clave) on delete restrict,
  clave text not null check (clave ~ '^[a-z0-9][a-z0-9_]{0,39}$'),   -- lo que se guarda; no cambia
  etiqueta text not null check (length(btrim(etiqueta)) between 1 and 80),
  orden integer not null default 0,
  activo boolean not null default true,
  significado text check (significado ~ '^[a-z0-9][a-z0-9_-]{0,39}$'),
  padre text check (padre ~ '^[a-z0-9][a-z0-9_]{0,39}$'),            -- en los subtipos: la clave del tipo
  de_sistema boolean not null default false,    -- el panel lo usa por su clave: se renombra, no se desactiva
  inicial boolean not null default false,       -- vino con el panel: se ofrece si la lista se queda vacía
  etiqueta_inicial text check (length(etiqueta_inicial) <= 80),
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalogo, clave)
);
create index on public.fortius_inmuebles_catalogo_valores (catalogo, orden);
alter table public.fortius_inmuebles_catalogo_valores enable row level security;
revoke all on public.fortius_inmuebles_catalogo_valores from anon, authenticated;
grant select on public.fortius_inmuebles_catalogo_valores to authenticated;
grant insert (catalogo, clave, etiqueta, orden, activo, significado, padre) on public.fortius_inmuebles_catalogo_valores to authenticated;
grant update (etiqueta, orden, activo, significado, padre, version) on public.fortius_inmuebles_catalogo_valores to authenticated;
grant all on public.fortius_inmuebles_catalogo_valores to service_role;
-- Todo el equipo lee (las listas desplegables); solo el director escribe. Nadie borra.
create policy catalogo_valores_read on public.fortius_inmuebles_catalogo_valores
  for select to authenticated using ((select public.fortius_inmuebles_is_staff()));
create policy catalogo_valores_insert on public.fortius_inmuebles_catalogo_valores
  for insert to authenticated with check ((select public.fortius_inmuebles_is_admin()));
create policy catalogo_valores_update on public.fortius_inmuebles_catalogo_valores
  for update to authenticated using ((select public.fortius_inmuebles_is_admin())) with check ((select public.fortius_inmuebles_is_admin()));

-- Reglas de cada valor. Solo se rechaza lo que rompería el panel; lo demás se deja.
create function public.fortius_inmuebles_guard_catalogo_valor() returns trigger
language plpgsql security definer set search_path = '' as $$
declare cat public.fortius_inmuebles_catalogos;
begin
  select * into cat from public.fortius_inmuebles_catalogos where clave = new.catalogo;
  if not found then
    raise sqlstate '22023' using message = 'Esa lista no existe';
  end if;
  new.etiqueta := btrim(new.etiqueta);
  if tg_op = 'INSERT' then
    -- Lo que llega desde el panel es siempre un valor nuevo del director: ni de sistema ni de los iniciales.
    if auth.uid() is not null then
      new.de_sistema := false;
      new.inicial := false;
      new.etiqueta_inicial := null;
      if cat.fijo then
        raise sqlstate '22023' using message = 'Esta lista no admite valores nuevos; sus valores se pueden renombrar';
      end if;
      new.orden := coalesce((select max(orden) + 10 from public.fortius_inmuebles_catalogo_valores where catalogo = new.catalogo), 10);
    end if;
    if exists (select 1 from public.fortius_inmuebles_catalogo_valores v
                where v.catalogo = new.catalogo and lower(v.etiqueta) = lower(new.etiqueta)) then
      raise sqlstate '22023' using message = 'Ya hay un valor con ese nombre en esta lista';
    end if;
  else
    if new.catalogo <> old.catalogo or new.clave <> old.clave or new.de_sistema <> old.de_sistema
       or new.inicial <> old.inicial or new.etiqueta_inicial is distinct from old.etiqueta_inicial then
      raise sqlstate '22023' using message = 'La clave de un valor no cambia';
    end if;
    if old.de_sistema and not new.activo then
      raise sqlstate '22023' using message = 'El panel usa este valor: se puede renombrar, pero no desactivar';
    end if;
    if old.de_sistema and new.significado is distinct from old.significado then
      raise sqlstate '22023' using message = 'Lo que significa este valor lo usa el panel y no cambia';
    end if;
    if new.etiqueta <> old.etiqueta and exists (
         select 1 from public.fortius_inmuebles_catalogo_valores v
          where v.catalogo = new.catalogo and v.id <> new.id and lower(v.etiqueta) = lower(new.etiqueta)) then
      raise sqlstate '22023' using message = 'Ya hay un valor con ese nombre en esta lista';
    end if;
  end if;
  -- Lo que significa: obligatorio si la lista lo pide, y solo uno de los que la lista conoce.
  if jsonb_array_length(cat.significados) > 0 then
    if new.significado is null then
      raise sqlstate '22023' using message = 'Elige ' || lower(coalesce(cat.significado_nombre, 'qué significa')) || ' para este valor';
    end if;
    if not exists (select 1 from jsonb_array_elements(cat.significados) s where s->>'clave' = new.significado) then
      raise sqlstate '22023' using message = 'Ese significado no es de esta lista';
    end if;
  else
    new.significado := null;
  end if;
  -- De qué tipo es un subtipo: un valor del catálogo padre.
  if cat.padre is not null then
    if new.padre is not null and not exists (
         select 1 from public.fortius_inmuebles_catalogo_valores v where v.catalogo = cat.padre and v.clave = new.padre) then
      raise sqlstate '22023' using message = 'Ese tipo no existe';
    end if;
  else
    new.padre := null;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_catalogo_valor() from public, anon, authenticated, service_role;

create trigger fortius_aa_guard before insert or update on public.fortius_inmuebles_catalogo_valores
  for each row execute function public.fortius_inmuebles_guard_catalogo_valor();
create trigger fortius_version before update on public.fortius_inmuebles_catalogo_valores
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_solo_agregar before delete on public.fortius_inmuebles_catalogo_valores
  for each row execute function public.fortius_inmuebles_solo_agregar();

-- ── Lo que usan las demás tablas y funciones ─────────────────────────────────────────────────────────
-- ¿Se puede guardar este valor? Si está activo, sí. Si la lista se quedó sin ninguno activo, también los iniciales
-- (son los que la pantalla ofrece en ese caso). Lo que una fila ya tenía lo revisa quien llama (se conserva).
create function public.fortius_inmuebles_catalogo_acepta(p_catalogo text, p_clave text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.fortius_inmuebles_catalogo_valores v
                  where v.catalogo = p_catalogo and v.clave = p_clave and v.activo)
      or (not exists (select 1 from public.fortius_inmuebles_catalogo_valores v where v.catalogo = p_catalogo and v.activo)
          and exists (select 1 from public.fortius_inmuebles_catalogo_valores v
                       where v.catalogo = p_catalogo and v.clave = p_clave and v.inicial));
$$;
revoke all on function public.fortius_inmuebles_catalogo_acepta(text, text) from public, anon;
grant execute on function public.fortius_inmuebles_catalogo_acepta(text, text) to authenticated, service_role;

-- La etiqueta de un valor, para los textos que arma la base («Llegó por WhatsApp»). Si no está, la clave.
create function public.fortius_inmuebles_catalogo_etiqueta(p_catalogo text, p_clave text) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select v.etiqueta from public.fortius_inmuebles_catalogo_valores v
                    where v.catalogo = p_catalogo and v.clave = p_clave), p_clave);
$$;
revoke all on function public.fortius_inmuebles_catalogo_etiqueta(text, text) from public, anon;
grant execute on function public.fortius_inmuebles_catalogo_etiqueta(text, text) to authenticated, service_role;

-- Lo que significa un valor (null si no tiene).
create function public.fortius_inmuebles_catalogo_significado(p_catalogo text, p_clave text) returns text
language sql stable security definer set search_path = '' as $$
  select v.significado from public.fortius_inmuebles_catalogo_valores v where v.catalogo = p_catalogo and v.clave = p_clave;
$$;
revoke all on function public.fortius_inmuebles_catalogo_significado(text, text) from public, anon;
grant execute on function public.fortius_inmuebles_catalogo_significado(text, text) to authenticated, service_role;

-- Reordenar una lista: los valores en el orden dado; los que no vengan quedan después, como estaban. Solo el director.
create function public.fortius_inmuebles_ordenar_catalogo(p_catalogo text, p_ids uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.fortius_inmuebles_is_admin() then
    raise sqlstate 'PT403' using message = 'Solo el director cambia las listas';
  end if;
  update public.fortius_inmuebles_catalogo_valores v
     set orden = n.nuevo
    from (select x.id, row_number() over (order by coalesce(array_position(p_ids, x.id), 100000), x.orden, x.created_at) * 10 as nuevo
            from public.fortius_inmuebles_catalogo_valores x where x.catalogo = p_catalogo) n
   where v.id = n.id and v.orden <> n.nuevo;
end; $$;
revoke all on function public.fortius_inmuebles_ordenar_catalogo(text, uuid[]) from public, anon;
grant execute on function public.fortius_inmuebles_ordenar_catalogo(text, uuid[]) to authenticated, service_role;

-- ── Las listas con que empieza (los valores que Fortius usa hoy) ─────────────────────────────────────
insert into public.fortius_inmuebles_catalogos (clave, nombre, ayuda, orden, fijo, significado_nombre, significados, padre, en_pantalla) values
  ('tipo_asunto', 'Tipos de asunto', 'La naturaleza del caso.', 10, false, null, '[]', null, false),
  ('subtipo_asunto', 'Subtipos sugeridos', 'Se sugieren según el tipo; también se escribe uno libre.', 20, false, null, '[]', 'tipo_asunto', false),
  ('encargo', 'Encargos', 'Qué le encargaron a Fortius en el asunto.', 30, false, null, '[]', null, true),
  ('en_que_va', 'En qué va un asunto', 'El panel depende de esta lista: se renombra, no se le quitan ni agregan valores.', 40, true, null, '[]', null, true),
  ('resultado_cierre', 'Resultados de cierre', 'Con qué resultado se cierra un asunto.', 50, false, 'Cuenta como',
     '[{"clave":"logrado","etiqueta":"Se logró"},{"clave":"no_logrado","etiqueta":"No se logró"}]', null, true),
  ('motivo_no_procede', 'Motivos de «no procede»', 'Por qué una consulta no se volvió asunto.', 60, false, null, '[]', null, false),
  ('papel', 'Papeles de las personas', 'El papel de cada persona en un asunto. Su lado es el grupo en que sale en Personas.', 70, false, 'De qué lado',
     '[{"clave":"busca","etiqueta":"De quien nos busca"},{"clave":"cliente","etiqueta":"Del lado del cliente"},{"clave":"otro","etiqueta":"Del otro lado"},{"clave":"apoyo","etiqueta":"De apoyo"}]', null, true),
  ('fuente', 'Fuentes de llegada', 'Por dónde llegó la consulta.', 80, false, null, '[]', null, true),
  ('estado_tarea', 'Cómo va una tarea', 'El panel depende de esta lista: se renombra, no se le quitan ni agregan valores.', 90, true, null, '[]', null, true),
  ('quien_tarea', 'Quién hace una tarea', 'De quién depende una tarea del plan.', 95, false, null, '[]', null, true),
  ('tipo_inmueble', 'Tipos de inmueble', 'Qué es el inmueble.', 100, false, 'Sale en el sitio como',
     '[{"clave":"casa","etiqueta":"Casa"},{"clave":"departamento","etiqueta":"Departamento"},{"clave":"terreno","etiqueta":"Terreno"},{"clave":"local","etiqueta":"Local comercial"},{"clave":"oficina","etiqueta":"Oficina"},{"clave":"nave-industrial","etiqueta":"Nave o bodega"},{"clave":"plaza","etiqueta":"Plaza o conjunto"}]', null, true),
  ('regimen', 'Regímenes del inmueble', 'Cómo está la propiedad del inmueble.', 110, false, null, '[]', null, false),
  ('funcion_equipo', 'Funciones del equipo', 'Lo que hace cada persona del equipo, además de ser director o asesor.', 120, false, null, '[]', null, false);

insert into public.fortius_inmuebles_catalogo_valores (catalogo, clave, etiqueta, orden, significado, padre, de_sistema, inicial, etiqueta_inicial, creado_por)
select catalogo, clave, etiqueta, orden, significado, padre, de_sistema, true, etiqueta, null
  from (values
    -- Tipos de asunto (SPEC.md, sección 5) y sus subtipos sugeridos.
    ('tipo_asunto', 'venta', 'Venta', 10, null, null, false),
    ('tipo_asunto', 'cesion_derechos', 'Cesión de derechos', 20, null, null, false),
    ('tipo_asunto', 'litigio', 'Litigio', 30, null, null, false),
    ('tipo_asunto', 'renta_administracion', 'Renta y administración', 40, null, null, false),
    ('tipo_asunto', 'rehabilitacion_proyectos', 'Rehabilitación y proyectos', 50, null, null, false),
    ('tipo_asunto', 'investigacion_consulta', 'Investigación y consulta', 60, null, null, false),
    ('tipo_asunto', 'servicios_gestiones', 'Servicios y gestiones', 70, null, null, false),
    ('tipo_asunto', 'otro', 'Otro', 80, null, null, false),
    ('subtipo_asunto', 'litigiosos', 'Litigiosos', 10, null, 'cesion_derechos', false),
    ('subtipo_asunto', 'adjudicatarios', 'Adjudicatarios', 20, null, 'cesion_derechos', false),
    ('subtipo_asunto', 'rescision_contrato', 'Rescisión de contrato', 30, null, 'litigio', false),
    ('subtipo_asunto', 'desahucio', 'Desahucio', 40, null, 'litigio', false),
    ('subtipo_asunto', 'cancelacion_hipoteca', 'Cancelación de hipoteca', 50, null, 'servicios_gestiones', false),
    -- Encargos: el panel enciende apartados y arma el primer plan según cada uno.
    ('encargo', 'revisar', 'Revisar', 10, null, null, true),
    ('encargo', 'comercializar', 'Comercializar', 20, null, null, true),
    ('encargo', 'tramitar', 'Tramitar', 30, null, null, true),
    ('encargo', 'asesorar', 'Asesorar', 40, null, null, true),
    -- En qué va un asunto.
    ('en_que_va', 'estudio', 'En estudio', 10, null, null, true),
    ('en_que_va', 'propuesta', 'Propuesta', 20, null, null, true),
    ('en_que_va', 'en_marcha', 'En marcha', 30, null, null, true),
    ('en_que_va', 'por_cobrar', 'Por cobrar', 40, null, null, true),
    ('en_que_va', 'cerrado', 'Cerrado', 50, null, null, true),
    -- Resultados de cierre.
    ('resultado_cierre', 'se_logro', 'Se logró', 10, 'logrado', null, true),
    ('resultado_cierre', 'no_se_dio', 'No se dio', 20, 'no_logrado', null, true),
    ('resultado_cierre', 'no_procede', 'No procede', 30, 'no_logrado', null, false),
    ('resultado_cierre', 'desistio', 'Desistió', 40, 'no_logrado', null, false),
    -- Motivos de «no procede» (para empezar; el titular los ajusta).
    ('motivo_no_procede', 'fuera_de_giro', 'No es de lo que hacemos', 10, null, null, false),
    ('motivo_no_procede', 'sin_papeles', 'No hay papeles para hacerlo', 20, null, null, false),
    ('motivo_no_procede', 'no_quiso', 'No quiso seguir', 30, null, null, false),
    ('motivo_no_procede', 'sin_respuesta', 'Ya no contestó', 40, null, null, false),
    ('motivo_no_procede', 'otro', 'Otro', 50, null, null, false),
    -- Papeles, con su lado. «Contacto», «Propietario» y «Comprador» los pone la consulta a quien llama. El vendedor
    -- es del otro lado: cuando Fortius lleva la compra, quien vende es la contraparte del cliente.
    ('papel', 'contacto', 'Contacto', 10, 'busca', null, true),
    ('papel', 'propietario', 'Propietario', 20, 'cliente', null, true),
    ('papel', 'titular', 'Titular', 30, 'cliente', null, false),
    ('papel', 'heredero', 'Heredero', 40, 'cliente', null, false),
    ('papel', 'copropietario', 'Copropietario', 50, 'cliente', null, false),
    ('papel', 'comprador', 'Comprador', 60, 'cliente', null, false),
    ('papel', 'inversionista', 'Inversionista', 70, 'cliente', null, false),
    ('papel', 'vendedor', 'Vendedor', 80, 'otro', null, false),
    ('papel', 'inquilino', 'Inquilino', 90, 'otro', null, false),
    ('papel', 'contraparte', 'Contraparte', 100, 'otro', null, false),
    ('papel', 'apoderado', 'Apoderado', 110, 'apoyo', null, false),
    ('papel', 'abogado', 'Abogado', 120, 'apoyo', null, false),
    ('papel', 'notaria', 'Notaría', 130, 'apoyo', null, false),
    ('papel', 'banco', 'Banco', 140, 'apoyo', null, false),
    -- Fuentes de llegada. «Llamada» es la que se pone si no se dice; «Sitio» la ponen las solicitudes del sitio.
    ('fuente', 'llamada', 'Llamada', 10, null, null, true),
    ('fuente', 'whatsapp', 'WhatsApp', 20, null, null, false),
    ('fuente', 'en_persona', 'En persona', 30, null, null, false),
    ('fuente', 'referido', 'Referido', 40, null, null, false),
    ('fuente', 'redes', 'Redes', 50, null, null, false),
    ('fuente', 'cliente_anterior', 'Cliente anterior', 60, null, null, false),
    ('fuente', 'sitio', 'Sitio', 70, null, null, true),
    ('fuente', 'otro', 'Otro', 80, null, null, false),
    -- Cómo va una tarea.
    ('estado_tarea', 'pendiente', 'Por hacer', 10, null, null, true),
    ('estado_tarea', 'hecha', 'Hecha', 20, null, null, true),
    ('estado_tarea', 'no_aplica', 'No aplica', 30, null, null, true),
    ('estado_tarea', 'no_se_puede', 'No se puede todavía', 40, null, null, true),
    -- Quién hace una tarea. «Fortius» es la que se pone si no se dice; con «El cliente» Inicio sabe a quién escribirle.
    ('quien_tarea', 'fortius', 'Fortius', 10, null, null, true),
    ('quien_tarea', 'cliente', 'El cliente', 20, null, null, true),
    ('quien_tarea', 'abogado', 'El abogado', 30, null, null, false),
    ('quien_tarea', 'notaria', 'La notaría', 40, null, null, false),
    ('quien_tarea', 'otro', 'Otra persona', 50, null, null, false),
    -- Tipos de inmueble, con cómo sale cada uno en el sitio.
    ('tipo_inmueble', 'casa', 'Casa', 10, 'casa', null, false),
    ('tipo_inmueble', 'departamento', 'Departamento', 20, 'departamento', null, false),
    ('tipo_inmueble', 'terreno', 'Terreno', 30, 'terreno', null, false),
    ('tipo_inmueble', 'local', 'Local', 40, 'local', null, false),
    ('tipo_inmueble', 'oficina', 'Oficina', 50, 'oficina', null, false),
    ('tipo_inmueble', 'nave_bodega', 'Nave o bodega', 60, 'nave-industrial', null, false),
    ('tipo_inmueble', 'plaza_conjunto', 'Plaza o conjunto', 70, 'plaza', null, false),
    -- Regímenes del inmueble.
    ('regimen', 'escriturado', 'Escriturado', 10, null, null, false),
    ('regimen', 'ejidal', 'Ejidal', 20, null, null, false),
    ('regimen', 'posesion', 'Posesión', 30, null, null, false),
    ('regimen', 'sucesion', 'En sucesión', 40, null, null, false),
    ('regimen', 'fideicomiso', 'Fideicomiso', 50, null, null, false),
    -- Funciones del equipo.
    ('funcion_equipo', 'abogado', 'Abogado', 10, null, null, false),
    ('funcion_equipo', 'valuador', 'Valuador', 20, null, null, false)
  ) s(catalogo, clave, etiqueta, orden, significado, padre, de_sistema);

-- El historial empieza después de cargar los valores iniciales: de ahí en adelante, cada cambio con quién y cuándo.
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_catalogo_valores
  for each row execute function public.fortius_inmuebles_registrar_cambio('catalogo_valor', 'catalogo,clave,etiqueta,orden,activo,significado,padre');

notify pgrst, 'reload schema';
commit;
