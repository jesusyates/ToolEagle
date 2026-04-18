-- Scheduled auto-publish for seo_articles (gap pipeline + cron).

alter table public.seo_articles add column if not exists publish_scheduled_at timestamptz;

alter table public.seo_articles add column if not exists publish_queue_source text;

comment on column public.seo_articles.publish_scheduled_at is
  'When status=scheduled, UTC time when cron may set status=published. Null for normal drafts.';

comment on column public.seo_articles.publish_queue_source is
  'Optional trace e.g. seo_auto_run for queue provenance.';

create index if not exists idx_seo_articles_scheduled_publish
  on public.seo_articles (publish_scheduled_at)
  where status = 'scheduled' and deleted = false and publish_scheduled_at is not null;
