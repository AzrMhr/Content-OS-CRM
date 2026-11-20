-- ============================================================================
-- Content CRM — schema, row level security and triggers
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: it drops and recreates the application tables.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Clean slate for the app tables (auth.users is untouched)
-- ----------------------------------------------------------------------------
drop table if exists public.content_activity cascade;
drop table if exists public.content cascade;
drop table if exists public.creators cascade;
drop table if exists public.products cascade;
drop table if exists public.profiles cascade;

drop type if exists user_role cascade;
drop type if exists creator_status cascade;
drop type if exists deal_type cascade;
drop type if exists usage_rights cascade;
drop type if exists content_status cascade;
drop type if exists content_goal cascade;
drop type if exists content_usage cascade;
drop type if exists product_priority cascade;

-- ----------------------------------------------------------------------------
-- Enums
--   To add an option later:  alter type content_status add value 'needs_reshoot';
--   Then mirror it in src/lib/constants.ts so it shows up in the UI.
-- ----------------------------------------------------------------------------
create type user_role as enum ('admin', 'editor', 'viewer');

create type creator_status as enum (
  'prospect', 'outreach_sent', 'negotiating', 'active', 'paused', 'not_a_fit'
);

create type deal_type as enum ('gifted', 'paid_per_video', 'affiliate', 'retainer');

create type usage_rights as enum ('organic_only', 'paid_30', 'paid_90', 'perpetual');

create type content_status as enum (
  'idea', 'brief_sent', 'product_shipped', 'scripting', 'filming',
  'editing', 'awaiting_approval', 'scheduled', 'posted', 'archived'
);

create type content_goal as enum (
  'awareness', 'engagement', 'traffic', 'sales', 'social_proof', 'retention'
);

create type content_usage as enum ('organic', 'paid', 'both');

create type product_priority as enum ('hero', 'core', 'new_launch', 'seasonal');

-- ----------------------------------------------------------------------------
-- profiles — one row per signed-up user, carrying their role
-- ----------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Team members. The first account to sign up becomes admin; everyone after is a viewer until an admin promotes them.';

-- ----------------------------------------------------------------------------
-- products — what the content is selling
-- ----------------------------------------------------------------------------
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  priority     product_priority not null default 'core',
  category     text,
  price        numeric(12, 2),
  url          text,
  benefits     text,
  pain_points  text,
  offer        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- creators — the UGC roster, used as the relationship pipeline
-- ----------------------------------------------------------------------------
create table public.creators (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  status         creator_status not null default 'prospect',
  niches         text[] not null default '{}',
  platforms      text[] not null default '{}',
  handle         text,
  profile_url    text,
  email          text,
  followers      bigint,
  deal           deal_type,
  rate_per_video numeric(12, 2),
  rights         usage_rights,
  rating         smallint check (rating between 1 and 5),
  notes          text,
  last_contacted date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index creators_status_idx on public.creators (status);

-- ----------------------------------------------------------------------------
-- content — the pipeline itself, one row per video or post
-- ----------------------------------------------------------------------------
create table public.content (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  status            content_status not null default 'idea',
  formats           text[] not null default '{}',
  platforms         text[] not null default '{}',
  goal              content_goal,
  usage             content_usage not null default 'organic',
  hook              text,
  brief             text,
  shot_list         text,
  caption           text,
  creator_id        uuid references public.creators (id) on delete set null,
  product_id        uuid references public.products (id) on delete set null,
  owner_id          uuid references public.profiles (id) on delete set null,
  due_date          date,
  post_date         date,
  rights_expire_on  date,
  raw_footage_url   text,
  edited_url        text,
  live_url          text,
  views             bigint,
  likes             bigint,
  comments          bigint,
  ad_spend          numeric(12, 2),
  revenue           numeric(12, 2),
  board_position    double precision not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Derived metrics, computed by Postgres so the app never recalculates them.
  roas numeric(12, 2) generated always as (
    case
      when coalesce(ad_spend, 0) > 0
      then round(coalesce(revenue, 0) / ad_spend, 2)
    end
  ) stored,

  engagement_rate numeric(6, 4) generated always as (
    case
      when coalesce(views, 0) > 0
      then round((coalesce(likes, 0) + coalesce(comments, 0))::numeric / views, 4)
    end
  ) stored
);

create index content_status_idx         on public.content (status);
create index content_creator_idx        on public.content (creator_id);
create index content_product_idx        on public.content (product_id);
create index content_post_date_idx      on public.content (post_date desc);
create index content_rights_expiry_idx  on public.content (rights_expire_on);

-- ----------------------------------------------------------------------------
-- content_activity — append-only history, so the pipeline has a paper trail
-- ----------------------------------------------------------------------------
create table public.content_activity (
  id          bigint generated always as identity primary key,
  content_id  uuid not null references public.content (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  kind        text not null check (kind in ('created', 'status_change', 'note')),
  from_status content_status,
  to_status   content_status,
  note        text,
  created_at  timestamptz not null default now()
);

create index content_activity_content_idx on public.content_activity (content_id, created_at desc);

-- ============================================================================
-- Functions and triggers
-- ============================================================================

-- Role of the caller. SECURITY DEFINER so reading it inside a policy on
-- `profiles` does not re-enter that same policy and recurse.
create or replace function public.current_user_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- Admins and editors may change data; viewers are read-only.
create or replace function public.can_write()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() in ('admin', 'editor'), false);
$$;

-- Give every new auth user a profile. The very first one is the admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned user_role;
begin
  if not exists (select 1 from public.profiles) then
    assigned := 'admin';
  else
    assigned := 'viewer';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'teammate'), '@', 1)
    ),
    assigned
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins can change someone's role, including their own.
-- These checks apply to requests made as a signed-in user. Direct SQL (this
-- editor, or the service role) has no auth.uid() and is allowed through, so
-- you always have a way to repair roles if you lock yourself out.
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change a role';
  end if;

  -- Never let the last admin be demoted, or nobody can manage the team.
  if old.role = 'admin' and new.role <> 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'There must be at least one admin';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_role_change
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger creators_touch before update on public.creators
  for each row execute function public.touch_updated_at();
