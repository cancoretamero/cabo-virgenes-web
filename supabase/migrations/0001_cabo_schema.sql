-- =====================================================================
-- CABO VÍRGENES — Esquema base. Paridad con Aisa Web.
-- Convención: escrituras vía service-role (Netlify Functions, bypass RLS).
-- RLS = muralla del cliente anon (publishable) → solo lee contenido público.
-- =====================================================================
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ── ENUMS ────────────────────────────────────────────────────────────
do $$ begin
  create type cv_news_status   as enum ('draft','published','archived');
  exception when duplicate_object then null; end $$;
do $$ begin
  create type cv_job_status    as enum ('open','closed','draft');
  exception when duplicate_object then null; end $$;
do $$ begin
  create type cv_app_status    as enum ('new','reviewing','shortlist','rejected','hired');
  exception when duplicate_object then null; end $$;
do $$ begin
  create type cv_nl_status     as enum ('draft','scheduled','sent','partial','failed');
  exception when duplicate_object then null; end $$;
do $$ begin
  create type cv_country       as enum ('AR','ES','Otro');
  exception when duplicate_object then null; end $$;

-- ── TRIGGER updated_at (paridad touch_updated_at de Aisa) ─────────────
create or replace function cv_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- =====================================================================
-- IDENTITY (paridad de esquema; auth real sigue en auth.mjs/Blobs)
-- =====================================================================
create table if not exists cv_profiles (
  id          text primary key,              -- mapea auth.mjs id ('gabriela-a'…)
  email       citext unique,
  name        text,
  role        text not null default 'owner', -- owner|editor|comunicacion|viewer
  perms       text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- NOTICIAS
-- =====================================================================
create table if not exists cv_news (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,
  title       text not null,
  excerpt     text,
  body        text,
  category    text,
  image       text,
  status      cv_news_status not null default 'draft',
  pinned      boolean not null default false,
  sort_order  int not null default 0,
  news_date   date,                          -- el "date" editorial del item
  author      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_cv_news_status on cv_news (status, news_date desc);
create index if not exists idx_cv_news_order  on cv_news (sort_order, news_date desc);
drop trigger if exists trg_cv_news_touch on cv_news;
create trigger trg_cv_news_touch before update on cv_news
  for each row execute function cv_touch_updated_at();

-- =====================================================================
-- EQUIPO
-- =====================================================================
create table if not exists cv_team (
  id          uuid primary key default gen_random_uuid(),
  member_key  text unique,                   -- 'basavilbaso', estable para modales
  name        text not null,
  role        text,
  area        text,
  bio         text,
  photo       text,
  hidden      boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_cv_team_order on cv_team (sort_order);
drop trigger if exists trg_cv_team_touch on cv_team;
create trigger trg_cv_team_touch before update on cv_team
  for each row execute function cv_touch_updated_at();

-- =====================================================================
-- CONSULTAS (formulario de contacto)
-- =====================================================================
create table if not exists cv_consultas (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       citext,
  company     text,
  country     text,
  topic       text,
  message     text,
  source      text not null default 'contacto',
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_cv_consultas_created on cv_consultas (created_at desc);
create index if not exists idx_cv_consultas_unread  on cv_consultas (is_read, created_at desc);

-- =====================================================================
-- SUSCRIPTORES
-- =====================================================================
create table if not exists cv_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       citext not null unique,
  name        text,
  country     text,
  interests   text[] not null default '{}',
  outlet      text,
  web         text,
  phone       text,
  tags        text[] not null default '{}',
  notes       text,
  source      text not null default 'web',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_cv_subscribers_country on cv_subscribers (country);
drop trigger if exists trg_cv_subscribers_touch on cv_subscribers;
create trigger trg_cv_subscribers_touch before update on cv_subscribers
  for each row execute function cv_touch_updated_at();

-- =====================================================================
-- EMPLEO: vacantes + candidaturas
-- =====================================================================
create table if not exists cv_jobs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  area         text,
  location     text,
  job_type     text not null default 'full-time',
  status       cv_job_status not null default 'open',
  priority     text not null default 'media',
  tags         text[] not null default '{}',
  requirements text[] not null default '{}',
  summary      text,
  body         text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_cv_jobs_status on cv_jobs (status, created_at desc);
drop trigger if exists trg_cv_jobs_touch on cv_jobs;
create trigger trg_cv_jobs_touch before update on cv_jobs
  for each row execute function cv_touch_updated_at();

create table if not exists cv_applications (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid references cv_jobs(id) on delete set null,
  job_title    text,                          -- snapshot (candidatura espontánea = sin job)
  name         text not null,
  email        citext,
  phone        text,
  message      text,
  cv_url       text,
  status       cv_app_status not null default 'new',
  starred      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_cv_applications_job    on cv_applications (job_id);
create index if not exists idx_cv_applications_status on cv_applications (status, created_at desc);
drop trigger if exists trg_cv_applications_touch on cv_applications;
create trigger trg_cv_applications_touch before update on cv_applications
  for each row execute function cv_touch_updated_at();

-- =====================================================================
-- PRENSA: medios + redactores (paridad press_outlets/press_journalists)
-- =====================================================================
create table if not exists cv_outlets (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  country          text not null default 'AR',
  city             text,
  outlet_type      text,
  editorial_email  citext,
  website          text,
  notes            text,
  subscribed       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
drop trigger if exists trg_cv_outlets_touch on cv_outlets;
create trigger trg_cv_outlets_touch before update on cv_outlets
  for each row execute function cv_touch_updated_at();

create table if not exists cv_journalists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  outlet      text,                            -- nombre del medio (texto, como hoy)
  outlet_id   uuid references cv_outlets(id) on delete set null,
  email       citext,
  phone       text,
  beats       text[] not null default '{}',
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_cv_journalists_outlet on cv_journalists (outlet_id);
drop trigger if exists trg_cv_journalists_touch on cv_journalists;
create trigger trg_cv_journalists_touch before update on cv_journalists
  for each row execute function cv_touch_updated_at();

-- =====================================================================
-- BOLETINES (historial; reemplaza Blobs cabo-newsletters)
-- =====================================================================
create table if not exists cv_newsletters (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  html            text,
  text_body       text,
  audience_label  text not null default 'Todos',
  status          cv_nl_status not null default 'draft',
  recipient_count int not null default 0,
  sent            int not null default 0,
  failed          int not null default 0,
  provider        text default 'resend',
  error           text,
  sent_by         text,
  meta            jsonb,
  sent_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_cv_newsletters_sent on cv_newsletters (sent_at desc nulls last);
drop trigger if exists trg_cv_newsletters_touch on cv_newsletters;
create trigger trg_cv_newsletters_touch before update on cv_newsletters
  for each row execute function cv_touch_updated_at();

-- =====================================================================
-- SINGLETONS clave→valor: settings, pages (layout noticias), legal
-- =====================================================================
create table if not exists cv_settings (
  key         text primary key,              -- 'site'
  value       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_cv_settings_touch on cv_settings;
create trigger trg_cv_settings_touch before update on cv_settings
  for each row execute function cv_touch_updated_at();

create table if not exists cv_pages (
  slug        text primary key,              -- 'noticias' → {hero, items[]}
  layout      jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_cv_pages_touch on cv_pages;
create trigger trg_cv_pages_touch before update on cv_pages
  for each row execute function cv_touch_updated_at();

create table if not exists cv_legal (
  key         text primary key,              -- privacidad|terminos|cookies|aviso|datos
  title       text,
  html        text,
  doc_updated text,                          -- "updated" editorial (string libre)
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_cv_legal_touch on cv_legal;
create trigger trg_cv_legal_touch before update on cv_legal
  for each row execute function cv_touch_updated_at();

-- =====================================================================
-- AUDIT (paridad audit_log de Aisa)
-- =====================================================================
create table if not exists cv_audit (
  id          uuid primary key default gen_random_uuid(),
  actor       text,
  section     text,
  action      text,
  before_val  text,
  after_val   text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_cv_audit_created on cv_audit (created_at desc);

-- =====================================================================
-- RLS — habilitar en todas; anon solo lee lo público; el resto cerrado.
-- service-role bypassa RLS (todas las escrituras del admin).
-- =====================================================================
alter table cv_profiles     enable row level security;
alter table cv_news         enable row level security;
alter table cv_team         enable row level security;
alter table cv_consultas    enable row level security;
alter table cv_subscribers  enable row level security;
alter table cv_jobs         enable row level security;
alter table cv_applications enable row level security;
alter table cv_outlets      enable row level security;
alter table cv_journalists  enable row level security;
alter table cv_newsletters  enable row level security;
alter table cv_settings     enable row level security;
alter table cv_pages        enable row level security;
alter table cv_legal        enable row level security;
alter table cv_audit        enable row level security;

-- LECTURA PÚBLICA (anon): solo contenido publicado/visible.
drop policy if exists cv_news_public_read on cv_news;
create policy cv_news_public_read on cv_news for select
  to anon using (status = 'published');
drop policy if exists cv_team_public_read on cv_team;
create policy cv_team_public_read on cv_team for select
  to anon using (hidden = false);
drop policy if exists cv_jobs_public_read on cv_jobs;
create policy cv_jobs_public_read on cv_jobs for select
  to anon using (status = 'open');
drop policy if exists cv_legal_public_read on cv_legal;
create policy cv_legal_public_read on cv_legal for select
  to anon using (true);
drop policy if exists cv_settings_public_read on cv_settings;
create policy cv_settings_public_read on cv_settings for select
  to anon using (key = 'site');
drop policy if exists cv_pages_public_read on cv_pages;
create policy cv_pages_public_read on cv_pages for select
  to anon using (true);

-- ENVÍO PÚBLICO (anon INSERT) — formularios del sitio.
-- (Recomendado: que los formularios posteen a /api/public con service-role.
--  Estas policies se dejan por flexibilidad; revisables en la Fase 5.)
drop policy if exists cv_consultas_public_insert on cv_consultas;
create policy cv_consultas_public_insert on cv_consultas for insert
  to anon with check (true);
drop policy if exists cv_subscribers_public_insert on cv_subscribers;
create policy cv_subscribers_public_insert on cv_subscribers for insert
  to anon with check (true);
drop policy if exists cv_applications_public_insert on cv_applications;
create policy cv_applications_public_insert on cv_applications for insert
  to anon with check (true);

grant usage on schema public to anon;
grant insert on cv_consultas, cv_subscribers, cv_applications to anon;
grant select on cv_news, cv_team, cv_jobs, cv_legal, cv_settings, cv_pages to anon;
