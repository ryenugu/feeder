-- Family sharing: families, members, invites, updated RLS

-- Families table
create table public.families (
  id uuid default gen_random_uuid() primary key,
  invite_code text not null unique,
  created_at timestamptz default now() not null
);

-- Family members (max 2 per family, enforced by trigger)
create table public.family_members (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz default now() not null
);

-- Family invites
create table public.family_invites (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  invited_by uuid references auth.users(id) on delete cascade not null,
  invite_email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now() not null,
  expires_at timestamptz default (now() + interval '7 days') not null
);

create index family_members_family_id_idx on public.family_members(family_id);
create index family_members_user_id_idx on public.family_members(user_id);
create index family_invites_family_id_idx on public.family_invites(family_id);
create index family_invites_email_idx on public.family_invites(invite_email);

-- Enforce max 2 members per family
create or replace function check_family_member_limit()
returns trigger as $$
begin
  if (select count(*) from public.family_members where family_id = NEW.family_id) >= 2 then
    raise exception 'Family cannot have more than 2 members';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger enforce_family_member_limit
  before insert on public.family_members
  for each row execute function check_family_member_limit();

-- Helper: returns all user_ids in the caller's family (including self)
create or replace function get_family_user_ids()
returns setof uuid as $$
  select fm2.user_id
  from public.family_members fm1
  join public.family_members fm2 on fm1.family_id = fm2.family_id
  where fm1.user_id = auth.uid()
  union
  select auth.uid()
$$ language sql security definer stable;

-- RLS for families
alter table public.families enable row level security;

create policy "Family members can view their family"
  on public.families for select
  using (id in (select family_id from public.family_members where user_id = auth.uid()));

create policy "Authenticated users can create families"
  on public.families for insert
  to authenticated
  with check (true);

create policy "Family owner can delete family"
  on public.families for delete
  using (id in (
    select family_id from public.family_members
    where user_id = auth.uid() and role = 'owner'
  ));

-- RLS for family_members
alter table public.family_members enable row level security;

create policy "Family members can view their family members"
  on public.family_members for select
  using (family_id in (select family_id from public.family_members fm where fm.user_id = auth.uid()));

create policy "Authenticated users can insert family members"
  on public.family_members for insert
  to authenticated
  with check (true);

create policy "Family owner can delete members"
  on public.family_members for delete
  using (
    family_id in (
      select family_id from public.family_members fm
      where fm.user_id = auth.uid() and fm.role = 'owner'
    )
    or user_id = auth.uid()
  );

-- RLS for family_invites
alter table public.family_invites enable row level security;

create policy "Family members can view invites for their family"
  on public.family_invites for select
  using (
    family_id in (select family_id from public.family_members where user_id = auth.uid())
    or invite_email in (select email from auth.users where id = auth.uid())
  );

create policy "Family owner can create invites"
  on public.family_invites for insert
  to authenticated
  with check (invited_by = auth.uid());

create policy "Invite creator can update invites"
  on public.family_invites for update
  using (
    invited_by = auth.uid()
    or invite_email in (select email from auth.users where id = auth.uid())
  );

create policy "Invite creator can delete invites"
  on public.family_invites for delete
  using (invited_by = auth.uid());

-- Helper: look up a user's email (only allowed for family members)
create or replace function get_user_email(target_user_id uuid)
returns text as $$
  select email from auth.users where id = target_user_id
$$ language sql security definer stable;

grant execute on function get_user_email(uuid) to authenticated;

-- ============================================================
-- Update existing RLS policies to support family sharing
-- ============================================================

-- RECIPES
drop policy "Users can view their own recipes" on public.recipes;
create policy "Users can view their own recipes"
  on public.recipes for select
  using (user_id in (select get_family_user_ids()));

drop policy "Users can update their own recipes" on public.recipes;
create policy "Users can update their own recipes"
  on public.recipes for update
  using (user_id in (select get_family_user_ids()));

drop policy "Users can delete their own recipes" on public.recipes;
create policy "Users can delete their own recipes"
  on public.recipes for delete
  using (user_id in (select get_family_user_ids()));

-- MEAL PLANS
drop policy "Users can view their own meal plans" on public.meal_plans;
create policy "Users can view their own meal plans"
  on public.meal_plans for select
  using (user_id in (select get_family_user_ids()));

drop policy "Users can update their own meal plans" on public.meal_plans;
create policy "Users can update their own meal plans"
  on public.meal_plans for update
  using (user_id in (select get_family_user_ids()));

drop policy "Users can delete their own meal plans" on public.meal_plans;
create policy "Users can delete their own meal plans"
  on public.meal_plans for delete
  using (user_id in (select get_family_user_ids()));

-- GROCERY STORES
drop policy "Users can view their own grocery stores" on public.grocery_stores;
create policy "Users can view their own grocery stores"
  on public.grocery_stores for select
  using (user_id in (select get_family_user_ids()));

drop policy "Users can update their own grocery stores" on public.grocery_stores;
create policy "Users can update their own grocery stores"
  on public.grocery_stores for update
  using (user_id in (select get_family_user_ids()));

drop policy "Users can delete their own grocery stores" on public.grocery_stores;
create policy "Users can delete their own grocery stores"
  on public.grocery_stores for delete
  using (user_id in (select get_family_user_ids()));

-- GROCERY ITEMS
drop policy "Users can view their own grocery items" on public.grocery_items;
create policy "Users can view their own grocery items"
  on public.grocery_items for select
  using (user_id in (select get_family_user_ids()));

drop policy "Users can update their own grocery items" on public.grocery_items;
create policy "Users can update their own grocery items"
  on public.grocery_items for update
  using (user_id in (select get_family_user_ids()));

drop policy "Users can delete their own grocery items" on public.grocery_items;
create policy "Users can delete their own grocery items"
  on public.grocery_items for delete
  using (user_id in (select get_family_user_ids()));

-- SUGGESTIONS
drop policy "Users can view their own suggestions" on public.suggestions;
create policy "Users can view their own suggestions"
  on public.suggestions for select
  using (user_id in (select get_family_user_ids()));

drop policy "Users can update their own suggestions" on public.suggestions;
create policy "Users can update their own suggestions"
  on public.suggestions for update
  using (user_id in (select get_family_user_ids()));

drop policy "Users can delete their own suggestions" on public.suggestions;
create policy "Users can delete their own suggestions"
  on public.suggestions for delete
  using (user_id in (select get_family_user_ids()));

-- ============================================================
-- Per-user favorites (personal to each user, even in a family)
-- ============================================================

create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, recipe_id)
);

create index favorites_user_id_idx on public.favorites(user_id);
create index favorites_recipe_id_idx on public.favorites(recipe_id);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Cooking assignments on meal plans
-- ============================================================

alter table public.meal_plans add column assigned_to uuid references auth.users(id) on delete set null;
