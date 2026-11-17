-- Tres fallos del panel nuevo que aún no se habían visto porque nadie había publicado un inmueble
-- desde el panel nuevo ni había entrado con una cuenta de asesor.
--
-- 1. Un inmueble sin video o sin recorrido 360 no salía en el sitio: «select ... into result» deja
--    result en nulo cuando no encuentra el medio, y se perdía todo el inmueble. Ahora el medio se
--    agrega solo si existe.
-- 2. La solicitud de visita de un inmueble del panel nuevo no llegaba: la captura dejaba pasar la clave,
--    pero el enlace entre registros apuntaba a los inmuebles de siempre, donde esa clave no existe, y la
--    base rechazaba todo. Ahora ese enlace no se escribe cuando la clave es de un inmueble del panel nuevo
--    (la solicitud ya queda ligada al inmueble en la tabla de solicitudes). El respaldo restaura todas
--    las tablas antes de recalcular los enlaces, así que el ensayo de restauración da lo mismo.
-- 3. Un asesor no podía crear consultas, asuntos ni personas: al pedir de vuelta la fila recién creada,
--    la regla de lectura buscaba esa fila con una función que todavía no la ve. Ahora la regla revisa
--    también las columnas de la propia fila. Nadie ve más que antes: es la misma condición que ya usaban
--    esas funciones para quien lleva el registro.
begin;

-- ── 1. Lo que sale en el sitio ─────────────────────────────────────────────────────────────────────────
create or replace function public.fortius_inmuebles_inmuebles_publicos() returns setof jsonb
language plpgsql stable security definer set search_path = '' as $$
declare i record; result jsonb; galeria jsonb; num jsonb; estado text;
begin
  for i in select x.*, c.slug as slug_conjunto, c.publicado as conjunto_publicado, c.deleted_at as conjunto_borrado
             from public.fortius_inmuebles_inmuebles x
             left join public.fortius_inmuebles_inmuebles c on c.id = x.conjunto_id
            where x.publicado and x.deleted_at is null and x.operacion is not null and x.tipo is not null
              and x.estado <> 'retirado'
            order by x.publicado_el desc nulls last, x.id loop
    select coalesce(jsonb_agg(jsonb_build_object('src', m.url, 'alt', coalesce(nullif(btrim(m.alt), ''), i.nombre))
                              order by (m.id = i.portada_id) desc, m.orden, m.created_at), '[]'::jsonb)
      into galeria
      from public.fortius_inmuebles_inmueble_medios m
     where m.inmueble_id = i.id and m.tipo = 'foto' and m.retirado_el is null and public.fortius_inmuebles_public_url(m.url);
    if jsonb_array_length(galeria) = 0 then continue; end if;
    estado := case i.estado when 'libre' then 'disponible' when 'apartado' then 'apartada'
                            when 'vendido' then 'vendida' when 'rentado' then 'rentada' end;
    num := (select coalesce(jsonb_object_agg(k.publico, i.ficha -> k.panel), '{}'::jsonb)
              from (values ('terreno', 'terrenoM2'), ('construccion', 'construccionM2'), ('recamaras', 'recamaras'),
                           ('banos', 'banos'), ('estac', 'estacionamientos')) k(panel, publico)
             where jsonb_typeof(i.ficha -> k.panel) = 'number' and (i.ficha ->> k.panel)::numeric between 0 and 1e9);
    if jsonb_typeof(i.ficha -> 'anio') = 'number' and (i.ficha ->> 'anio')::int between 1900 and 2100 then
      num := num || jsonb_build_object('antiguedad', 'Construida en ' || (i.ficha ->> 'anio'));
    end if;
    result := jsonb_build_object(
      'slug', coalesce(i.slug, lower(i.folio)),
      'codigo', i.folio,
      'titulo', i.nombre,
      'tipo', case i.tipo when 'nave_bodega' then 'nave-industrial' when 'plaza_conjunto' then 'plaza' else i.tipo end,
      'operacion', i.operacion,
      'zona', coalesce(i.colonia, ''),
      'direccionAproximada', case when i.mostrar_direccion and length(btrim(coalesce(i.direccion_exacta, ''))) between 3 and 200
                                  then btrim(i.direccion_exacta)
                                  else concat_ws(', ', nullif(btrim(coalesce(i.colonia, '')), ''), i.ciudad) end,
      'descripcion', (select coalesce(jsonb_agg(btrim(p) order by n), '[]'::jsonb)
                        from regexp_split_to_table(i.descripcion, '\n\s*\n') with ordinality s(p, n)
                       where length(btrim(p)) > 0 and n <= 100),
      'amenidades', '[]'::jsonb,
      'asesorId', '',
      'creditoDisponible', false,
      'destacada', false,
      'estado', estado,
      'publicadaEl', coalesce(to_char(i.publicado_el at time zone 'America/Tijuana', 'YYYY-MM-DD'), ''),
      'demo', i.es_ejemplo,
      'publicada', true,
      'precio', case when i.precio is null or i.precio = 0 then jsonb_build_object('modalidad', 'consulta')
                     else jsonb_build_object('modalidad', 'publico', 'monto', i.precio, 'moneda', i.moneda)
                          || case when i.operacion = 'renta' then jsonb_build_object('periodo', 'mensual') else '{}'::jsonb end end,
      'ficha', num,
      'galeria', galeria,
      'puntosDeInteres', '[]'::jsonb,
      'documentos', '[]'::jsonb);
    if i.conjunto_id is not null and i.conjunto_publicado and i.conjunto_borrado is null and i.slug_conjunto is not null then
      result := result || jsonb_build_object('conjunto', i.slug_conjunto);
    end if;
    if i.compartido and length(btrim(coalesce(i.inmobiliaria, ''))) between 2 and 120 then
      result := result || jsonb_build_object('colaboracion', true);
    end if;
    -- Video y recorrido son opcionales: si no hay, el inmueble sale igual, sin ellos.
    result := result || coalesce((
      select jsonb_build_object('videoUrl', m.url)
        from public.fortius_inmuebles_inmueble_medios m
       where m.inmueble_id = i.id and m.tipo = 'video' and m.retirado_el is null and public.fortius_inmuebles_public_url(m.url)
       order by m.orden, m.created_at limit 1), '{}'::jsonb);
    result := result || coalesce((
      select jsonb_build_object('tour360Url', m.url)
        from public.fortius_inmuebles_inmueble_medios m
       where m.inmueble_id = i.id and m.tipo = 'recorrido_360' and m.path is null and m.retirado_el is null
         and public.fortius_inmuebles_public_url(m.url)
       order by m.orden, m.created_at limit 1), '{}'::jsonb);
    return next result;
  end loop;
