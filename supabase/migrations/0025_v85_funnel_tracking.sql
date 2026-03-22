-- V85 Monetization Optimization: share_click + cta_variant in event_data (JSONB, no schema change)
-- Add share_click to zh_analytics event_type

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
  check (event_type in ('tool_click', 'tool_view', 'email_submit', 'page_view', 'share_click'));
