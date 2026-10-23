begin;

create table if not exists public.fee_schedules (
  id uuid primary key default gen_random_uuid(),
  service_code text not null
    check (service_code in ('crypto_deposit','crypto_withdrawal','fiat_deposit','fiat_withdrawal','trade_buy','trade_sell')),
  display_name text not null check (length(trim(display_name)) between 3 and 120),
  asset_code text,
  network text,
  country_code text,
  fee_currency text not null,
  fixed_fee numeric(38,18) check (fixed_fee is null or fixed_fee >= 0),
  fee_percentage numeric(12,8) check (fee_percentage is null or fee_percentage >= 0),
  minimum_amount numeric(38,18) check (minimum_amount is null or minimum_amount >= 0),
  maximum_amount numeric(38,18) check (maximum_amount is null or maximum_amount > 0),
  daily_limit numeric(38,18) check (daily_limit is null or daily_limit >= 0),
  monthly_limit numeric(38,18) check (monthly_limit is null or monthly_limit >= 0),
  terms text not null default '',
  active boolean not null default false,
  legally_reviewed boolean not null default false,
  effective_from timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fee_schedule_has_fee check (fixed_fee is not null or fee_percentage is not null),
  constraint fee_schedule_amount_order check (
    minimum_amount is null or maximum_amount is null or maximum_amount >= minimum_amount
  )
);

create index if not exists fee_schedules_public_lookup_idx
  on public.fee_schedules(service_code, country_code, asset_code, network)
  where active = true and legally_reviewed = true;

alter table public.fee_schedules enable row level security;
drop policy if exists fee_schedules_select_current_aal2 on public.fee_schedules;
create policy fee_schedules_select_current_aal2
on public.fee_schedules for select to authenticated
using (
  active = true
  and legally_reviewed = true
  and (effective_from is null or effective_from <= now())
  and (select auth.jwt()->>'aal') = 'aal2'
);

drop policy if exists fee_schedules_select_admin_aal2 on public.fee_schedules;
create policy fee_schedules_select_admin_aal2
on public.fee_schedules for select to authenticated
using (
  (select auth.jwt()->'app_metadata'->>'role') = 'admin'
  and (select auth.jwt()->>'aal') = 'aal2'
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $function$
begin new.updated_at := now(); return new; end;
$function$;

drop trigger if exists fee_schedules_set_updated_at on public.fee_schedules;
create trigger fee_schedules_set_updated_at
before update on public.fee_schedules for each row execute function public.set_updated_at();

grant select on public.fee_schedules to authenticated;
revoke insert, update, delete on public.fee_schedules from anon, authenticated;
grant all on public.fee_schedules to service_role;

commit;
