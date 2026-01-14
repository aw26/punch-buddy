import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import PunchCard from '../components/PunchCard/PunchCard';
import './Invite.css';

const Invite = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [habitInfo, setHabitInfo] = useState(null);
    const [inviterName, setInviterName] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const cardId = searchParams.get('card') || searchParams.get('id');
    const email = searchParams.get('email');

    // Auto-redirect if already logged in
    useEffect(() => {
        if (user && cardId && habitInfo) { // Wait for habitInfo to know mode
            const isCollab = habitInfo.mode === 'collab';
            const param = isCollab ? 'join' : 'follow';
            navigate(`/?${param}=${cardId}`, { replace: true });
        }
    }, [user, cardId, habitInfo, navigate]);

    useEffect(() => {
        const fetchContext = async () => {
            if (!cardId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch card/habit details
                const { data: card, error } = await supabase
                    .from('cards')
                    .select('*, punches(punched_at), creator:creator_id(display_name, email)')
                    .eq('id', cardId)
                    .single();

                if (error) throw error;

                setInviterName(card.creator?.display_name || card.creator?.email?.split('@')[0] || 'A friend');

                // Format for preview
                setHabitInfo({
                    id: card.id,
                    title: card.habit,
                    reward: card.reward,
                    icon: card.icon,
                    color: card.color,
                    punches: card.punches ? card.punches.map(p => p.punched_at) : [],
                    punchCount: card.punch_count || 10,
                    mode: card.mode,
                    creatorId: card.creator_id,
                    // Minimal data for preview
                });
            } catch (err) {
                console.error('Error fetching invite details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchContext();
    }, [cardId]);

    const handleJoin = () => {
        // Store the card ID for redirect after login
        if (cardId) {
            localStorage.setItem('return_card_after_auth', cardId);
            // Also store mode hint in case we need it before fetch
            if (habitInfo) localStorage.setItem('return_card_mode', habitInfo.mode);
        }

        const isCollab = habitInfo?.mode === 'collab';
        const param = isCollab ? 'join' : 'follow';

        // Redirect to login with pre-fill and context
        navigate(`/login?email=${encodeURIComponent(email || '')}&${param}=${cardId}`);
    };

    if (loading) return <div className="invite-page">Loading...</div>;

    if (!habitInfo) {
        return (
            <div className="invite-page">
                <h2>Invitation Expired</h2>
                <p>This invitation link seems to be invalid or the habit no longer exists.</p>
                <Link to="/" className="button-primary">Go Home</Link>
            </div>
        );
    }

    const isCollab = habitInfo.mode === 'collab';

    return (
        <div className="invite-page">
            <div className="invite-card backdrop-blur">
                <div className="invite-header">
                    <span className="sparkle">✨</span>
                    <h2>You're Invited!</h2>
                    <span className="sparkle">✨</span>
                </div>

                <p className="invite-context">
                    <strong className="highlighter">{inviterName}</strong> invites you to {isCollab ? 'collaborate on' : 'check out'} their habit:
                </p>

                <div className="mini-card-preview">
                    <PunchCard habit={habitInfo} previewMode={true} />
                </div>

                <div className="invite-actions">
                    <button onClick={handleJoin} className="button-primary join-btn">
                        {isCollab ? 'Accept & Join' : 'Check it out'}
                    </button>
                    <p className="invite-tiny">
                        {isCollab
                            ? "Already have an account? Just sign in and you'll be added!"
                            : "Sign in to follow their progress or create your own!"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Invite;
