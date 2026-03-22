-- V93.1: Programmatic SEO hardening — keyword quality, locale, attribution columns

-- 1) seo_keywords — quality + locale (composite unique with slug)
alter table public.seo_keywords
  add column if not exists locale text not null default 'en',
  add column if not exists is_blacklisted boolean not null default false,
  add column if not exists quality_score numeric(10, 4) not null default 0.5,
  add column if not exists review_status text not null default 'approved';

alter table public.seo_keywords
  drop constraint if exists seo_keywords_locale_check;

alter table public.seo_keywords
  add constraint seo_keywords_locale_check
  check (locale in ('en', 'zh'));

alter table public.seo_keywords
  drop constraint if exists seo_keywords_review_status_check;

alter table public.seo_keywords
  add constraint seo_keywords_review_status_check
  check (review_status in ('pending', 'approved', 'rejected'));

alter table public.seo_keywords
  drop constraint if exists seo_keywords_slug_key;

drop index if exists seo_keywords_slug_key;

create unique index if not exists seo_keywords_locale_slug_uidx
  on public.seo_keywords (locale, slug);

create index if not exists seo_keywords_locale_review_idx
  on public.seo_keywords (locale, review_status, revenue_score desc);

create index if not exists seo_keywords_blacklist_idx
  on public.seo_keywords (is_blacklisted) where is_blacklisted = true;

-- 2) programmatic_seo_pages — locale + updated_at; composite unique
alter table public.programmatic_seo_pages
  add column if not exists locale text not null default 'en',
  add column if not exists updated_at timestamptz not null default now();

alter table public.programmatic_seo_pages
  drop constraint if exists programmatic_seo_pages_page_type_slug_key;

drop index if exists programmatic_seo_pages_page_type_slug_key;

create unique index if not exists programmatic_seo_pages_type_slug_locale_uidx
  on public.programmatic_seo_pages (page_type, slug, locale);

create index if not exists programmatic_seo_pages_locale_path_idx
  on public.programmatic_seo_pages (locale, path);

-- 3) traffic_events — normalized attribution (optional columns; meta still supported)
alter table public.traffic_events
  add column if not exists locale text,
  add column if not exists source_page text,
  add column if not exists target_page text;

create index if not exists traffic_events_locale_idx on public.traffic_events (locale);
create index if not exists traffic_events_source_target_idx on public.traffic_events (source_page, target_page);

-- 4) revenue_attribution — normalized fields for reporting
alter table public.revenue_attribution
  add column if not exists locale text,
  add column if not exists source_page text,
  add column if not exists target_page text;

create index if not exists revenue_attribution_locale_idx on public.revenue_attribution (locale);
create index if not exists revenue_attribution_source_idx on public.revenue_attribution (source, locale);
