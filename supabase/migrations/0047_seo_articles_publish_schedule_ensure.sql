-- Ensure scheduled publish columns exist (idempotent; some remotes skipped 0045).

alter table public.seo_articles add column if not exists publish_scheduled_at timestamptz;
alter table public.seo_articles add column if not exists publish_queue_source text;

create index if not exists idx_seo_articles_scheduled_publish
  on public.seo_articles (publish_scheduled_at)
  where status = 'scheduled' and deleted = false and publish_scheduled_at is not null;
