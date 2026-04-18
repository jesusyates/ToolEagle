-- SEO draft QA persistence + ledger eligibility (no JSON/meta column existed on seo_articles).

alter table public.seo_articles add column if not exists review_status text;
alter table public.seo_articles add column if not exists quality_reasons jsonb not null default '[]'::jsonb;

comment on column public.seo_articles.review_status is
  'Draft/publish QA gate: publish_ready | needs_revision | rejected. History ledger includes only published + publish_ready.';
comment on column public.seo_articles.quality_reasons is
  'Final QA reasons (string array), including post-repair residual issues.';

create index if not exists idx_seo_articles_review_status
  on public.seo_articles (review_status)
  where deleted = false;
