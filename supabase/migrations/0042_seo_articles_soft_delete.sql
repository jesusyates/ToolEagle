-- Soft delete for seo_articles: hide from lists and public without removing rows (slug uniqueness preserved).

alter table public.seo_articles add column if not exists deleted boolean not null default false;

comment on column public.seo_articles.deleted is 'When true, row is hidden from admin main lists and public guides; slug remains reserved.';

drop policy if exists "seo_articles_select_published" on public.seo_articles;

create policy "seo_articles_select_published"
  on public.seo_articles
  for select
  to anon, authenticated
  using (status = 'published' and deleted = false);
