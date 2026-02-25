-- Store original uploaded document images alongside extracted recipes
alter table public.recipes add column source_images text[] default '{}';

-- Storage bucket for recipe document uploads (publicly readable)
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- Anyone can view recipe images (needed for display + Anthropic access)
create policy "Recipe images are publicly accessible"
  on storage.objects for select
  to public
  using (bucket_id = 'recipe-images');

-- Authenticated users can upload to their own folder
create policy "Users can upload recipe images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploads
create policy "Users can delete their own recipe images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
