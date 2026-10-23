-- GROEarnX account, transaction-history, ledger, wallet and MFA data foundation.
-- This migration deliberately does not seed customer funds, wallet addresses, or investment plans.
begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  country text not null default '',
  state_region text not null default '',
  phone text not null default '',
  kyc_status text not null default 'not_started'
    check (kyc_status in ('not_started','pending','verified','rejected','needs_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transaction_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('deposit','withdrawal','buy','sell')),
  asset_code text not null check (length(asset_code) between 2 and 20),
  amount numeric(38,18) not null check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending','under_review','processing','confirmed','completed','failed','rejected','cancelled')),
  network text,
  provider_name text,
  provider_reference text,
  destination_address text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index if not exists transaction_requests_user_created_idx on public.transaction_requests(user_id, created_at desc);
create index if not exists transaction_requests_status_created_idx on public.transaction_requests(status, created_at desc);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_code text not null,
  network text not null,
  deposit_address text,
  provider_name text,
  provider_reference text,
  address_status text not null default 'pending'
    check (address_status in ('pending','active','suspended','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, asset_code, network)
);
create index if not exists wallets_user_idx on public.wallets(user_id);

create table if not exists public.ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete restrict,
  account_code text unique,
  account_type text not null
    check (account_type in ('customer_liability','platform_asset','platform_liability','fee_revenue','expense','clearing')),
  asset_code text not null,
  created_at timestamptz not null default now(),
  unique (owner_user_id, account_type, asset_code)
);

create table if not exists public.ledger_journals (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'draft' check (status in ('draft','posted','reversed')),
  description text not null default '',
  provider_name text,
  provider_reference text,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.ledger_journals(id) on delete restrict,
  account_id uuid not null references public.ledger_accounts(id) on delete restrict,
  side text not null check (side in ('debit','credit')),
  amount numeric(38,18) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists ledger_entries_journal_idx on public.ledger_entries(journal_id);
create index if not exists ledger_entries_account_idx on public.ledger_entries(account_id);

create table if not exists public.user_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_name text,
  provider_reference text,
  status text not null default 'not_started'
    check (status in ('not_started','pending','verified','rejected','needs_review')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_name, provider_reference)
);

create table if not exists public.investment_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  asset_code text not null,
  minimum_amount numeric(38,18) not null default 0 check (minimum_amount >= 0),
  maximum_amount numeric(38,18) check (maximum_amount is null or maximum_amount >= minimum_amount),
  term_days integer not null default 0 check (term_days >= 0),
  target_return_apr numeric(12,6),
  return_type text not null default 'variable',
  fees_disclosure text not null default '',
  risk_disclosure text not null default '',
  terms_url text,
  active boolean not null default false,
  legally_reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'account',
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table if not exists public.portfolio_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_value_usd numeric(38,8) not null check (total_value_usd >= 0),
  captured_at timestamptz not null default now(),
  source text not null default 'server'
);
create index if not exists portfolio_snapshots_user_captured_idx on public.portfolio_snapshots(user_id, captured_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $function$
begin new.updated_at := now(); return new; end;
$function$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists transaction_requests_set_updated_at on public.transaction_requests;
create trigger transaction_requests_set_updated_at before update on public.transaction_requests for each row execute function public.set_updated_at();
drop trigger if exists wallets_set_updated_at on public.wallets;
create trigger wallets_set_updated_at before update on public.wallets for each row execute function public.set_updated_at();
drop trigger if exists user_verifications_set_updated_at on public.user_verifications;
create trigger user_verifications_set_updated_at before update on public.user_verifications for each row execute function public.set_updated_at();
drop trigger if exists investment_plans_set_updated_at on public.investment_plans;
create trigger investment_plans_set_updated_at before update on public.investment_plans for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  insert into public.profiles (id, display_name, country, state_region)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(new.raw_user_meta_data ->> 'country', ''),
    coalesce(new.raw_user_meta_data ->> 'state_region', '')
  ) on conflict (id) do nothing;
  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.prevent_posted_journal_mutation()
returns trigger language plpgsql set search_path = ''
as $function$
declare
  v_journal_id uuid;
  v_status text;
begin
  v_journal_id := case when tg_op = 'DELETE' then old.journal_id else new.journal_id end;
  select status into v_status from public.ledger_journals where id = v_journal_id;
  if v_status = 'posted' then raise exception 'Entries in a posted ledger journal are immutable'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;
drop trigger if exists ledger_entries_immutable on public.ledger_entries;
create trigger ledger_entries_immutable before update or delete on public.ledger_entries for each row execute function public.prevent_posted_journal_mutation();

create or replace function public.prevent_posted_journal_mutation_update()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  if old.status = 'posted' and new is distinct from old then raise exception 'Posted ledger journals are immutable'; end if;
  if new.status = 'posted' and old.status <> 'posted' then
    if (select count(*) from public.ledger_entries where journal_id = new.id) < 2 then
      raise exception 'A posted journal must contain at least two entries';
    end if;
    if exists (
      select 1 from public.ledger_entries e
      join public.ledger_accounts a on a.id = e.account_id
      where e.journal_id = new.id
      group by a.asset_code
      having sum(case when e.side = 'debit' then e.amount else -e.amount end) <> 0
    ) then raise exception 'Every posted ledger journal must balance for each asset'; end if;
    new.posted_at := coalesce(new.posted_at, now());
  end if;
  return new;
end;
$function$;
drop trigger if exists ledger_journals_immutable on public.ledger_journals;
create trigger ledger_journals_immutable before update on public.ledger_journals for each row execute function public.prevent_posted_journal_mutation_update();

create or replace function public.prevent_posted_journal_delete()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  if old.status = 'posted' then raise exception 'Posted ledger journals cannot be deleted'; end if;
  return old;
end;
$function$;
drop trigger if exists ledger_journals_no_delete on public.ledger_journals;
create trigger ledger_journals_no_delete before delete on public.ledger_journals for each row execute function public.prevent_posted_journal_delete();

create or replace function public.get_my_asset_balances()
returns table (asset_code text, balance numeric)
language sql stable security definer set search_path = ''
as $function$
  select a.asset_code,
         coalesce(sum(case when e.side = 'credit' then e.amount else -e.amount end), 0)::numeric as balance
  from public.ledger_accounts a
  left join public.ledger_entries e on e.account_id = a.id
    and exists (select 1 from public.ledger_journals j where j.id = e.journal_id and j.status = 'posted')
  where a.owner_user_id = (select auth.uid())
    and a.account_type = 'customer_liability'
    and (select auth.jwt()->>'aal') = 'aal2'
  group by a.asset_code
  order by a.asset_code;
$function$;

alter table public.profiles enable row level security;
alter table public.transaction_requests enable row level security;
alter table public.wallets enable row level security;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_journals enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.user_verifications enable row level security;
alter table public.investment_plans enable row level security;
alter table public.notifications enable row level security;
alter table public.portfolio_snapshots enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists transaction_requests_select_own on public.transaction_requests;
create policy transaction_requests_select_own on public.transaction_requests for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists wallets_select_own on public.wallets;
create policy wallets_select_own on public.wallets for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists user_verifications_select_own on public.user_verifications;
create policy user_verifications_select_own on public.user_verifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists investment_plans_select_reviewed on public.investment_plans;
create policy investment_plans_select_reviewed on public.investment_plans for select to authenticated using (active = true and legally_reviewed = true);
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists portfolio_snapshots_select_own on public.portfolio_snapshots;
create policy portfolio_snapshots_select_own on public.portfolio_snapshots for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists profiles_require_aal2 on public.profiles;
create policy profiles_require_aal2 on public.profiles as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
drop policy if exists transaction_requests_require_aal2 on public.transaction_requests;
create policy transaction_requests_require_aal2 on public.transaction_requests as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
drop policy if exists wallets_require_aal2 on public.wallets;
create policy wallets_require_aal2 on public.wallets as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
drop policy if exists user_verifications_require_aal2 on public.user_verifications;
create policy user_verifications_require_aal2 on public.user_verifications as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
drop policy if exists notifications_require_aal2 on public.notifications;
create policy notifications_require_aal2 on public.notifications as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');
drop policy if exists portfolio_snapshots_require_aal2 on public.portfolio_snapshots;
create policy portfolio_snapshots_require_aal2 on public.portfolio_snapshots as restrictive for all to authenticated
using ((select auth.jwt()->>'aal') = 'aal2') with check ((select auth.jwt()->>'aal') = 'aal2');

grant usage on schema public to anon, authenticated, service_role;
grant select, update on public.profiles to authenticated;
grant select on public.transaction_requests, public.wallets, public.user_verifications, public.investment_plans, public.portfolio_snapshots to authenticated;
grant select, update on public.notifications to authenticated;
revoke all on public.ledger_accounts, public.ledger_journals, public.ledger_entries from anon, authenticated;
grant all on public.ledger_accounts, public.ledger_journals, public.ledger_entries to service_role;

revoke all on function public.get_my_asset_balances() from public, anon;
grant execute on function public.get_my_asset_balances() to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_posted_journal_mutation() from public, anon, authenticated;
revoke all on function public.prevent_posted_journal_mutation_update() from public, anon, authenticated;
revoke all on function public.prevent_posted_journal_delete() from public, anon, authenticated;

commit;
