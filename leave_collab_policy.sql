-- Allow collaborators to remove THEMSELVES from a card (Leave Collab)
-- Replaces/Adds to the 'Collaborators' policies

-- First, drop the policy if it exists (or similar ones) to avoid conflicts if we were broader
-- The existing policy "Creators can delete collaborators" covers the owner removing people.
-- We need a new one for "Self removal".

create policy "Collaborators can leave (delete self)" on collaborators for delete using (
  auth.uid() = user_id
);
