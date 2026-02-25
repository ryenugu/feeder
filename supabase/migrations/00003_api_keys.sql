-- API keys table for iOS shortcut authentication
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'iOS Shortcut',
  key text not null unique,
  active boolean not null default true,
  created_at timestamptz default now() not null
);

create index api_keys_user_id_idx on public.api_keys(user_id);
create index api_keys_key_idx on public.api_keys(key) where active = true;

alter table public.api_keys enable row level security;

create policy "Users can view their own api keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own api keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own api keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);
