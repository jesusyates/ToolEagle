-- V70 Revenue Automation: zh_page_revenue_metrics

create table if not exists public.zh_page_revenue_metrics (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  page_type text not null default 'keyword',
  keyword text,
  tool_id text not null,
  views int not null default 0,
  clicks int not null default 0,
  estimated_revenue numeric(10,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique(page_slug, tool_id)
);

create index if not exists zh_page_revenue_metrics_page_slug_idx on public.zh_page_revenue_metrics(page_slug);
create index if not exists zh_page_revenue_metrics_tool_id_idx on public.zh_page_revenue_metrics(tool_id);
create index if not exists zh_page_revenue_metrics_estimated_revenue_idx on public.zh_page_revenue_metrics(estimated_revenue desc);
alter table public.zh_page_revenue_metrics enable row level security;

-- RPC for atomic upsert (page + tool)
create or replace function public.upsert_page_revenue_metric(
  p_page_slug text,
  p_page_type text,
  p_keyword text,
  p_tool_id text,
  p_view_delta int default 0,
  p_click_delta int default 0,
  p_revenue_delta numeric default 0
)
returns void as $$
begin
  insert into public.zh_page_revenue_metrics (page_slug, page_type, keyword, tool_id, views, clicks, estimated_revenue, updated_at)
  values (p_page_slug, p_page_type, coalesce(p_keyword,''), p_tool_id, p_view_delta, p_click_delta, p_revenue_delta, now())
  on conflict (page_slug, tool_id) do update set
    views = zh_page_revenue_metrics.views + p_view_delta,
    clicks = zh_page_revenue_metrics.clicks + p_click_delta,
    estimated_revenue = zh_page_revenue_metrics.estimated_revenue + p_revenue_delta,
    updated_at = now(),
    keyword = coalesce(excluded.keyword, zh_page_revenue_metrics.keyword);
end;
$$ language plpgsql security definer;