end; $$;

-- ── 2. Enlaces entre registros ─────────────────────────────────────────────────────────────────────────
create or replace function public.fortius_inmuebles_sync_references(c text, record_id text, d jsonb)
returns void language plpgsql set search_path = '' as $$
declare f text; target text;
begin
  delete from public.fortius_inmuebles_record_references where source_collection=c and source_id=record_id;
  foreach f in array array['asesorId','propiedadSlug','leadId','clienteId'] loop
    target := case f when 'asesorId' then 'asesores' when 'propiedadSlug' then 'propiedades' when 'leadId' then 'leads' else 'clientes' end;
    if coalesce(d->>f,'') <> '' then
      -- Panel nuevo: el inmueble no vive en los registros de siempre; su enlace está en la tabla de solicitudes.
      if f = 'propiedadSlug'
         and not exists (select 1 from public.fortius_inmuebles_records p where p.collection = 'propiedades' and p.id = d->>f)
         and exists (select 1 from public.fortius_inmuebles_inmuebles i where i.slug = d->>f) then
        continue;
      end if;
      insert into public.fortius_inmuebles_record_references values(c,record_id,f,target,d->>f);
    end if;
  end loop;
end;
$$;

-- ── 3. Quien lleva el registro lo ve desde que lo crea ────────────────────────────────────────────────
alter policy consultas_read on public.fortius_inmuebles_consultas
  using (public.fortius_inmuebles_puede_ver_consulta(id)
         or ((select public.fortius_inmuebles_is_staff()) and deleted_at is null and responsable_id = (select auth.uid())));
alter policy asuntos_read on public.fortius_inmuebles_asuntos
  using (public.fortius_inmuebles_puede_ver_asunto(id)
         or ((select public.fortius_inmuebles_is_staff()) and deleted_at is null and responsable_id = (select auth.uid())));
alter policy personas_read on public.fortius_inmuebles_personas
  using (public.fortius_inmuebles_puede_ver_persona(id)
         or ((select public.fortius_inmuebles_is_staff()) and deleted_at is null and responsable_id = (select auth.uid())));

notify pgrst, 'reload schema';
commit;
