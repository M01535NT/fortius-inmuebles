-- Panel nuevo, etapa 8 (Inicio; SPEC.md, secciones 3, 4 y 12). Las solicitudes del sitio llegan al panel nuevo.
-- · El formulario público no cambia: sigue entrando por capture_lead a records/leads. Un disparador copia cada
--   solicitud nueva a «solicitudes», que es lo que Inicio muestra en «Por atender» con el tiempo que lleva esperando.
-- · Si pregunta por un inmueble publicado del panel nuevo, queda a cargo de quien lleva el asunto de ese inmueble
--   y se anota sola en sus Interesados (con la persona, que se reutiliza si su teléfono o correo ya existen).
-- · capture_lead aprende a reconocer los inmuebles publicados del panel nuevo (antes descartaba su clave).
-- · Las que nadie lleva le llegan al director, que las pasa a quien deba; cada asesor ve las que le tocan.
begin;
set local lock_timeout = '5s';

create table public.fortius_inmuebles_solicitudes (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null unique,                      -- la solicitud en records/leads (el panel provisional la sigue viendo)
  nombre text not null default '' check (length(nombre) <= 160),
  telefono text not null default '' check (length(telefono) <= 40),
  correo text check (length(correo) <= 200),
  mensaje text not null default '' check (length(mensaje) <= 4000),
  inmueble_id uuid references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  asunto_id uuid references public.fortius_inmuebles_asuntos (id) on delete restrict,
  persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  interesado_id uuid references public.fortius_inmuebles_interesados (id) on delete restrict,
  recibida_el timestamptz not null default now(),
  asignada_a uuid references public.fortius_inmuebles_staff (user_id) on delete restrict,
  asignada_el timestamptz,
  estado text not null default 'por_atender' check (estado in ('por_atender', 'atendida', 'no_procede')),
  atendida_el timestamptz,
  atendida_por uuid references auth.users (id),
  consulta_id uuid references public.fortius_inmuebles_consultas (id) on delete restrict,
  es_ejemplo boolean not null default false,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.fortius_inmuebles_solicitudes (recibida_el) where estado = 'por_atender';
create index on public.fortius_inmuebles_solicitudes (asignada_a) where estado = 'por_atender';
create trigger fortius_01_version before update on public.fortius_inmuebles_solicitudes
  for each row execute function public.fortius_inmuebles_panel_version();

-- Solo el director cambia a quién va; al atenderla se anota quién y cuándo. Lo que llegó del sitio no se reescribe.
create function public.fortius_inmuebles_guard_solicitud() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.asignada_a is distinct from old.asignada_a then
    if auth.uid() is not null and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director pasa una solicitud a otra persona';
    end if;
    new.asignada_el := case when new.asignada_a is null then null else now() end;
  end if;
  if (new.lead_id, new.nombre, new.telefono, new.correo, new.mensaje, new.recibida_el, new.inmueble_id)
     is distinct from (old.lead_id, old.nombre, old.telefono, old.correo, old.mensaje, old.recibida_el, old.inmueble_id) then
    raise sqlstate '22023' using message = 'Lo que llegó del sitio no se cambia';
  end if;
  if new.estado <> old.estado then
    new.atendida_el := case when new.estado = 'por_atender' then null else now() end;
    new.atendida_por := case when new.estado = 'por_atender' then null else auth.uid() end;
  end if;
  return new;
end; $$;
create trigger fortius_02_guarda before update on public.fortius_inmuebles_solicitudes
  for each row execute function public.fortius_inmuebles_guard_solicitud();

alter table public.fortius_inmuebles_solicitudes enable row level security;
revoke all on public.fortius_inmuebles_solicitudes from anon, authenticated;
grant select, update on public.fortius_inmuebles_solicitudes to authenticated;
grant all on public.fortius_inmuebles_solicitudes to service_role;
-- El director ve todas (las que nadie lleva le llegan a él para pasarlas); cada asesor, las que le tocan.
create policy solicitudes_read on public.fortius_inmuebles_solicitudes for select to authenticated
  using ((select public.fortius_inmuebles_is_admin())
         or ((select public.fortius_inmuebles_is_staff()) and asignada_a = (select auth.uid())));
create policy solicitudes_update on public.fortius_inmuebles_solicitudes for update to authenticated
  using ((select public.fortius_inmuebles_is_admin())
         or ((select public.fortius_inmuebles_is_staff()) and asignada_a = (select auth.uid())))
  with check ((select public.fortius_inmuebles_is_staff()));

-- Las llaves que quedaron pendientes en la consulta y en los interesados.
alter table public.fortius_inmuebles_consultas
  add constraint consultas_solicitud_fk foreign key (solicitud_id) references public.fortius_inmuebles_solicitudes (id) on delete restrict;
alter table public.fortius_inmuebles_interesados
  add constraint interesados_solicitud_fk foreign key (solicitud_id) references public.fortius_inmuebles_solicitudes (id) on delete restrict;

-- ── De records/leads a solicitudes ───────────────────────────────────────────────────────────────────
create function public.fortius_inmuebles_lead_a_solicitud() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  d jsonb := new.data;
  v_slug text := nullif(btrim(coalesce(d->>'propiedadSlug', '')), '');
  v_inm public.fortius_inmuebles_inmuebles%rowtype;
  v_asunto uuid; v_responsable uuid; v_persona uuid; v_interesado uuid; v_sol uuid;
  v_digitos text := regexp_replace(coalesce(d->>'telefono', ''), '\D', '', 'g');
  v_pais text; v_numero text; v_correo text := nullif(lower(btrim(coalesce(d->>'email', ''))), '');
begin
  if new.collection <> 'leads' then return new; end if;
  if v_slug is not null then
    select i.* into v_inm from public.fortius_inmuebles_inmuebles i
     where i.slug = v_slug and i.publicado and i.deleted_at is null limit 1;
    if v_inm.id is not null then
      select ai.asunto_id, a.responsable_id into v_asunto, v_responsable
        from public.fortius_inmuebles_asunto_inmuebles ai
        join public.fortius_inmuebles_asuntos a on a.id = ai.asunto_id and a.deleted_at is null and a.en_que_va <> 'cerrado'
       where ai.inmueble_id = v_inm.id and ai.retirado_el is null
       order by ai.created_at desc limit 1;
      v_responsable := coalesce(v_responsable, v_inm.responsable_id);
    end if;
  end if;

  insert into public.fortius_inmuebles_solicitudes (lead_id, nombre, telefono, correo, mensaje, inmueble_id, asunto_id, recibida_el, asignada_a, asignada_el)
  values (new.id, left(btrim(coalesce(d->>'nombre', '')), 160), left(btrim(coalesce(d->>'telefono', '')), 40), left(v_correo, 200),
          left(btrim(coalesce(d->>'mensaje', '')), 4000), v_inm.id, v_asunto,
          coalesce(nullif(d->>'creadoEl', '')::timestamptz, new.created_at, now()), v_responsable,
          case when v_responsable is null then null else now() end)
  on conflict (lead_id) do nothing
  returning id into v_sol;
  if v_sol is null or v_asunto is null then return new; end if;

  -- La persona: la misma si su teléfono o su correo ya están; si no, una ficha nueva a cargo de quien lleva el asunto.
  if length(v_digitos) >= 6 then
    if length(v_digitos) > 10 then v_pais := '+' || left(v_digitos, length(v_digitos) - 10); v_numero := right(v_digitos, 10);
    else v_pais := '+52'; v_numero := v_digitos; end if;
    select p.id into v_persona from public.fortius_inmuebles_personas p
     where p.deleted_at is null and p.telefonos_normales @> array[substring(v_pais from 2) || v_numero] limit 1;
  end if;
  if v_persona is null and v_correo is not null then
    select p.id into v_persona from public.fortius_inmuebles_personas p where p.deleted_at is null and p.correo = v_correo limit 1;
  end if;
  begin
    if v_persona is null then
      insert into public.fortius_inmuebles_personas (nombre, telefonos, correo, canal, responsable_id, creado_por)
      values (coalesce(nullif(left(btrim(coalesce(d->>'nombre', '')), 160), ''), 'Sin nombre'),
              case when v_numero is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('pais', v_pais, 'numero', v_numero)) end,
              case when v_correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then v_correo end, 'sitio', v_responsable, null)
      returning id into v_persona;
    end if;
    select x.id into v_interesado from public.fortius_inmuebles_interesados x
     where x.asunto_id = v_asunto and x.persona_id = v_persona and x.deleted_at is null;
    if v_interesado is null then
      insert into public.fortius_inmuebles_interesados (asunto_id, persona_id, solicitud_id, nota, orden, creado_por)
      values (v_asunto, v_persona, v_sol, left('Del sitio: ' || btrim(coalesce(d->>'mensaje', '')), 2000),
              coalesce((select max(x.orden) from public.fortius_inmuebles_interesados x where x.asunto_id = v_asunto), 0) + 10, null)
      returning id into v_interesado;
    end if;
    insert into public.fortius_inmuebles_interesado_inmuebles (interesado_id, inmueble_id, asunto_id)
    values (v_interesado, v_inm.id, v_asunto) on conflict do nothing;
    update public.fortius_inmuebles_solicitudes set persona_id = v_persona, interesado_id = v_interesado where id = v_sol;
  exception when others then
    -- Un teléfono o un correo raro no detiene la solicitud: queda en Por atender, sin interesado.
    return new;
  end;
  return new;
