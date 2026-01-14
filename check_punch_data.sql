-- Let's check the Raw Data (Truth)
-- This will show us EXACTLY who punched and how many times.

select 
    p.punched_at, 
    u.email as punched_by
from punches p
join auth.users u on p.user_id = u.id
join cards c on p.card_id = c.id
where c.habit = 'another collabtest';
