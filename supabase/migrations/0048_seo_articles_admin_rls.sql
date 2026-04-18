-- Allow users with profiles.role = 'admin' to read/write all seo_articles when using the anon key + JWT.
-- createAdminClient() without SUPABASE_SERVICE_ROLE_KEY uses anon key without a user session and still cannot use these;
-- server pages/API that use createClient() from @/lib/supabase/server will pass auth.uid() and match these policies.
-- Service role continues to bypass RLS entirely.

create policy "seo_articles_select_admin"
  on public.seo_articles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "seo_articles_insert_admin"
  on public.seo_articles
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "seo_articles_update_admin"
  on public.seo_articles
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "seo_articles_delete_admin"
  on public.seo_articles
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
