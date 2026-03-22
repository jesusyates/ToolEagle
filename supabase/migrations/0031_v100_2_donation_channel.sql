-- V100.2 — Optional donation channel (wechat / alipay / other)

alter table public.donation_ledger
  add column if not exists channel text;

comment on column public.donation_ledger.channel is 'wechat | alipay | other — self-reported when user records support';
