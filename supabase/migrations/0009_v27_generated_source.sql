-- v27: Allow 'generated' source for auto-content
do $$
begin
  alter table public.public_examples drop constraint if exists public_examples_source_check;
exception when others then null;
end $$;
alter table public.public_examples add constraint public_examples_source_check
  check (source in ('manual', 'from_history', 'submitted', 'generated'));

-- Allow service role to insert generated (RLS: service role bypasses)
