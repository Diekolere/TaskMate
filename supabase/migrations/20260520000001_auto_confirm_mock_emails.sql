-- Auto-confirm any signup where the account is a Service Pro (role metadata is 'provider').
-- This confirms both their phone and email instantly, preventing 
-- Supabase from sending real SMS/Emails, bypassing testing costs.
-- Regular customers registering with email will still receive normal verification emails.

create or replace function public.auto_confirm_providers()
returns trigger as $$
begin
  if (new.raw_user_meta_data->>'role' = 'provider') then
    new.phone_confirmed_at := now();
    new.email_confirmed_at := now();
    new.confirmed_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists
drop trigger if exists tr_auto_confirm_providers on auth.users;

-- Create trigger
create trigger tr_auto_confirm_providers
  before insert on auth.users
  for each row
  execute function public.auto_confirm_providers();
