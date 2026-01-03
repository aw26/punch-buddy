import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import PunchCard from '../components/PunchCard/PunchCard';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import './SharedCard.css';

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
                        .select('*, punches(punched_at), collaborators(user_id, profiles(display_name)), followers(user_id, profiles(display_name)), comments(*, profiles(display_name)), creator:creator_id(display_name, email)')
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
                            // Fix: Correctly map creatorName
                            // Prioritize display name, otherwise use generic friendly name (avoiding raw email slugs)
                            creatorName: card.creator?.display_name || 'Your Buddy',
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
    }, [data, id, habits, user, loading]);


    if (error) return (
        <div className="shared-page">
            <div className="error-container">
                <h3>Opse!</h3>
                <p>{error}</p>
                <Link to="/" className="home-link">Return Home</Link>
            </div>
        </div>
    );

    if (!habit) return (
        <div className="shared-page">
            <div className="loading-container">
                Loading Punch Card...
            </div>
        </div>
    );

    const isCollaborator = habit.collaborators?.some(c => c.user_id === user?.id);
    const isFollower = habit.followers?.some(f => f.user_id === user?.id);

    return (
        <div className="shared-page">
            <div className="shared-header">
                <h2>{id ? 'Shared Punch Card' : 'Snapshot Punch Card'}</h2>
            </div>

            {/* If data (snapshot), make read-only. If id (live), interactive if permitted */}
            <div className={`card-container ${data ? 'readonly-mode' : ''}`}>
                <PunchCard habit={habit} />
            </div>

            <div className="shared-actions">
                {/* UN-AUTHENTICATED VIEW: Single "Login to Follow & Cheer" Action */}
                {!user ? (
                    <button
                        className="action-btn btn-primary" // Prominent button
                        onClick={() => {
                            // Use returnTo with the full hash path (e.g., /share?id=...)
                            const currentPath = window.location.hash.slice(1); // Remove the #
                            navigate(`/login?returnTo=${encodeURIComponent(currentPath)}`);
                        }}
                    >
                        <span>👋</span> Login to Follow & Cheer
                    </button>
                ) : (
                    /* AUTHENTICATED VIEW: Full Actions */
                    <>
                        {/* COLLAB MODE ACTIONS */}
                        {habit.mode === 'collab' && (
                            <>
                                {isCollaborator ? (
                                    <button className="action-btn btn-primary" disabled>
                                        <span>✅</span> Joined as Collaborator
                                    </button>
                                ) : (
                                    <button
                                        className="action-btn btn-primary"
                                        onClick={async () => {
                                            const { error } = await joinCollab(habit.id, habit);
                                            if (!error) navigate('/');
                                            else alert(error);
                                        }}
                                    >
                                        <span>🤝</span> Join Collab
                                    </button>
                                )}

                                {/* Secondary for Collab: Follow */}
                                {isFollower ? (
                                    <button className="action-btn btn-secondary" disabled>
                                        <span>✅</span> Following
                                    </button>
                                ) : (
                                    <button
                                        className="action-btn btn-secondary"
                                        onClick={async () => {
                                            const { error } = await followCard(habit.id, habit);
                                            if (!error) alert('Following! Check your Following tab.');
                                            else alert(error);
                                        }}
                                    >
                                        <span>👀</span> Follow & Cheer
                                    </button>
                                )}
                            </>
                        )}

                        {/* PERSONAL MODE ACTIONS */}
                        {habit.mode !== 'collab' && (
                            <>
                                {/* Primary for Personal: Follow */}
                                {isFollower ? (
                                    <button className="action-btn btn-secondary" disabled>
                                        <span>✅</span> Following
                                    </button>
                                ) : (
                                    <button
                                        className="action-btn btn-secondary"
                                        onClick={async () => {
                                            const { error } = await followCard(habit.id, habit);
                                            if (!error) alert('Following! Check your Following tab.');
                                            else alert(error);
                                        }}
                                    >
                                        <span>👀</span> Follow & Cheer
                                    </button>
                                )}

                                {/* Secondary for Personal: Copy */}
                                <button
                                    className="action-btn btn-outline"
                                    onClick={async () => {
                                        const { error } = await copyHabit(habit);
                                        if (!error) navigate('/');
                                        else alert(error);
                                    }}
                                >
                                    <span>📋</span> Add to my habits
                                </button>
                            </>
                        )}

                        <div className="action-divider"></div>

                        <div className="create-options">
                            {/* Common Tertiary Action: Create New */}
                            <Link to="/new" className="action-btn btn-outline" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                                <span>✨</span> Create new card
                            </Link>
                        </div>

                        <Link to="/" className="home-link">
                            Go to Dashboard
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default SharedCard;
