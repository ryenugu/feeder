-- Recipes table
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  image_url text,
  source_url text not null,
  source_name text,
  total_time text,
  prep_time text,
  cook_time text,
  servings integer,
  ingredients jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  notes text,
  tags text[],
  created_at timestamptz default now() not null
);

-- Meal plans table
create table public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  planned_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz default now() not null
);

-- Indexes
create index recipes_user_id_idx on public.recipes(user_id);
create index recipes_created_at_idx on public.recipes(created_at desc);
create index meal_plans_user_id_idx on public.meal_plans(user_id);
create index meal_plans_date_idx on public.meal_plans(planned_date);

-- Row Level Security
alter table public.recipes enable row level security;
alter table public.meal_plans enable row level security;

create policy "Users can view their own recipes"
  on public.recipes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recipes"
  on public.recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
  on public.recipes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own recipes"
  on public.recipes for delete
  using (auth.uid() = user_id);

create policy "Users can view their own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meal plans"
  on public.meal_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own meal plans"
  on public.meal_plans for delete
  using (auth.uid() = user_id);
