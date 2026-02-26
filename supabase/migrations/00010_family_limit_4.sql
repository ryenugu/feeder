-- Increase family member limit from 2 to 4
create or replace function check_family_member_limit()
returns trigger as $$
begin
  if (select count(*) from public.family_members where family_id = NEW.family_id) >= 4 then
    raise exception 'Family cannot have more than 4 members';
  end if;
  return NEW;
end;
$$ language plpgsql;
