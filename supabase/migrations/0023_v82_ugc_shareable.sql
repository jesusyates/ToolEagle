-- V82: UGC Loop Upgrade - shareable version + mini SEO candidate

alter table public.ugc_submissions
  add column if not exists shareable_content text,
  add column if not exists seo_candidate_title text,
  add column if not exists seo_candidate_description text;
