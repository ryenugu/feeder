-- Grocery stores table
create table public.grocery_stores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now() not null
);

-- Grocery items table
create table public.grocery_items (
  id uuid default gen_random_uuid() primary key,
  store_id uuid references public.grocery_stores(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  checked boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz default now() not null
);

-- Indexes
create index grocery_stores_user_id_idx on public.grocery_stores(user_id);
create index grocery_items_store_id_idx on public.grocery_items(store_id);
create index grocery_items_user_id_idx on public.grocery_items(user_id);

-- Row Level Security
alter table public.grocery_stores enable row level security;
alter table public.grocery_items enable row level security;

create policy "Users can view their own grocery stores"
  on public.grocery_stores for select
  using (auth.uid() = user_id);

create policy "Users can insert their own grocery stores"
  on public.grocery_stores for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own grocery stores"
  on public.grocery_stores for update
  using (auth.uid() = user_id);

create policy "Users can delete their own grocery stores"
  on public.grocery_stores for delete
  using (auth.uid() = user_id);

create policy "Users can view their own grocery items"
  on public.grocery_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own grocery items"
  on public.grocery_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own grocery items"
  on public.grocery_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own grocery items"
  on public.grocery_items for delete
  using (auth.uid() = user_id);
