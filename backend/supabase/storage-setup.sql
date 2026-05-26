-- Run once in Supabase Dashboard → SQL Editor (Storage → buckets can also be created in UI).
-- Buckets must be PUBLIC so listing images load in the browser without signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-images', 'listing-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('drawings', 'drawings', true, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for anonymous users (required if bucket policies are enforced)
drop policy if exists "Public read listing images" on storage.objects;
create policy "Public read listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

drop policy if exists "Public read drawings" on storage.objects;
create policy "Public read drawings"
  on storage.objects for select
  using (bucket_id = 'drawings');
