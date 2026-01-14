-- Allow authenticated users to add THEMSELVES as a collaborator.
-- This enables "Join by Link" functionality.
-- Without this, the application code tries to insert the row, but Supabase blocks it.

-- Check if policy exists first (optional, but good practice if running in a script context, 
-- though Supabase SQL Editor handles raw CREATE POLICY fine usually, might error if duplicate).

create policy "Users can join cards (insert self)"
on collaborators for insert
with check (
    -- The user being added MUST be the user currently logged in.
    -- This prevents users from forcing OTHERS into cards.
    auth.uid() = user_id
);
