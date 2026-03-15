-- Add slug to public_examples for /examples/[slug] SEO pages
-- Slug format: toolSlug-keyword-id (e.g. tiktok-caption-gym-motivation-4821)
alter table public.public_examples add column if not exists slug text;

-- Generate slugs for existing rows (keyword max 30 chars)
update public.public_examples
set slug = tool_slug || '-' || left(lower(regexp_replace(regexp_replace(coalesce(nullif(trim(input), ''), 'example'), '[^a-z0-9\s]', '', 'g'), '\s+', '-', 'g')), 30)
  || '-' || substr(replace(id::text, '-', ''), 1, 8)
where slug is null;

create unique index if not exists public_examples_slug_idx on public.public_examples(slug) where slug is not null;
