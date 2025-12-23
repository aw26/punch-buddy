import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import PunchCard from '../components/PunchCard/PunchCard';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

const SharedCard = () => {
    const [searchParams] = useSearchParams();
    const data = searchParams.get('data');
    const id = searchParams.get('id');
    const [habit, setHabit] = useState(null);
    const [error, setError] = useState('');

    // For live shared cards
    const { habits, loading, joinCollab, followCard, copyHabit } = useHabits();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!id && !data) return;

        if (id) {
            // Live sharing mode - check context first
            const found = habits.find(h => h.id === id);
            if (found) {
                setHabit(found);
                setError('');
                return;
            }

            // If still loading context, wait
            if (loading) return;

            // Not in context and finished loading? Fetch directly (handles public viewing)
            const fetchPublicCard = async () => {
                try {
                    const { data: card, error: fetchError } = await supabase
                        .from('cards')
                        .select('*, punches(punched_at), collaborators(user_id, profiles(display_name)), followers(user_id, profiles(display_name)), comments(*, profiles(display_name))')
                        .eq('id', id)
                        .single();

                    if (fetchError) {
                        setError('Card not found or you do not have permission to view it.');
                    } else {
                        // Format for use in PunchCard component
                        setHabit({
                            id: card.id,
                            title: card.habit,
                            reward: card.reward,
                            expiresAt: card.expiration ? card.expiration.split('T')[0] : '',
                            icon: card.icon,
                            color: card.color,
                            sound: card.celebration_sound,
                            category: card.category,
                            mode: card.mode,
                            isPrivate: card.is_private,
                            punchCount: card.punch_count || 10,
                            creatorId: card.creator_id,
                            collaborators: card.collaborators || [],
                            followers: card.followers || [],
                            comments: card.comments || [],
                            punches: card.punches ? card.punches.map(p => p.punched_at) : []
                        });
                        setError('');
                    }
                } catch (e) {
                    setError('Error loading card.');
                }
            };

            fetchPublicCard();
        } else if (data) {
            // Static sharing mode (Legacy/Snapshot)
            try {
                const decoded = JSON.parse(atob(data));
                setHabit(decoded);
            } catch (e) {
                setError('Invalid card link');
            }
        }
    }, [data, id, habits, user]);


    if (error) return <div className="p-4" style={{ textAlign: 'center', color: '#666' }}>{error}</div>;
    if (!habit) return <div className="p-4" style={{ textAlign: 'center' }}>Loading card...</div>;

    return (
        <div className="shared-page" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
                {id ? 'Shared Punch Card' : 'Snapshot Punch Card'}
            </h2>

            {/* If data (snapshot), make read-only. If id (live), interactive if permitted */}
            <div style={data ? { pointerEvents: 'none', opacity: 0.9 } : {}}>
                <PunchCard habit={habit} />
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {habit.mode === 'collab' ? (
                    <>
                        <button
                            className="button-primary"
                            onClick={async () => {
                                if (!user) return navigate('/login');
                                const { error } = await joinCollab(habit.id);
                                if (!error) navigate('/');
                                else alert(error);
                            }}
                        >
                            {user ? 'Join Collab' : 'Login to Join'}
                        </button>
                        <button
                            className="button-secondary"
                            onClick={async () => {
                                if (!user) return navigate('/login');
                                const { error } = await followCard(habit.id);
                                if (!error) alert('Following! Check your Following tab.');
                                else alert(error);
                            }}
                        >
                            {user ? 'Follow & Cheer' : 'Login to Cheer'}
                        </button>
                    </>
                ) : habit.mode === 'personal' ? (
                    <>
                        <button
                            className="button-secondary"
                            onClick={async () => {
                                if (!user) return navigate('/login');
                                const { error } = await followCard(habit.id);
                                if (!error) alert('Following! Check your Following tab.');
                                else alert(error);
                            }}
                        >
                            {user ? 'Follow & Cheer' : 'Login to Cheer'}
                        </button>
                        <button
                            className="button-primary"
                            onClick={async () => {
                                if (!user) return navigate('/login');
                                const { error } = await copyHabit(habit);
                                if (!error) navigate('/');
                                else alert(error);
                            }}
                        >
                            {user ? 'Copy & Do Together' : 'Login to Copy'}
                        </button>
                    </>
                ) : (
                    <p style={{ color: '#666' }}>Invalid card mode.</p>
                )}

                <Link to="/new" className="button-text">
                    Create New Card
                </Link>

                <Link to="/" style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem', textDecoration: 'none' }}>
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default SharedCard;
