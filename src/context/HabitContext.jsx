import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadHabits, saveHabits } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

const HabitContext = createContext();

export const useHabits = () => {
    const context = useContext(HabitContext);
    if (!context) {
        throw new Error('useHabits must be used within a HabitProvider');
    }
    return context;
};

export const HabitProvider = ({ children }) => {
    const { user } = useAuth();
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [celebration, setCelebration] = useState(null);
    const migratedUsers = React.useRef(new Set());
    const [onboardingAction, setOnboardingAction] = useState(null); // { type: 'join'|'follow'|'new', cardId }

    // Clear migration history on logout so re-logins can migrate new data
    useEffect(() => {
        if (!user) {
            migratedUsers.current.clear();
        }
    }, [user]);

    // Fetch habits handling both Local and Remote
    useEffect(() => {
        let mounted = true;

        const ensureProfile = async (u) => {
            if (!u) return;
            const { data } = await supabase.from('profiles').select('id').eq('id', u.id).maybeSingle();
            if (!data) {
                console.log('Profile missing, creating for user:', u.id);
                await supabase.from('profiles').insert({
                    id: u.id,
                    display_name: u.user_metadata?.display_name || u.email?.split('@')[0] || 'User',
                    email: u.email,
                    avatar_url: u.user_metadata?.avatar_url
                });
            }
        };

        const migrateLocalHabits = async (userId) => {
            // Strict Mode Protection: Prevent double-invocation
            if (migratedUsers.current.has(userId)) {
                console.log('Already migrated for this user session:', userId);
                return;
            }
            migratedUsers.current.add(userId);

            const localHabits = loadHabits();
            if (!localHabits || localHabits.length === 0) {
                console.log('No local habits to migrate.');
                return;
            }

            console.log('Starting migration of local habits for user:', userId, 'Count:', localHabits.length);
            let migrationCount = 0;
            let errorCount = 0;

            for (const habit of localHabits) {
                // Check if already migrated (deduplication check)
                // We use matching created_at logic since we preserve the original timestamp
                const { data: existing } = await supabase
                    .from('cards')
                    .select('id')
                    .eq('creator_id', userId)
                    .eq('habit', habit.title)
                    .eq('created_at', habit.createdAt)
                    .maybeSingle();

                if (existing) {
                    console.log('Skipping duplicate migration for:', habit.title);
                    migrationCount++; // Count as success to ensure we clear local eventually
                    continue;
                }

                // Insert card
                const { data: card, error: cardError } = await supabase.from('cards').insert({
                    creator_id: userId,
                    habit: habit.title,
                    punch_count: habit.punchCount || 10,
                    reward: habit.reward,
                    category: habit.category,
                    expiration: habit.expiresAt || null,
                    icon: habit.icon,
                    color: habit.color,
                    celebration_sound: habit.sound,
                    mode: 'personal',
                    is_private: false,
                    created_at: habit.createdAt
                }).select().single();

                if (cardError) {
                    console.error('Error migrating card:', habit.title, cardError);
                    errorCount++;
                    continue;
                }

                // Insert punches if any
                if (habit.punches && habit.punches.length > 0) {
                    const punchesToInsert = habit.punches.map(p => ({
                        card_id: card.id,
                        user_id: userId,
                        punched_at: p
                    }));
                    const { error: punchError } = await supabase.from('punches').insert(punchesToInsert);
                    if (punchError) console.error('Error migrating punches:', punchError);
                }
                migrationCount++;
            }

            console.log(`Migration complete. Success: ${migrationCount}, Errors: ${errorCount}`);

            // Clear local storage only if we successfully migrated something or tried to
            if (migrationCount > 0) {
                saveHabits([]);
                console.log('Local habits cleared.');
                // Force refresh
                await fetchHabits();
            }
        };

        const fetchHabits = async () => {
            if (!user) {
                // Guest mode: LocalStorage
                const localHabits = loadHabits();
                if (mounted) {
                    setHabits(localHabits);
                    setLoading(false);
                }
                return;
            }

            // Authenticated: Supabase
            try {
                // Step 1: Get cards I created
                const { data: created, error: e1 } = await supabase
                    .from('cards')
                    .select('id')
                    .eq('creator_id', user.id);
                if (e1) throw e1;

                // Step 2: Get cards I am a collaborator on
                const { data: collab, error: e2 } = await supabase
                    .from('collaborators')
                    .select('card_id')
                    .eq('user_id', user.id);
                if (e2) throw e2;

                // Step 3: Get cards I follow
                const { data: following, error: e3 } = await supabase
                    .from('followers')
                    .select('card_id')
                    .eq('user_id', user.id);
                if (e3) throw e3;

                // Combine IDs
                const myCardIds = new Set([
                    ...created.map(c => c.id),
                    ...collab.map(c => c.card_id),
                    ...following.map(c => c.card_id)
                ]);

                if (myCardIds.size === 0) {
                    if (mounted) {
                        setHabits([]);
                        setLoading(false);
                    }
                    return;
                }

                // Step 4: Fetch details for these specific cards
                const { data: cards, error } = await supabase
                    .from('cards')
                    .select('*, punches(punched_at), collaborators(user_id, profiles(display_name)), followers(user_id, profiles(display_name)), comments(*, profiles(display_name)), creator:creator_id(display_name, email)')
                    .in('id', Array.from(myCardIds));

                if (error) throw error;

                // Transform to internal shape
                const formatted = cards.map(c => ({
                    id: c.id,
                    createdAt: c.created_at,
                    title: c.habit,
                    reward: c.reward || '',
                    icon: c.icon,
                    color: c.color,
                    sound: c.celebration_sound,
                    expiresAt: c.expiration,
                    category: c.category || '',
                    archived: c.archived,
                    mode: c.mode,
                    punchCount: parseInt(c.punch_count, 10) || 10,
                    creatorId: c.creator_id,
                    creatorName: c.creator?.display_name || c.creator?.email?.split('@')[0] || 'Unknown',
                    collaborators: c.collaborators || [],
                    followers: c.followers || [],
                    comments: c.comments || [],
                    punches: c.punches.map(p => p.punched_at) // Array of ISO strings
                }));

                if (mounted) {
                    setHabits(formatted);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error loading Supabase data:', err);
                if (mounted) setLoading(false);
            }
        };



        // ... (rest of provider code)

        // Initial fetch and one-time migration
        const init = async () => {
            if (user?.id) {
                await ensureProfile(user);
                await migrateLocalHabits(user.id);

                // Auto-join logic (URL or Cross-tab LocalStorage)
                const params = new URLSearchParams(window.location.search);
                const joinId = params.get('join') || localStorage.getItem('pending_join');
                const followId = params.get('follow') || localStorage.getItem('pending_follow');

                if (joinId) {
                    console.log('Executing persistent auto-join for:', joinId);
                    await joinCollab(joinId);
                    setOnboardingAction({ type: 'join', cardId: joinId });

                    // Cleanup
                    localStorage.removeItem('pending_join');
                    const newUrl = window.location.pathname + window.location.search.replace(/[?&]join=[^&]+/, '').replace(/^&/, '?');
                    window.history.replaceState({}, '', newUrl);
                } else if (followId) {
                    console.log('Executing persistent auto-follow for:', followId);
                    await followCard(followId);
                    setOnboardingAction({ type: 'follow', cardId: followId });

                    // Cleanup
                    localStorage.removeItem('pending_follow');
                    const newUrl = window.location.pathname + window.location.search.replace(/[?&]follow=[^&]+/, '').replace(/^&/, '?');
                    window.history.replaceState({}, '', newUrl);
                }
            }
            await fetchHabits();
        };

        init();

        // Realtime Subscription if User
        let channel;
        if (user) {
            channel = supabase
                .channel('habit_updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'cards' },
                    () => fetchHabits()
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'punches' },
                    () => fetchHabits()
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'collaborators' },
                    () => fetchHabits()
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'comments' },
                    () => fetchHabits()
                )
                .subscribe();
        }

        return () => {
            mounted = false;
            if (channel) supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // Save to LocalStorage if Guest
    useEffect(() => {
        if (!loading && !user) {
            saveHabits(habits);
        }
    }, [habits, loading, user]);

    const addHabit = async (habitData) => {
        if (!user) {
            // Local
            const newHabit = {
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                punches: [],
                archived: false,
                title: habitData.title,
                reward: habitData.reward,
                icon: habitData.icon,
                color: habitData.color,
                sound: habitData.sound,
                expiresAt: habitData.expiresAt,
                category: habitData.category || '',
            };
            setHabits((prev) => [newHabit, ...prev]);
            return;
        }

        // Remote
        // Ensure profile exists first (resiliency against DB resets)
        const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
        if (!profileCheck) {
            await supabase.from('profiles').insert({
                id: user.id,
                display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
                email: user.email,
                avatar_url: user.user_metadata?.avatar_url
            });
        }

        // Insert into cards
        const { data, error } = await supabase.from('cards').insert({
            creator_id: user.id,
            habit: habitData.title,
            punch_count: habitData.punchCount || 10,
            reward: habitData.reward,
            category: habitData.category,
            expiration: habitData.expiresAt || null,
            icon: habitData.icon,
            color: habitData.color,
            celebration_sound: habitData.sound,
            mode: habitData.mode || 'personal',
            is_private: habitData.isPrivate || false
        }).select().single();

        if (error) {
            console.error('Error adding habit:', error);
            alert('Failed to save card: ' + error.message);
            return null;
        }

        if (data) {
            const formatted = {
                id: data.id,
                createdAt: data.created_at,
                title: data.habit,
                reward: data.reward || '',
                icon: data.icon,
                color: data.color,
                sound: data.celebration_sound,
                expiresAt: data.expiration,
                category: data.category || '',
                archived: data.archived,
                mode: data.mode,
                isPrivate: data.is_private,
                punchCount: data.punch_count || 10,
                creatorId: data.creator_id,
                collaborators: [],
                followers: [],
                comments: [],
                punches: []
            };
            setHabits(prev => [formatted, ...prev]);
            return formatted;
        }
        return null;
    };

    const updateHabit = async (id, updates) => {
        // Optimistic update for both local and remote
        setHabits((prev) =>
            prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
        );

        if (!user) {
            return;
        }

        // Remote update
        const dbUpdates = {};
        if (updates.title) dbUpdates.habit = updates.title;
        if (updates.reward !== undefined) dbUpdates.reward = updates.reward;
        if (updates.archived !== undefined) dbUpdates.archived = updates.archived;
        if (updates.expiresAt !== undefined) dbUpdates.expiration = updates.expiresAt;
        if (updates.icon) dbUpdates.icon = updates.icon;
        if (updates.color) dbUpdates.color = updates.color;
        if (updates.sound) dbUpdates.celebration_sound = updates.sound;
        if (updates.mode) dbUpdates.mode = updates.mode;
        if (updates.punchCount) {
            const val = parseInt(updates.punchCount, 10);
            dbUpdates.punch_count = val;
            // Ensure local state is also number
            updates.punchCount = val;
        }
        if (updates.isPrivate !== undefined) dbUpdates.is_private = updates.isPrivate;

        if (Object.keys(dbUpdates).length > 0) {
            const { error } = await supabase.from('cards').update(dbUpdates).eq('id', id);
            if (error) {
                console.error('Error updating habit:', error);
                // Revert optimistic update (requires fetching state again or complicated rollback)
                // For now, accept that UI might blink if we refresh, but realtime should fix it back to truth
                // or we could show an alert.
                // alert('Error updating card');
            }
        }
    };

    const deleteHabit = async (id) => {
        // Optimistic update
        const previousHabits = [...habits];
        setHabits((prev) => prev.filter((h) => h.id !== id));

        if (!user) {
            return;
        }

        const { error } = await supabase.from('cards').delete().eq('id', id);

        if (error) {
            console.error('Error deleting habit:', error);
            alert('Failed to delete card: ' + error.message);
            // Rollback
            setHabits(previousHabits);
        }
    };

    const archiveHabit = (id) => {
        updateHabit(id, { archived: true });
    };

    const punchHabit = async (id) => {
        // Find habit to check constraints
        const habit = habits.find(h => h.id === id);
        if (!habit || habit.punches.length >= (habit.punchCount || 10)) return;

        if (!user) {
            // Local
            const timestamp = new Date().toISOString();
            const newPunches = [...habit.punches, timestamp];
            setHabits(prev => prev.map(h => h.id === id ? { ...h, punches: newPunches } : h));

            if (newPunches.length === (habit.punchCount || 10)) {
                setCelebration({ soundId: habit.sound, reward: habit.reward });
            }
            return;
        }

        // Optimistic local update
        const timestamp = new Date().toISOString();
        const oldHabits = [...habits];

        setHabits(prev => prev.map(h => h.id === id ? {
            ...h,
            punches: [...h.punches, timestamp]
        } : h));

        // Check for celebration locally (optimistic)
        if (habit.punches.length + 1 === (habit.punchCount || 10)) {
            setCelebration({ soundId: habit.sound, reward: habit.reward });
        }

        // Remote Supabase call
        const { error } = await supabase.from('punches').insert({
            card_id: id,
            user_id: user.id,
            punched_at: timestamp
        });

        if (error) {
            console.error('Error punching habit:', error);
            // Rollback on error
            setHabits(oldHabits);
            alert('Failed to save punch: ' + error.message);
        }
    };

    const unpunchHabit = async (id) => {
        const habit = habits.find(h => h.id === id);
        if (!habit || habit.punches.length === 0) return;

        if (!user) {
            const newPunches = [...habit.punches];
            newPunches.pop();
            setHabits(prev => prev.map(h => h.id === id ? { ...h, punches: newPunches } : h));
            return;
        }

        // Optimistic local update
        const oldHabits = [...habits];
        setHabits(prev => prev.map(h => {
            if (h.id === id) {
                const newPunches = [...h.punches];
                newPunches.pop();
                return { ...h, punches: newPunches };
            }
            return h;
        }));

        // Remote: Delete latest punch
        const { data, error: fetchError } = await supabase
            .from('punches')
            .select('id')
            .eq('card_id', id)
            .order('punched_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError || !data?.id) {
            if (fetchError) console.error('Error fetching punch for deletion:', fetchError);
            setHabits(oldHabits); // Rollback
            return;
        }

        const { error: deleteError } = await supabase.from('punches').delete().eq('id', data.id);
        if (deleteError) {
            console.error('Error deleting punch:', deleteError);
            setHabits(oldHabits); // Rollback
            alert('Failed to undo punch: ' + deleteError.message);
        }
    };

    const addComment = async (cardId, commentText, emoji, guestName = null) => {
        const insertData = {
            card_id: cardId,
            comment_text: commentText,
            emoji: emoji,
            created_at: new Date().toISOString() // Needed for optimistic render
        };

        if (user) {
            insertData.user_id = user.id;
            // Optimistic Display Name lookup (approximated)
            // ideally we'd have the user's profile loaded, but defaults work for immediate feedback
        } else if (guestName) {
            insertData.guest_name = guestName;
        } else {
            return { error: 'Must provide guest name or be logged in' };
        }

        // 1. Optimistic Update
        const optimisticComment = {
            id: 'temp-' + Date.now(), // Temporary ID
            ...insertData,
            profiles: user ? { display_name: user.user_metadata?.display_name || user.email?.split('@')[0] } : null
        };

        setHabits(prev => prev.map(card => {
            if (card.id === cardId) {
                return {
                    ...card,
                    comments: [...(card.comments || []), optimisticComment]
                };
            }
            return card;
        }));

        // 2. Remote Update
        const { error } = await supabase
            .from('comments')
            .insert({
                card_id: cardId,
                comment_text: commentText,
                emoji: emoji,
                user_id: user?.id,
                guest_name: guestName
            }); // Don't send created_at (let DB timestamp it)

        if (error) {
            // Rollback on error
            setHabits(prev => prev.map(card => {
                if (card.id === cardId) {
                    return {
                        ...card,
                        comments: card.comments.filter(c => c.id !== optimisticComment.id)
                    };
                }
                return card;
            }));
            return { error: error.message };
        }
        return { success: true };
    };


    const shareHabit = async (cardId, targetIdentifier) => {
        if (!user) return { error: 'Must be logged in to share' };
        try {
            // Find user by display_name or email
            // Find user by display_name or email (case insensitive)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, display_name')
                .or(`display_name.ilike."${targetIdentifier}",email.ilike."${targetIdentifier}"`)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profile) {
                const baseUrl = window.location.href.split('#')[0].replace(/\/$/, "");
                const inviteLink = `${baseUrl}/#/invite?card=${cardId}&email=${encodeURIComponent(targetIdentifier)}`;
                return {
                    error: 'User not found',
                    notFound: true,
                    inviteLink
                };
            }

            const { error: inviteError } = await supabase
                .from('collaborators')
                .insert({
                    card_id: cardId,
                    user_id: profile.id,
                    role: 'editor'
                });

            if (inviteError) {
                if (inviteError.code === '23505') return { error: 'Already a collaborator' };
                throw inviteError;
            }

            return { success: true };
        } catch (err) {
            console.error('Error sharing habit:', err);
            return { error: err.message };
        }
    };

    const joinCollab = async (cardId, habitData = null) => {
        if (!user) return { error: 'Must be logged in to join' };

        // Optimistic: If we have habitData, add it to habits immediately
        if (habitData) {
            setHabits(prev => {
                if (prev.some(h => h.id === cardId)) return prev;
                // Add current user to collaborators list optimistically
                const optimCollab = { user_id: user.id, profiles: { display_name: 'You' } };
                return [{
                    ...habitData,
                    collaborators: [...(habitData.collaborators || []), optimCollab]
                }, ...prev];
            });
        }

        // Check if already in it (Backend check)
        const { data: existing } = await supabase
            .from('collaborators')
            .select('id')
            .eq('card_id', cardId)
            .eq('user_id', user.id)
            .single();

        if (existing) return { success: true };

        const { error } = await supabase
            .from('collaborators')
            .insert({
                card_id: cardId,
                user_id: user.id
            });

        if (error) {
            // Rollback if needed (complex, but minor blink risk acceptable for optimistic UI)
            return { error: error.message };
        }
        return { success: true };
    };

    const followCard = async (cardId, habitData = null) => {
        if (!user) return { error: 'Must be logged in to follow' };

        // Optimistic: Add to habits list directly
        if (habitData) {
            setHabits(prev => {
                // Prevent duplicates
                if (prev.some(h => h.id === cardId)) return prev;
                // Add current user to followers list optimistically
                const optimFollower = { user_id: user.id, profiles: { display_name: 'You' } };
                return [{
                    ...habitData,
                    followers: [...(habitData.followers || []), optimFollower]
                }, ...prev];
            });
        }

        // Also if we DON'T have habitData (e.g. from card view), we should try to fetch it or finding it from available cards if possible
        // But typically followCard is called with habitData if we are looking at it.
        // Let's ensure we add it if we can find it in the public list or if it's passed.

        const { error } = await supabase
            .from('followers')
            .insert({
                card_id: cardId,
                user_id: user.id
            });

        if (error && error.code !== '23505') { // Ignore unique constraint error
            return { error: error.message };
        }
        return { success: true };
    };

    const copyHabit = async (habit) => {
        if (!user) return { error: 'Must be logged in to copy' };

        const { error } = await supabase.from('cards').insert({
            creator_id: user.id,
            habit: habit.title,
            punch_count: habit.punchCount || 10,
            reward: habit.reward,
            category: habit.category,
            icon: habit.icon,
            color: habit.color,
            celebration_sound: habit.sound,
            mode: 'personal',
            is_private: false // Copies are public by default unless changed
        });

        if (error) return { error: error.message };

        // Auto-follow each other logic could be added here
        if (habit.creatorId) {
            // Need a way to find a card of the original creator to follow back?
            // Spec: "auto-follow each other" 
            // We can follow the card we just copied FROM.
            await followCard(habit.id);
        }

        return { success: true };
    };

    const searchUserByEmail = async (query) => {
        if (!query) return { error: 'Empty query' };

        // Find user by display_name or email (case insensitive)
        const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, email, avatar_url')
            .or(`display_name.ilike."${query}",email.ilike."${query}"`)
            .maybeSingle();

        if (error) {
            console.error('Search user error:', error);
            return { error: error.message };
        }
        return { user: data };
    };

    const fetchPublicHabits = async (userId) => {
        const { data: cards, error } = await supabase
            .from('cards')
            .select('*, punches(punched_at), collaborators(user_id, profiles(display_name)), followers(user_id, profiles(display_name)), comments(*, profiles(display_name)), creator:creator_id(display_name, email)')
            .eq('creator_id', userId)
            .eq('is_private', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching public habits:', error);
            return [];
        }

        // Transform to internal shape
        return cards.map(c => ({
            id: c.id,
            createdAt: c.created_at,
            title: c.habit,
            reward: c.reward || '',
            icon: c.icon,
            color: c.color,
            sound: c.celebration_sound,
            expiresAt: c.expiration,
            category: c.category || '',
            archived: c.archived,
            mode: c.mode,
            isPrivate: c.is_private,
            punchCount: c.punch_count || 10,
            creatorId: c.creator_id,
            creatorName: c.creator?.display_name || c.creator?.email?.split('@')[0] || 'Unknown',
            collaborators: c.collaborators || [],
            followers: c.followers || [],
            comments: c.comments || [],
            punches: c.punches.map(p => p.punched_at)
        }));
    };

    const value = {
        habits,
        loading,
        addHabit,
        updateHabit,
        deleteHabit,
        archiveHabit,
        punchHabit,
        unpunchHabit,
        shareHabit,
        joinCollab,
        followCard,
        copyHabit,
        addComment,
        searchUserByEmail,
        fetchPublicHabits,
        celebration,
        clearCelebration: () => setCelebration(null),
        onboardingAction,
        dismissOnboarding: () => setOnboardingAction(null)
    };

    return (
        <HabitContext.Provider value={value}>
            {children}
        </HabitContext.Provider>
    );
};
