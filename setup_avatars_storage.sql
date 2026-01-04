-- 1. Create the 'avatars' bucket (if it doesn't exist)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- NOTE: We skipped "alter table storage.objects enable row level security" 
-- because it often causes permission errors and is usually already enabled.

-- 2. Create Key Policies

-- Allow public access to view avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
create policy "Users can upload avatars"
  on storage.objects for insert
  with check ( 
    bucket_id = 'avatars' 
    and auth.role() = 'authenticated' 
  );

-- Allow users to update their own avatars
create policy "Users can update their own avatars"
  on storage.objects for update
  using ( 
    bucket_id = 'avatars' 
    and auth.uid() = owner 
  );

-- Allow users to delete their own avatars
create policy "Users can delete their own avatars"
  on storage.objects for delete
  using ( 
    bucket_id = 'avatars' 
    and auth.uid() = owner
  );
