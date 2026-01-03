-- Migration: Add Guest Comments Support
-- Run this in your Supabase SQL Editor to update the existing database

-- 1. Alter comments table to support guest comments
ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS user_or_guest;
ALTER TABLE comments ADD CONSTRAINT user_or_guest CHECK ((user_id IS NOT NULL) OR (guest_name IS NOT NULL));

-- 2. Drop and recreate the comments INSERT policy to allow guest posting
DROP POLICY IF EXISTS "Members can post comments" ON comments;
DROP POLICY IF EXISTS "Anyone can post comments on non-private cards" ON comments;

CREATE POLICY "Anyone can post comments on non-private cards" ON comments FOR INSERT WITH CHECK (
  -- Authenticated users: existing logic
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM cards WHERE id = card_id AND (
      creator_id = auth.uid() 
      OR mode = 'collab'
    )
  ))
  -- OR Guest users: can comment on any non-private card
  OR (auth.uid() IS NULL AND EXISTS (
    SELECT 1 FROM cards WHERE id = card_id AND NOT is_private
  ))
);

-- 3. Update delete policy to handle guest comments properly
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

-- Migration complete!
-- You can now test guest cheering functionality
