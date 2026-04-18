-- Cover image metadata for SEO guides (public /guides/[slug]). Nullable = no image.

alter table public.seo_articles add column if not exists cover_image text;
alter table public.seo_articles add column if not exists cover_image_alt text;

comment on column public.seo_articles.cover_image is 'Public URL or site-relative path to the hero/cover image (e.g. https://... or /path).';
comment on column public.seo_articles.cover_image_alt is 'Alt text for cover_image; recommended for accessibility and SEO.';
