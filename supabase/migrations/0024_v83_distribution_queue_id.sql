-- V83: Link distribution_posts to queue for per-platform tracking

alter table public.distribution_posts
  add column if not exists queue_id uuid references public.distribution_queue(id) on delete set null;

create index if not exists distribution_posts_queue_id_idx on public.distribution_posts(queue_id);
