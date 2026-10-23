begin;

drop policy if exists profiles_require_aal2 on public.profiles;
create policy profiles_require_aal2 on public.profiles as restrictive for all to authenticated
using (((select auth.jwt()) ->> 'aal') = 'aal2')
with check (((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists transaction_requests_require_aal2 on public.transaction_requests;
create policy transaction_requests_require_aal2 on public.transaction_requests as restrictive for all to authenticated
using (((select auth.jwt()) ->> 'aal') = 'aal2')
with check (((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists wallets_require_aal2 on public.wallets;
create policy wallets_require_aal2 on public.wallets as restrictive for all to authenticated
using (((select auth.jwt()) ->> 'aal') = 'aal2')
with check (((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists user_verifications_require_aal2 on public.user_verifications;
create policy user_verifications_require_aal2 on public.user_verifications as restrictive for all to authenticated
using (((select auth.jwt()) ->> 'aal') = 'aal2')
with check (((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists notifications_require_aal2 on public.notifications;
create policy notifications_require_aal2 on public.notifications as restrictive for all to authenticated
using (((select auth.jwt()) ->> 'aal') = 'aal2')
with check (((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists portfolio_snapshots_require_aal2 on public.portfolio_snapshots;
create policy portfolio_snapshots_require_aal2 on public.portfolio_snapshots as restrictive for all to authenticated
using (((select auth.jwt()) ->> 'aal') = 'aal2')
with check (((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists support_tickets_require_aal2 on public.support_tickets;
create policy support_tickets_require_aal2 on public.support_tickets as restrictive for all to authenticated
using (((select auth.jwt()) ->> 'aal') = 'aal2')
with check (((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists investment_plans_require_aal2 on public.investment_plans;
create policy investment_plans_require_aal2 on public.investment_plans as restrictive for all to authenticated
using (((select auth.jwt()) ->> 'aal') = 'aal2')
with check (((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_admin_aal2 on public.profiles;
create policy profiles_select_owner_or_admin_aal2 on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and ((select auth.jwt()) ->> 'aal') = 'aal2'
  )
);

drop policy if exists transaction_requests_select_own on public.transaction_requests;
drop policy if exists transaction_requests_select_admin_aal2 on public.transaction_requests;
create policy transaction_requests_select_owner_or_admin_aal2 on public.transaction_requests for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and ((select auth.jwt()) ->> 'aal') = 'aal2'
  )
);

drop policy if exists user_verifications_select_own on public.user_verifications;
drop policy if exists user_verifications_select_admin_aal2 on public.user_verifications;
create policy user_verifications_select_owner_or_admin_aal2 on public.user_verifications for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and ((select auth.jwt()) ->> 'aal') = 'aal2'
  )
);

drop policy if exists support_tickets_select_own_aal2 on public.support_tickets;
drop policy if exists support_tickets_select_admin_aal2 on public.support_tickets;
create policy support_tickets_select_owner_or_admin_aal2 on public.support_tickets for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and ((select auth.jwt()) ->> 'aal') = 'aal2'
  )
);

drop policy if exists fee_schedules_select_admin_aal2 on public.fee_schedules;
drop policy if exists fee_schedules_select_current_aal2 on public.fee_schedules;
create policy fee_schedules_select_current_or_admin_aal2 on public.fee_schedules for select to authenticated
using (
  (
    active = true
    and legally_reviewed = true
    and (effective_from is null or effective_from <= now())
    and ((select auth.jwt()) ->> 'aal') = 'aal2'
  )
  or (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and ((select auth.jwt()) ->> 'aal') = 'aal2'
  )
);

drop policy if exists ledger_accounts_select_own on public.ledger_accounts;
create policy ledger_accounts_select_own on public.ledger_accounts for select to authenticated
using (
  owner_user_id = (select auth.uid())
  and account_type = 'customer_liability'
  and ((select auth.jwt()) ->> 'aal') = 'aal2'
);

drop policy if exists ledger_entries_select_own on public.ledger_entries;
create policy ledger_entries_select_own on public.ledger_entries for select to authenticated
using (
  ((select auth.jwt()) ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.ledger_accounts a
    where a.id = ledger_entries.account_id
      and a.owner_user_id = (select auth.uid())
      and a.account_type = 'customer_liability'
  )
);

drop policy if exists ledger_journals_select_own_posted on public.ledger_journals;
create policy ledger_journals_select_own_posted on public.ledger_journals for select to authenticated
using (
  status = 'posted'
  and ((select auth.jwt()) ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.ledger_entries e
    join public.ledger_accounts a on a.id = e.account_id
    where e.journal_id = ledger_journals.id
      and a.owner_user_id = (select auth.uid())
      and a.account_type = 'customer_liability'
  )
);

drop policy if exists support_tickets_insert_own_aal2 on public.support_tickets;
create policy support_tickets_insert_own_aal2 on public.support_tickets for insert to authenticated
with check (user_id = (select auth.uid()) and ((select auth.jwt()) ->> 'aal') = 'aal2');

drop policy if exists support_tickets_update_admin_aal2 on public.support_tickets;
create policy support_tickets_update_admin_aal2 on public.support_tickets for update to authenticated
using (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  and ((select auth.jwt()) ->> 'aal') = 'aal2'
)
with check (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  and ((select auth.jwt()) ->> 'aal') = 'aal2'
);

commit;
