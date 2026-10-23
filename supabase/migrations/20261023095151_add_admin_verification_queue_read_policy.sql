begin;
drop policy if exists user_verifications_select_admin_aal2 on public.user_verifications;
create policy user_verifications_select_admin_aal2
on public.user_verifications for select to authenticated
using (
  (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and (select auth.jwt()->>'aal') = 'aal2'
);
commit;