create trigger content_touch before update on public.content
  for each row execute function public.touch_updated_at();

-- Log creation and every status move.
create or replace function public.log_content_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.content_activity (content_id, actor_id, kind, to_status)
  values (new.id, auth.uid(), 'created', new.status);
  return new;
end;
$$;

create trigger content_log_created
  after insert on public.content
  for each row execute function public.log_content_created();

create or replace function public.log_content_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.content_activity (content_id, actor_id, kind, from_status, to_status)
    values (new.id, auth.uid(), 'status_change', old.status, new.status);

    -- Stamp the post date the first time something goes live.
    if new.status = 'posted' and new.post_date is null then
      new.post_date := current_date;
    end if;
  end if;

  return new;
end;
$$;

create trigger content_log_status_change
  before update on public.content
  for each row execute function public.log_content_status_change();

-- ============================================================================
-- Row level security
--   Signed-in team members read everything.
--   Admins and editors write. Viewers cannot.
--   Anonymous visitors get nothing.
-- ============================================================================

alter table public.profiles         enable row level security;
alter table public.products         enable row level security;
alter table public.creators         enable row level security;
alter table public.content          enable row level security;
alter table public.content_activity enable row level security;

-- profiles
create policy "team can read profiles"
  on public.profiles for select
  to authenticated using (true);

create policy "own profile or admin can update"
  on public.profiles for update
  to authenticated using (id = auth.uid() or public.is_admin());

create policy "admin can remove a profile"
  on public.profiles for delete
  to authenticated using (public.is_admin() and id <> auth.uid());

-- products
create policy "team can read products"
  on public.products for select to authenticated using (true);
create policy "writers can insert products"
  on public.products for insert to authenticated with check (public.can_write());
create policy "writers can update products"
  on public.products for update to authenticated using (public.can_write());
create policy "writers can delete products"
  on public.products for delete to authenticated using (public.can_write());

-- creators
create policy "team can read creators"
  on public.creators for select to authenticated using (true);
create policy "writers can insert creators"
  on public.creators for insert to authenticated with check (public.can_write());
create policy "writers can update creators"
  on public.creators for update to authenticated using (public.can_write());
create policy "writers can delete creators"
  on public.creators for delete to authenticated using (public.can_write());

-- content
create policy "team can read content"
  on public.content for select to authenticated using (true);
create policy "writers can insert content"
  on public.content for insert to authenticated with check (public.can_write());
create policy "writers can update content"
  on public.content for update to authenticated using (public.can_write());
create policy "writers can delete content"
  on public.content for delete to authenticated using (public.can_write());

-- content_activity: readable by the team, append-only, never edited
create policy "team can read activity"
  on public.content_activity for select to authenticated using (true);
create policy "writers can add activity"
  on public.content_activity for insert to authenticated with check (public.can_write());
