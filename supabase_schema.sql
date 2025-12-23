-- DATA RESET: Clean up existing tables
drop table if exists edit_requests cascade;
drop table if exists comments cascade;
drop table if exists followers cascade;
drop table if exists collaborators cascade;
drop table if exists punches cascade;
drop table if exists cards cascade;
drop table if exists profiles cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create TABLES

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cards (renamed from punch_cards)
create table cards (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references profiles(id) not null,
  habit text not null,
  reward text,
  expiration timestamp with time zone,
  category text,
  icon text,
  color text,
  celebration_sound text default 'confetti',
  punch_count int default 10,
  mode text check (mode in ('personal', 'collab', 'private')) default 'personal',
  is_private boolean default false,
  archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Punches
create table punches (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  punched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Collaborators
create table collaborators (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(card_id, user_id)
);

-- Followers
create table followers (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  followed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(card_id, user_id)
);

-- Comments & Cheers
create table comments (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  comment_text text,
  emoji text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Edit Requests (for collab mode)
create table edit_requests (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards(id) on delete cascade not null,
  requester_id uuid references profiles(id) not null,
  field_name text not null,
  proposed_value text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table profiles enable row level security;
alter table cards enable row level security;
alter table punches enable row level security;
alter table collaborators enable row level security;
alter table followers enable row level security;
alter table comments enable row level security;
alter table edit_requests enable row level security;

-- 3. Create POLICIES

-- Profiles: Anyone can view profiles, users can update their own
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile." on profiles for insert with check (auth.uid() = id);

-- Cards: 
-- 1. Creator can do anything
-- 2. Anyone can view non-private cards
-- 3. Collaborators/Followers can view cards (even if private)
create policy "Creators have full access to cards" on cards for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

create policy "Anyone can view non-private cards" on cards for select using (not is_private);

create policy "Collaborators can view private cards" on cards for select using (
  is_private and exists (select 1 from collaborators where card_id = id and user_id = auth.uid())
);

create policy "Followers can view private cards" on cards for select using (
  is_private and exists (select 1 from followers where card_id = id and user_id = auth.uid())
);

-- Punches:
-- 1. Anyone can view (breaks recursion, privacy handled by card access)
-- 2. Creator and Collaborators can punch
create policy "Punches are public select" on punches for select using (true);
create policy "Creators can punch" on punches for insert with check (
  exists (select 1 from cards where id = card_id and creator_id = auth.uid())
);
create policy "Collaborators can punch" on punches for insert with check (
  exists (select 1 from collaborators where card_id = card_id and user_id = auth.uid())
);

-- Collaborators:
-- 1. Anyone can view (breaks recursion)
-- 2. Creator can manage
create policy "Collaborators are public select" on collaborators for select using (true);

create policy "Creators can insert collaborators" on collaborators for insert with check (
  exists (select 1 from cards where id = card_id and creator_id = auth.uid())
);

create policy "Creators can update collaborators" on collaborators for update using (
  exists (select 1 from cards where id = card_id and creator_id = auth.uid())
) with check (
  exists (select 1 from cards where id = card_id and creator_id = auth.uid())
);

create policy "Creators can delete collaborators" on collaborators for delete using (
  exists (select 1 from cards where id = card_id and creator_id = auth.uid())
);

create policy "Users can join collab cards" on collaborators for insert with check (
  exists (select 1 from cards where id = card_id and mode = 'collab')
  and user_id = auth.uid()
);

-- Followers:
-- 1. Anyone can follow a non-private card
-- 2. Anyone can view followers (breaks recursion)
create policy "Users can follow cards" on followers for insert with check (exists (select 1 from cards where id = card_id and not is_private));
create policy "Followers are public select" on followers for select using (true);

-- Comments:
-- 1. Anyone can view (breaks recursion - privacy inherited by card access)
-- 2. Members can post
create policy "Comments are public select" on comments for select using (true);

create policy "Members can post comments" on comments for insert with check (
  exists (select 1 from cards where id = card_id and (
    creator_id = auth.uid() 
    or mode = 'collab'
  ))
);

create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- Edit Requests:
-- 1. Collaborators can request
-- 2. Creator can manage
-- 3. Members can view edit requests for the card
create policy "Collaborators can request edits" on edit_requests for insert with check (
  exists (select 1 from collaborators where card_id = card_id and user_id = auth.uid())
);

create policy "Creators can update edit requests" on edit_requests for update using (
  exists (select 1 from cards where id = card_id and creator_id = auth.uid())
) with check (
  exists (select 1 from cards where id = card_id and creator_id = auth.uid())
);

create policy "Creators can delete edit requests" on edit_requests for delete using (
  exists (select 1 from cards where id = card_id and creator_id = auth.uid())
);

create policy "Viewable by cards members" on edit_requests for select using (
  exists (select 1 from cards where id = card_id)
);
-- Note: Privacy for edit_requests is effectively governed by the fact that you can only see the card if you have access.

-- 4. Triggers for new users
-- This function automatically creates a profile when a new user signs up.
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 
    new.email, 
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- REPAIR SCRIPT for existing users (Run this if you get FK errors after a reset)
-- insert into public.profiles (id, display_name, email, avatar_url)
-- select 
--   id, 
--   coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), 
--   email, 
--   raw_user_meta_data->>'avatar_url'
-- from auth.users
-- on conflict (id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
