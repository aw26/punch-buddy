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
            const localHabits = loadHabits();
            if (!localHabits || localHabits.length === 0) return;

            console.log('Migrating local habits for user:', userId);

            for (const habit of localHabits) {
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
                    console.error('Error migrating card:', cardError);
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
            }

            // Clear local storage after successful migration
            saveHabits([]);
            console.log('Migration complete.');
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
            // Then fetch all
            try {
                const { data: cards, error } = await supabase
                    .from('cards')
                    .select('*, punches(punched_at), collaborators(user_id, profiles(display_name)), followers(user_id, profiles(display_name)), comments(*, profiles(display_name))');

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
                    punchCount: c.punch_count || 10,
                    creatorId: c.creator_id,
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

        // Initial fetch and one-time migration
        const init = async () => {
            if (user?.id) {
                await ensureProfile(user);
                await migrateLocalHabits(user.id);

                // Auto-join logic (URL or Cross-tab LocalStorage)
                const params = new URLSearchParams(window.location.search);
                const joinId = params.get('join') || localStorage.getItem('pending_join');

                if (joinId) {
                    console.log('Executing persistent cross-tab auto-join for:', joinId);
                    await joinCollab(joinId);

                    // Cleanup
                    localStorage.removeItem('pending_join');
                    const newUrl = window.location.pathname + window.location.search.replace(/[?&]join=[^&]+/, '').replace(/^&/, '?');
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
                    () => fetchHabits() // Refresh habits to get comments if we include them? 
                    // Actually, let's just listen and refresh to keep it simple.
                )
                .subscribe();
        }

        return () => {
            mounted = false;
            if (channel) supabase.removeChannel(channel);
        };
    }, [user]);

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
            mode: habitData.mode || 'personal'
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
        if (!user) {
            setHabits((prev) =>
                prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
            );
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
        if (updates.punchCount) dbUpdates.punch_count = updates.punchCount;

        if (Object.keys(dbUpdates).length > 0) {
            await supabase.from('cards').update(dbUpdates).eq('id', id);
        }
    };

    const deleteHabit = async (id) => {
        if (!user) {
            setHabits((prev) => prev.filter((h) => h.id !== id));
            return;
        }
        await supabase.from('cards').delete().eq('id', id);
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

    const addComment = async (cardId, commentText, emoji) => {
        if (!user) return { error: 'Must be logged in to comment' };

        const { error } = await supabase
            .from('comments')
            .insert({
                card_id: cardId,
                user_id: user.id,
                comment_text: commentText,
                emoji: emoji
            });

        if (error) return { error: error.message };
        return { success: true };
    };


    const shareHabit = async (cardId, targetIdentifier) => {
        if (!user) return { error: 'Must be logged in to share' };
        try {
            // Find user by display_name or email
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, display_name')
                .or(`display_name.eq."${targetIdentifier}",email.eq."${targetIdentifier}"`)
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

    const joinCollab = async (cardId) => {
        if (!user) return { error: 'Must be logged in to join' };

        // Check if already in it
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

        if (error) return { error: error.message };
        return { success: true };
    };

    const followCard = async (cardId) => {
        if (!user) return { error: 'Must be logged in to follow' };

        const { error } = await supabase
            .from('followers')
            .insert({
                card_id: cardId,
                user_id: user.id
            });

        if (error && error.code !== '23505') { // Ignore unique constraint error (already following)
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
            mode: 'personal'
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
        celebration,
        clearCelebration: () => setCelebration(null)
    };

    return (
        <HabitContext.Provider value={value}>
            {children}
        </HabitContext.Provider>
    );
};
