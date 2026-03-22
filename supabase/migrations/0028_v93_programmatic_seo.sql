-- V93: Programmatic SEO — keyword engine + generated page registry

create table if not exists public.seo_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  slug text not null,
  source text not null default 'aggregate',
  revenue_score numeric(14, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug)
);

create index if not exists seo_keywords_revenue_score_idx on public.seo_keywords (revenue_score desc);
create index if not exists seo_keywords_keyword_idx on public.seo_keywords (keyword);

create table if not exists public.programmatic_seo_pages (
  id uuid primary key default gen_random_uuid(),
  seo_keyword_id uuid references public.seo_keywords (id) on delete cascade,
  page_type text not null check (page_type in ('ai_generator', 'examples', 'how_to')),
  slug text not null,
  path text not null,
  created_at timestamptz not null default now(),
  unique (page_type, slug)
);

create index if not exists programmatic_seo_pages_path_idx on public.programmatic_seo_pages (path);
create index if not exists programmatic_seo_pages_type_slug_idx on public.programmatic_seo_pages (page_type, slug);

alter table public.seo_keywords enable row level security;
alter table public.programmatic_seo_pages enable row level security;

create policy "seo_keywords_select_public"
  on public.seo_keywords for select
  using (true);

create policy "programmatic_seo_pages_select_public"
  on public.programmatic_seo_pages for select
  using (true);
