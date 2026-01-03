-- SQL to wipe all data for a specific user (User C)
-- Use this to clean up the accidental migration

-- Replace 'THE_USER_ID_HERE' with User C's actual UUID  
-- (You can copy this ID from the "Authentication" tab or the `profiles` table)

DELETE FROM cards 
WHERE creator_id = '58c391c3-1a00-4621-887e-7aed1b11cafb';

-- This will cascade delete their punches, comments, and collaboration links on those cards.
