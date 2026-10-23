begin;

create or replace function public.prevent_ledger_entry_insert_after_posting()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare v_status text;
begin
  select status into v_status
  from public.ledger_journals
  where id = new.journal_id;

  if v_status = 'posted' then
    raise exception 'Cannot insert entries into a posted ledger journal';
  end if;
  return new;
end;
$function$;

drop trigger if exists ledger_entries_block_insert_into_posted on public.ledger_entries;
create trigger ledger_entries_block_insert_into_posted
before insert on public.ledger_entries
for each row execute function public.prevent_ledger_entry_insert_after_posting();

create or replace function public.prevent_direct_posted_journal_insert()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.status = 'posted' then
    raise exception 'Create the journal as draft, add entries, then post through the validated state transition';
  end if;
  return new;
end;
$function$;

drop trigger if exists ledger_journals_require_validated_post on public.ledger_journals;
create trigger ledger_journals_require_validated_post
before insert on public.ledger_journals
for each row execute function public.prevent_direct_posted_journal_insert();

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

revoke all on function public.prevent_ledger_entry_insert_after_posting() from public, anon, authenticated;
revoke all on function public.prevent_direct_posted_journal_insert() from public, anon, authenticated;

commit;
