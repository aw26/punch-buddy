-- SQL Query to Remove Duplicate Cards
-- usage: Run this in the Supabase SQL Editor

-- 1. Identify duplicates based on creator and habit name
-- 2. Keep the one that was punch most recently OR created most recently
-- 3. Delete the rest using CASCADE (removes associated punches/comments)

DELETE FROM cards
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY creator_id, habit 
        ORDER BY created_at ASC -- Keep the OLDEST (original) one, delete newer duplicates
      ) as rn
    FROM cards
  ) t
  WHERE t.rn > 1
);

-- Note: changing ORDER BY created_at DESC would keep the NEWEST one.
-- Often in migration loops, the first one is the "real" one and subsequent ones are accidental copies.