end; $$;
create trigger fortius_zz_solicitud after insert on public.fortius_inmuebles_records
  for each row when (new.collection = 'leads') execute function public.fortius_inmuebles_lead_a_solicitud();

-- ── La captura pública reconoce los inmuebles publicados del panel nuevo ─────────────────────────────
-- Misma técnica que 20261114120000: reemplazo de texto sobre la función vigente, con su ancla comprobada.
do $$
declare definition text;
  anchor text := $m$where p.collection='propiedades' and p.id=d->>'propiedadSlug' and p.data->'publicada'='true'::jsonb) then$m$;
  marker text := $m$-- Panel nuevo: inmuebles publicados$m$;
begin
  select pg_get_functiondef('public.fortius_inmuebles_capture_lead(jsonb,text)'::regprocedure) into definition;
  definition := replace(definition, chr(13), '');
  if position(marker in definition) > 0 then return; end if;
  if position(anchor in definition) = 0 then
    raise exception 'Unexpected lead capture function public.fortius_inmuebles_capture_lead';
  end if;
  definition := replace(definition, anchor, replace(anchor, ') then', '') || $m$)
      and not exists(select 1 from public.fortius_inmuebles_inmuebles i  $m$ || marker || $m$
      where i.slug=d->>'propiedadSlug' and i.publicado and i.deleted_at is null) then$m$);
  execute definition;
end; $$;

notify pgrst, 'reload schema';
commit;
