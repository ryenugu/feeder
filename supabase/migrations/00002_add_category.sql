-- Add categories array column to recipes table
alter table recipes add column categories text[] default '{}';

-- Create GIN index for efficient array containment queries
create index recipes_categories_idx on recipes using gin (categories);
