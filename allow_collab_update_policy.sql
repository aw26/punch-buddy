-- Drop the old restricted policy
DROP POLICY IF EXISTS "Users can update their own cards" ON cards;

-- Create new policy allowing Creators AND Collaborators to update status (e.g. Archive)
CREATE POLICY "Users can update status of their own cards or collab cards"
ON cards FOR UPDATE
USING (
  auth.uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM collaborators
    WHERE collaborators.card_id = cards.id
    AND collaborators.user_id = auth.uid()
  )
);
