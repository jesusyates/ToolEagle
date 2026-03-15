-- Allow public submissions to public_examples (v18/v19)
-- Add 'submitted' to source check (drop/recreate - constraint name may vary)
do $$
declare
  r record;
begin
  for r in (select conname from pg_constraint where conrelid = 'public.public_examples'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%source%')
  loop
    execute format('alter table public.public_examples drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.public_examples add constraint public_examples_source_check
  check (source in ('manual', 'from_history', 'submitted'));

-- Allow anonymous insert for submitted content
create policy "Allow anonymous submit for public_examples"
  on public.public_examples for insert
  with check (source = 'submitted' and creator_id is null);
