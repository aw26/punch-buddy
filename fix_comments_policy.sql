-- Fix for RLS Policy preventing authenticated users (who are not creators) from commenting on public cards.

-- Drop the restrictive policy
drop policy if exists "Anyone can post comments on non-private cards" on comments;

-- Re-create with corrected logic
create policy "Anyone can post comments on non-private cards" on comments for insert with check (
    -- 1. If the card is NOT private, ANYONE can comment (Auth or Guest)
    exists (
        select 1 from cards where id = card_id and not is_private
    )
    OR
    -- 2. If the card IS private, check specific access for Authenticated users
    (auth.uid() is not null and exists (
        select 1 from cards where id = card_id and is_private and (
            creator_id = auth.uid() 
            or exists (select 1 from collaborators where card_id = cards.id and user_id = auth.uid())
            or exists (select 1 from followers where card_id = cards.id and user_id = auth.uid())
        )
    ))
);
