create or replace function get_admin_metrics()
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_users', (select count(*) from auth.users),
    'total_recipes', (select count(*) from public.recipes),
    'total_meal_plans', (select count(*) from public.meal_plans),
    'total_grocery_stores', (select count(*) from public.grocery_stores),
    'total_grocery_items', (select count(*) from public.grocery_items),
    'recipes_today', (
      select count(*) from public.recipes
      where created_at >= current_date
    ),
    'recipes_this_week', (
      select count(*) from public.recipes
      where created_at >= date_trunc('week', current_date)
    ),
    'recipes_this_month', (
      select count(*) from public.recipes
      where created_at >= date_trunc('month', current_date)
    ),
    'users_this_week', (
      select count(*) from auth.users
      where created_at >= date_trunc('week', current_date)
    ),
    'users_this_month', (
      select count(*) from auth.users
      where created_at >= date_trunc('month', current_date)
    ),
    'avg_recipes_per_user', (
      select coalesce(round(avg(cnt)::numeric, 1), 0)
      from (select count(*) as cnt from public.recipes group by user_id) sub
    ),
    'top_users', (
      select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      from (
        select u.email, count(r.id) as recipe_count
        from auth.users u
        left join public.recipes r on r.user_id = u.id
        group by u.id, u.email
        order by recipe_count desc
        limit 10
      ) t
    ),
    'top_categories', (
      select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      from (
        select cat as name, count(*) as count
        from public.recipes, unnest(categories) as cat
        group by cat
        order by count desc
        limit 10
      ) t
    ),
    'recipes_per_day', (
      select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
      from (
        select created_at::date as date, count(*) as count
        from public.recipes
        where created_at >= current_date - interval '30 days'
        group by created_at::date
        order by date
      ) t
    )
  ) into result;

  return result;
end;
$$;

grant execute on function get_admin_metrics() to authenticated;
