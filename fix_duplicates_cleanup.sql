-- Fix Duplicate Punches Script
-- This script deletes duplicate punches (same user, same card, same minute) keeping only the first one.

DELETE FROM punches
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY card_id, user_id, date_trunc('minute', punched_at)
             ORDER BY punched_at ASC
           ) as rnum
    FROM punches
  ) t
  WHERE t.rnum > 1
);
