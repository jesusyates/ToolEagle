-- Dedicated SEO guide storage (admin publish/import + /guides/[slug]). Does not touch content_items (V196).

create table if not exists public.seo_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  content text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seo_articles_slug on public.seo_articles (slug);

alter table public.seo_articles enable row level security;

-- Public site reads published rows with anon key (see guides/[slug]).
create policy "seo_articles_select_published"
  on public.seo_articles
  for select
  to anon, authenticated
  using (status = 'published');
