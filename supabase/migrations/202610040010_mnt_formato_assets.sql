begin;

create table public.mnt_formato_assets (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.mnt_formato_drafts(id) on delete restrict,
  kind text not null check (kind in ('foto','croquis','soporte')),
  caption text not null check (length(trim(caption)) between 1 and 240),
  source text not null check (length(trim(source)) between 1 and 240),
  observed_on date,
  mime text not null check (mime in ('image/jpeg','image/png')),
  byte_length integer not null check (byte_length between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  path text not null unique check (path ~ '^[a-f0-9-]+/[a-f0-9-]+/[a-f0-9-]+\.(jpg|png)$'),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index mnt_formato_assets_draft on public.mnt_formato_assets(draft_id,created_at);
alter table public.mnt_formato_assets enable row level security;
revoke all on public.mnt_formato_assets from anon,authenticated;
grant select on public.mnt_formato_assets to authenticated;
grant all on public.mnt_formato_assets to service_role;
create policy mnt_formato_assets_read on public.mnt_formato_assets for select to authenticated
  using (public.mnt_can_access_draft(draft_id));

notify pgrst, 'reload schema';
commit;
