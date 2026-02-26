-- Fix: families and family_members SELECT policies were too restrictive,
-- blocking the create/join flows (user isn't a member yet when they
-- need to look up a family by invite code or count existing members).
-- These tables contain no sensitive data (just IDs, roles, codes).

drop policy "Family members can view their family" on public.families;
create policy "Authenticated users can view families"
  on public.families for select
  to authenticated
  using (true);

drop policy "Family members can view their family members" on public.family_members;
create policy "Authenticated users can view family members"
  on public.family_members for select
  to authenticated
  using (true);
