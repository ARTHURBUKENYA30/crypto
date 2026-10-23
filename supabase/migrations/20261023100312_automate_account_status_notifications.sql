begin;

create or replace function public.notify_transaction_request_change()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare v_title text; v_body text;
begin
  if tg_op = 'INSERT' then
    v_title := 'Transaction request received';
    v_body := initcap(replace(new.request_type, '_', ' ')) || ' request for ' || new.amount::text || ' ' || new.asset_code
      || ' was recorded with status "' || replace(new.status, '_', ' ') || '".';
  elsif old.status is distinct from new.status then
    v_title := 'Transaction status updated';
    v_body := initcap(replace(new.request_type, '_', ' ')) || ' request for ' || new.amount::text || ' ' || new.asset_code
      || ' now has status "' || replace(new.status, '_', ' ') || '".';
  else return new; end if;
  insert into public.notifications (user_id, category, title, body)
  values (new.user_id, 'transaction', v_title, v_body);
  return new;
end;
$function$;
drop trigger if exists transaction_request_notify_customer on public.transaction_requests;
create trigger transaction_request_notify_customer after insert or update on public.transaction_requests
for each row execute function public.notify_transaction_request_change();

create or replace function public.notify_verification_change()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  if old.kyc_status is distinct from new.kyc_status then
    insert into public.notifications (user_id, category, title, body)
    values (new.id, 'security', 'Identity verification updated',
      'Your identity-verification status is now "' || replace(new.kyc_status, '_', ' ') || '".');
  end if;
  return new;
end;
$function$;
drop trigger if exists profile_verification_notify_customer on public.profiles;
create trigger profile_verification_notify_customer after update of kyc_status on public.profiles
for each row when (old.kyc_status is distinct from new.kyc_status)
execute function public.notify_verification_change();

create or replace function public.notify_wallet_change()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  if tg_op = 'UPDATE'
    and old.address_status is not distinct from new.address_status
    and old.deposit_address is not distinct from new.deposit_address then
    return new;
  end if;
  if new.address_status = 'active' and coalesce(new.deposit_address, '') <> '' then
    insert into public.notifications (user_id, category, title, body)
    values (new.user_id, 'wallet', 'Wallet address available',
      'A verified ' || new.asset_code || ' address for network ' || new.network
      || ' is available in Wallets. Verify the network carefully before transferring funds.');
  elsif tg_op = 'UPDATE' and old.address_status is distinct from new.address_status then
    insert into public.notifications (user_id, category, title, body)
    values (new.user_id, 'security', 'Wallet status updated',
      'Your ' || new.asset_code || ' wallet for network ' || new.network
      || ' now has status "' || replace(new.address_status, '_', ' ') || '".');
  end if;
  return new;
end;
$function$;
drop trigger if exists wallet_notify_customer on public.wallets;
create trigger wallet_notify_customer after insert or update on public.wallets
for each row execute function public.notify_wallet_change();

create or replace function public.notify_support_ticket_change()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare v_title text; v_body text;
begin
  if tg_op = 'INSERT' then
    v_title := 'Support request received';
    v_body := 'Your support request "' || new.subject || '" has been received. Current status: ' || replace(new.status, '_', ' ') || '.';
  elsif new.admin_response is distinct from old.admin_response and coalesce(new.admin_response, '') <> '' then
    v_title := 'Support team replied';
    v_body := 'The support team replied to "' || new.subject || '": ' || new.admin_response;
  elsif new.status is distinct from old.status then
    v_title := 'Support request status updated';
    v_body := 'Your support request "' || new.subject || '" is now "' || replace(new.status, '_', ' ') || '".';
  else return new; end if;
  insert into public.notifications (user_id, category, title, body)
  values (new.user_id, 'support', v_title, v_body);
  return new;
end;
$function$;
drop trigger if exists support_ticket_notify_customer on public.support_tickets;
create trigger support_ticket_notify_customer after insert or update on public.support_tickets
for each row execute function public.notify_support_ticket_change();

revoke all on function public.notify_transaction_request_change() from public, anon, authenticated;
revoke all on function public.notify_verification_change() from public, anon, authenticated;
revoke all on function public.notify_wallet_change() from public, anon, authenticated;
revoke all on function public.notify_support_ticket_change() from public, anon, authenticated;
commit;
