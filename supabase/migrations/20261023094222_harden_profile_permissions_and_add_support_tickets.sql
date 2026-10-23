begin;

-- Customers may edit profile fields only, never KYC or server-maintained columns.
revoke update on public.profiles from authenticated;
grant update (display_name, country, state_region, phone)
  on public.profiles to authenticated;

-- Authorized administrators can read cross-customer queues after MFA.
drop policy if exists profiles_select_admin_aal2 on public.profiles;
create policy profiles_select_admin_aal2
on public.profiles for select to authenticated
using (
  (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and (select auth.jwt()->>'aal') = 'aal2'
);

drop policy if exists transaction_requests_select_admin_aal2 on public.transaction_requests;
create policy transaction_requests_select_admin_aal2
on public.transaction_requests for select to authenticated
using (
  (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and (select auth.jwt()->>'aal') = 'aal2'
);

-- Persistent support tickets: customers can open/read their own, admins can respond.
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'general'
    check (category in ('account','security','deposit','withdrawal','trading','verification','general')),
  subject text not null check (length(trim(subject)) between 4 and 160),
  message text not null check (length(trim(message)) between 10 and 5000),
  status text not null default 'open'
    check (status in ('open','in_progress','waiting_on_customer','resolved','closed')),
  admin_response text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_user_created_idx
  on public.support_tickets(user_id, created_at desc);
create index if not exists support_tickets_status_created_idx
  on public.support_tickets(status, created_at desc);

alter table public.support_tickets enable row level security;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $function$
begin new.updated_at := now(); return new; end;
$function$;

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

drop policy if exists support_tickets_select_own_aal2 on public.support_tickets;
create policy support_tickets_select_own_aal2
on public.support_tickets for select to authenticated
using (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');

drop policy if exists support_tickets_insert_own_aal2 on public.support_tickets;
create policy support_tickets_insert_own_aal2
on public.support_tickets for insert to authenticated
with check (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');

drop policy if exists support_tickets_select_admin_aal2 on public.support_tickets;
create policy support_tickets_select_admin_aal2
on public.support_tickets for select to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin' and (select auth.jwt()->>'aal') = 'aal2');

drop policy if exists support_tickets_update_admin_aal2 on public.support_tickets;
create policy support_tickets_update_admin_aal2
on public.support_tickets for update to authenticated
using ((select auth.jwt()->'app_metadata'->>'role') = 'admin' and (select auth.jwt()->>'aal') = 'aal2')
with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin' and (select auth.jwt()->>'aal') = 'aal2');

drop policy if exists support_tickets_require_aal2 on public.support_tickets;
create policy support_tickets_require_aal2
on public.support_tickets as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2')
with check ((select auth.jwt()->>'aal') = 'aal2');

grant select on public.support_tickets to authenticated;
grant insert (user_id, category, subject, message) on public.support_tickets to authenticated;
revoke update on public.support_tickets from authenticated;
grant update (status, admin_response, resolved_at) on public.support_tickets to authenticated;

commit;
