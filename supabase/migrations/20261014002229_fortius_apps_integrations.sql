-- Local preparation only. Apply in an isolated environment before enabling providers.
begin;
create table public.fortius_inmuebles_integration_jobs (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null, expediente_id uuid references public.fortius_inmuebles_expedientes(id) on delete restrict,
 slug text not null check(slug in ('ocr','consulta-documental','rutas','firmas')), idempotency_key uuid not null, input_hash text not null check(length(input_hash)=64),
 state text not null default 'reserved' check(state in ('reserved','running','completed','reconciliation','cancelled')),
 reserved_cents integer not null check(reserved_cents>=0), charged_cents integer check(charged_cents>=0 and charged_cents<=reserved_cents),
 settled_at timestamptz, pricing jsonb not null, result jsonb, provider_id bigint, provider_kind text check(provider_kind in ('template','submission')), provider_status text,
 provider_updated_at timestamptz, template_roles text[], context jsonb not null default '{}', error_message text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,idempotency_key)
);
create index fortius_integration_provider on public.fortius_inmuebles_integration_jobs(provider_kind,provider_id);
create index fortius_integration_owner on public.fortius_inmuebles_integration_jobs(owner_id,created_at desc);
alter table public.fortius_inmuebles_integration_jobs enable row level security;
revoke all on public.fortius_inmuebles_integration_jobs from public,anon,authenticated;
grant select on public.fortius_inmuebles_integration_jobs to authenticated;
grant all on public.fortius_inmuebles_integration_jobs to service_role;
create policy fortius_integration_read on public.fortius_inmuebles_integration_jobs for select to authenticated using (
 public.fortius_inmuebles_is_staff() and case when expediente_id is not null then public.fortius_inmuebles_can_access_expediente(expediente_id) else owner_id=auth.uid() or public.fortius_inmuebles_is_admin() end
);
-- Only the authenticated application server can supply prices or mutate the ledger.
-- A single transaction lock serializes all providers and months, including old liabilities.
create function public.fortius_apps_reserve(p_owner uuid,p_slug text,p_key uuid,p_hash text,p_expediente uuid,p_cents integer,p_limit integer,p_fixed integer,p_buffer integer,p_pricing jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.fortius_inmuebles_integration_jobs; used bigint;
begin
 perform pg_advisory_xact_lock(8140132026);
 if not exists(select 1 from public.fortius_inmuebles_staff where user_id=p_owner and active and role in ('admin','editor')) then raise sqlstate 'PT403'; end if;
 select * into j from public.fortius_inmuebles_integration_jobs where owner_id=p_owner and idempotency_key=p_key;
 if found then
  if j.input_hash<>p_hash or j.slug<>p_slug or j.expediente_id is distinct from p_expediente then raise sqlstate 'PT409'; end if;
  return jsonb_build_object('job',to_jsonb(j),'reused',true);
 end if;
 if p_cents<0 or p_limit<1 or p_limit>200000 or p_fixed<0 or p_buffer<0 or p_hash !~ '^[a-f0-9]{64}$' then raise sqlstate 'PT400'; end if;
 if (select count(*) from public.fortius_inmuebles_integration_jobs where owner_id=p_owner and created_at>now()-interval '1 minute')>=5 then raise sqlstate 'PT429'; end if;
 select coalesce(sum(case when charged_cents is not null then charged_cents else reserved_cents end),0) into used from public.fortius_inmuebles_integration_jobs
 where state<>'cancelled' and (settled_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC' or charged_cents is null);
 if used+p_cents+p_fixed+p_buffer>p_limit then raise sqlstate 'PT429' using message='Presupuesto mensual insuficiente'; end if;
 insert into public.fortius_inmuebles_integration_jobs(owner_id,slug,idempotency_key,input_hash,expediente_id,reserved_cents,pricing)
 values(p_owner,p_slug,p_key,p_hash,p_expediente,p_cents,p_pricing) returning * into j;
 return jsonb_build_object('job',to_jsonb(j),'reused',false,'warning',used+p_cents+p_fixed+p_buffer>=p_limit*0.8);
end; $$;
revoke all on function public.fortius_apps_reserve(uuid,text,uuid,text,uuid,integer,integer,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function public.fortius_apps_reserve(uuid,text,uuid,text,uuid,integer,integer,integer,integer,jsonb) to service_role;

create table public.fortius_inmuebles_integration_artifacts (
 id uuid primary key default gen_random_uuid(),job_id uuid not null references public.fortius_inmuebles_integration_jobs(id) on delete restrict,
 kind text not null check(kind in ('original','signed','audit')),name text not null,storage_path text not null unique,sha256 text not null check(length(sha256)=64),size_bytes integer not null check(size_bytes>0),mime_type text not null,created_at timestamptz not null default now(), unique(job_id,kind,sha256)
);
alter table public.fortius_inmuebles_integration_artifacts enable row level security;
revoke all on public.fortius_inmuebles_integration_artifacts from public,anon,authenticated;
grant select on public.fortius_inmuebles_integration_artifacts to authenticated;
grant all on public.fortius_inmuebles_integration_artifacts to service_role;
create policy fortius_integration_artifact_read on public.fortius_inmuebles_integration_artifacts for select to authenticated using (exists(select 1 from public.fortius_inmuebles_integration_jobs j where j.id=job_id));
create table public.fortius_inmuebles_integration_pages (
 id uuid primary key default gen_random_uuid(),job_id uuid not null references public.fortius_inmuebles_integration_jobs(id) on delete restrict,file_name text not null,
 version integer not null default 1 check(version>0),page integer not null check(page between 1 and 100),text text not null check(length(text)<=100000),corrected boolean not null default false,
 search tsvector generated always as (to_tsvector('spanish',text)) stored,created_at timestamptz not null default now(),unique(job_id,version,page)
);
create index fortius_integration_pages_search on public.fortius_inmuebles_integration_pages using gin(search);
alter table public.fortius_inmuebles_integration_pages enable row level security;
revoke all on public.fortius_inmuebles_integration_pages from public,anon,authenticated;
grant select on public.fortius_inmuebles_integration_pages to authenticated;
grant all on public.fortius_inmuebles_integration_pages to service_role;
create policy fortius_integration_page_read on public.fortius_inmuebles_integration_pages for select to authenticated using (exists(select 1 from public.fortius_inmuebles_integration_jobs j where j.id=job_id));
create function public.fortius_apps_search_pages(p_query text,p_expediente uuid default null) returns table(id uuid,job_id uuid,file_name text,version integer,page integer,text text)
language sql stable security invoker set search_path='' as $$
 with query as (
  select plainto_tsquery('spanish',left(p_query,2000)) as terms,
   tsvector_to_array(to_tsvector('spanish',left(p_query,2000))) as lexemes
 ), matched as materialized (
  select p.id,p.job_id,p.file_name,p.version,p.page,p.text,ts_rank(p.search,q.terms) as relevance
  from public.fortius_inmuebles_integration_pages p
  join public.fortius_inmuebles_integration_jobs j on j.id=p.job_id cross join query q
  where ((p_expediente is null and j.expediente_id is null) or j.expediente_id=p_expediente)
   and p.version=(select max(p2.version) from public.fortius_inmuebles_integration_pages p2 where p2.job_id=p.job_id)
   and p.search @@ q.terms
  order by relevance desc,p.id limit 10
 )
 select p.id,p.job_id,p.file_name,p.version,p.page,f.fragment
 from matched p cross join query q
 cross join lateral (
  -- Score literal source excerpts by query coverage before frequency. Subsequent
  -- excerpts favor uncovered terms and do not overlap already selected regions.
  with recursive windows as (
   select distinct greatest(anchor-600,1) as start_at
   from generate_series(1,length(p.text),400) as positions(anchor)
  ), candidates as materialized (
   select w.start_at,e.fragment,
    array(select lexeme from unnest(q.lexemes) as terms(lexeme)
     where lexeme=any(tsvector_to_array(v.search))) as lexemes,
    ts_rank_cd(v.search,q.terms) as relevance
   from windows w
   cross join lateral (select substring(p.text from w.start_at for 2000) as fragment) e
   cross join lateral (select to_tsvector('spanish',e.fragment) as search) v
   where tsvector_to_array(v.search) && q.lexemes
  ), chosen as (
   select 0 as start_at,null::text as fragment,array[]::text[] as covered,
    array[]::integer[] as starts,0 as ordinal
   union all
   select n.start_at,n.fragment,c.covered||n.lexemes,c.starts||n.start_at,c.ordinal+1
   from chosen c
   cross join lateral (
    select candidate.* from candidates candidate
    where c.ordinal<3 and not exists (
     select 1 from unnest(c.starts) as prior(start_at)
     where abs(prior.start_at-candidate.start_at)<2000
    )
    order by cardinality(array(select lexeme from unnest(candidate.lexemes) as terms(lexeme)
      where not (lexeme=any(c.covered)))) desc,
     cardinality(candidate.lexemes) desc,candidate.relevance desc,candidate.start_at
    limit 1
   ) n
  )
  select start_at,fragment,ordinal from chosen where ordinal>0
 ) f
 order by p.relevance desc,p.id,f.ordinal limit 10;
$$;
revoke all on function public.fortius_apps_search_pages(text,uuid) from public,anon;
grant execute on function public.fortius_apps_search_pages(text,uuid) to authenticated;
create table public.fortius_inmuebles_signature_events (
 hash text primary key check(length(hash)=64),job_id uuid not null references public.fortius_inmuebles_integration_jobs(id) on delete restrict,event_type text not null,
 event_at timestamptz not null,received_at timestamptz not null default now(),processed_at timestamptz
);
alter table public.fortius_inmuebles_signature_events enable row level security;
revoke all on public.fortius_inmuebles_signature_events from public,anon,authenticated;
grant all on public.fortius_inmuebles_signature_events to service_role;
-- Bind the provider response under the same row lock used by status updates.
-- A webhook may have already linked and completed this job before HTTP returns.
create function public.fortius_apps_signature_bind(p_job uuid,p_provider bigint) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare j public.fortius_inmuebles_integration_jobs;
begin
 if p_provider is null or p_provider<1 then raise sqlstate 'PT400'; end if;
 select * into j from public.fortius_inmuebles_integration_jobs where id=p_job and slug='firmas' for update;
 if not found then raise sqlstate 'PT400'; end if;
 if j.state not in ('running','reconciliation','completed')
  or (j.provider_kind is not null and j.provider_kind<>'submission')
  or (j.provider_id is not null and j.provider_id<>p_provider) then raise sqlstate 'PT409'; end if;
 update public.fortius_inmuebles_integration_jobs
 set provider_id=p_provider,provider_kind='submission',provider_status=coalesce(provider_status,'pending'),updated_at=now()
 where id=p_job returning * into j;
 return to_jsonb(j);
end; $$;
revoke all on function public.fortius_apps_signature_bind(uuid,bigint) from public,anon,authenticated;
grant execute on function public.fortius_apps_signature_bind(uuid,bigint) to service_role;
-- Keep final status monotonic when webhook deliveries race or arrive out of order.
create function public.fortius_apps_signature_status(p_job uuid,p_status text,p_at timestamptz) returns void language sql security invoker set search_path='' as $$
 update public.fortius_inmuebles_integration_jobs set provider_status=p_status,provider_updated_at=p_at,updated_at=now(), charged_cents=case when p_status='completed' then reserved_cents else charged_cents end, settled_at=case when p_status='completed' then coalesce(settled_at,now()) else settled_at end
 where id=p_job and provider_kind='submission' and (provider_updated_at is null or provider_updated_at<=p_at)
 and (provider_status is distinct from 'completed' or p_status='completed');
$$;
revoke all on function public.fortius_apps_signature_status(uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.fortius_apps_signature_status(uuid,text,timestamptz) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('fortius-app-integrations','fortius-app-integrations',false,20971520,array['application/pdf','image/jpeg','image/png']) on conflict(id) do nothing;
create function public.fortius_apps_correct_pages(p_job uuid,p_version integer,p_pages jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare latest integer; total integer;
begin
 perform 1 from public.fortius_inmuebles_integration_jobs where id=p_job and slug='ocr' for update;
 if not found then raise sqlstate 'PT400'; end if;
 select max(version) into latest from public.fortius_inmuebles_integration_pages where job_id=p_job;
 if latest is distinct from p_version then raise sqlstate 'PT409'; end if;
 select count(*) into total from public.fortius_inmuebles_integration_pages where job_id=p_job and version=latest;
 if jsonb_array_length(p_pages)<1 or jsonb_array_length(p_pages)>total or exists(select 1 from jsonb_to_recordset(p_pages) as x(page integer,text text) where x.text is null or length(x.text)>100000 or not exists(select 1 from public.fortius_inmuebles_integration_pages p where p.job_id=p_job and p.version=latest and p.page=x.page)) then raise sqlstate 'PT400'; end if;
 insert into public.fortius_inmuebles_integration_pages(job_id,file_name,version,page,text,corrected)
 select p_job,p.file_name,latest+1,p.page,coalesce(x.text,p.text),p.corrected or x.page is not null
 from public.fortius_inmuebles_integration_pages p left join jsonb_to_recordset(p_pages) as x(page integer,text text) on p.page=x.page
 where p.job_id=p_job and p.version=latest;
end; $$;
revoke all on function public.fortius_apps_correct_pages(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.fortius_apps_correct_pages(uuid,integer,jsonb) to service_role;
commit;
