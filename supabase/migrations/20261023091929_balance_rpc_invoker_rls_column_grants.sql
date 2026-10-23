begin;

-- Keep the customer-facing balance RPC under invoker privileges.
create or replace function public.get_my_asset_balances()
returns table (asset_code text, balance numeric)
language sql
stable
security invoker
set search_path = ''
as $function$
  select a.asset_code,
         coalesce(sum(case when e.side = 'credit' then e.amount else -e.amount end), 0)::numeric as balance
  from public.ledger_accounts a
  left join public.ledger_entries e on e.account_id = a.id
    and exists (
      select 1 from public.ledger_journals j
      where j.id = e.journal_id and j.status = 'posted'
    )
  where a.owner_user_id = (select auth.uid())
    and a.account_type = 'customer_liability'
    and (select auth.jwt()->>'aal') = 'aal2'
  group by a.asset_code
  order by a.asset_code;
$function$;

alter table public.ledger_accounts enable row level security;
alter table public.ledger_journals enable row level security;
alter table public.ledger_entries enable row level security;

drop policy if exists ledger_accounts_select_own on public.ledger_accounts;
create policy ledger_accounts_select_own
on public.ledger_accounts for select to authenticated
using (
  owner_user_id = (select auth.uid())
  and account_type = 'customer_liability'
  and (select auth.jwt()->>'aal') = 'aal2'
);

drop policy if exists ledger_entries_select_own on public.ledger_entries;
create policy ledger_entries_select_own
on public.ledger_entries for select to authenticated
using (
  (select auth.jwt()->>'aal') = 'aal2'
  and exists (
    select 1 from public.ledger_accounts a
    where a.id = ledger_entries.account_id
      and a.owner_user_id = (select auth.uid())
      and a.account_type = 'customer_liability'
  )
);

drop policy if exists ledger_journals_select_own_posted on public.ledger_journals;
create policy ledger_journals_select_own_posted
on public.ledger_journals for select to authenticated
using (
  status = 'posted'
  and (select auth.jwt()->>'aal') = 'aal2'
  and exists (
    select 1
    from public.ledger_entries e
    join public.ledger_accounts a on a.id = e.account_id
    where e.journal_id = ledger_journals.id
      and a.owner_user_id = (select auth.uid())
      and a.account_type = 'customer_liability'
  )
);

revoke all privileges on public.ledger_accounts, public.ledger_journals, public.ledger_entries from anon, authenticated;

grant select (id, owner_user_id, account_type, asset_code)
  on public.ledger_accounts to authenticated;
grant select (id, status)
  on public.ledger_journals to authenticated;
grant select (journal_id, account_id, side, amount)
  on public.ledger_entries to authenticated;

revoke all on function public.get_my_asset_balances() from public, anon;
grant execute on function public.get_my_asset_balances() to authenticated;

commit;
