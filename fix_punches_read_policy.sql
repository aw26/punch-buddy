-- Fix inconsistent visibility of Punches
-- The issue was likely that Authenticated users were restricted to seeing ONLY their own punches,
-- while Anonymous users (via the Invite page) could see ALL punches.

-- 1. Drop the old/conflicting policies
drop policy if exists "Punches are viewable by card access" on punches;
drop policy if exists "Punches viewable by everyone" on punches;
-- (Add any other potentially conflicting SELECT names if known, but these are safe guesses)

-- 2. Create a SINGLE, unified policy for viewing punches
create policy "Everyone can see punches of accessible cards"
on punches for select
using (
  exists (
    select 1 from cards
    where cards.id = punches.card_id
    and (
      -- 1. If the card is public/not private, ANYONE can see punches
      cards.is_private = false
      
      -- 2. OR if the viewer is the Creator
      or cards.creator_id = auth.uid()
      
      -- 3. OR if the viewer is a Collaborator
      or exists (
         select 1 from collaborators
         where collaborators.card_id = cards.id
         and collaborators.user_id = auth.uid()
      )
      
      -- 4. OR if the viewer is a Follower
      or exists (
         select 1 from followers
         where followers.card_id = cards.id
         and followers.user_id = auth.uid()
      )
    )
  )
);
