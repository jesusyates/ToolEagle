-- V68 Revenue Validation: zh_tool_metrics + tool_view event

-- Allow tool_view in zh_analytics (drop existing check, add new)
do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'zh_analytics' and con.contype = 'c' limit 1;
  if cname is not null then
    execute format('alter table public.zh_analytics drop constraint %I', cname);
  end if;
end $$;
alter table public.zh_analytics add constraint zh_analytics_event_type_check
  check (event_type in ('tool_click', 'tool_view', 'email_submit', 'page_view'));

-- zh_tool_metrics for CTR tracking

create table if not exists public.zh_tool_metrics (
  tool_id text primary key,
  views int not null default 0,
  clicks int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists zh_tool_metrics_clicks_idx on public.zh_tool_metrics(clicks desc);
alter table public.zh_tool_metrics enable row level security;

-- RPC for atomic increment (called from analytics API)
create or replace function public.increment_zh_tool_metric(p_tool_id text, p_type text)
returns void as $$
begin
  insert into public.zh_tool_metrics (tool_id, views, clicks, updated_at)
  values (
    p_tool_id,
    case when p_type = 'view' then 1 else 0 end,
    case when p_type = 'click' then 1 else 0 end,
    now()
  )
  on conflict (tool_id) do update set
    views = zh_tool_metrics.views + case when p_type = 'view' then 1 else 0 end,
    clicks = zh_tool_metrics.clicks + case when p_type = 'click' then 1 else 0 end,
    updated_at = now();
end;
$$ language plpgsql security definer;
