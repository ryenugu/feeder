-- AI-generated recipe suggestions
create table public.suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_data jsonb not null,
  reason text not null,
  status text not null default 'active',
  batch_id uuid not null,
  created_at timestamptz default now() not null
);

create index idx_suggestions_user on public.suggestions(user_id);
create index idx_suggestions_active on public.suggestions(user_id, status) where status = 'active';

alter table public.suggestions enable row level security;

create policy "Users can view their own suggestions"
  on public.suggestions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own suggestions"
  on public.suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own suggestions"
  on public.suggestions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own suggestions"
  on public.suggestions for delete
  using (auth.uid() = user_id);
