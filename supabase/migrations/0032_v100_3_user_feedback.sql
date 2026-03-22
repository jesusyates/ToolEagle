-- V100.3 — User feedback & requests (API via service role; RLS closed)

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id text,
  market text not null default 'global',
  locale text not null default 'en',
  route text,
  source_page text,
  tool_type text,
  user_plan text,
  category text not null,
  title text,
  message text not null,
  contact text,
  created_at timestamptz not null default now(),
  status text not null default 'new',
  priority text not null default 'normal',
  internal_note text
);

comment on table public.user_feedback is 'V100.3 product feedback; anonymous_user_id aligns with te_supporter_id where present';

create index if not exists user_feedback_created_idx on public.user_feedback (created_at desc);
create index if not exists user_feedback_status_idx on public.user_feedback (status);
create index if not exists user_feedback_category_idx on public.user_feedback (category);
create index if not exists user_feedback_anon_idx on public.user_feedback (anonymous_user_id);

alter table public.user_feedback
  drop constraint if exists user_feedback_status_check;
alter table public.user_feedback
  add constraint user_feedback_status_check
  check (status in ('new', 'reviewed', 'planned', 'closed'));

alter table public.user_feedback
  drop constraint if exists user_feedback_priority_check;
alter table public.user_feedback
  add constraint user_feedback_priority_check
  check (priority in ('low', 'normal', 'high'));

alter table public.user_feedback
  drop constraint if exists user_feedback_category_check;
alter table public.user_feedback
  add constraint user_feedback_category_check
  check (category in (
    'bug',
    'feature_request',
    'output_quality',
    'payment_support',
    'general_feedback'
  ));

alter table public.user_feedback enable row level security;

drop policy if exists user_feedback_no_access on public.user_feedback;
create policy user_feedback_no_access on public.user_feedback
  for all using (false) with check (false);
