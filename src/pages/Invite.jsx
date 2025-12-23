import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import './Invite.css';

const Invite = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [habitInfo, setHabitInfo] = useState(null);
    const [inviterName, setInviterName] = useState('');
    const [loading, setLoading] = useState(true);

    const cardId = searchParams.get('card');
    const email = searchParams.get('email');

    useEffect(() => {
        const fetchContext = async () => {
            if (!cardId) {
                setLoading(false);
                return;
            }

            // Fetch card info and creator profile
            // Use 'habit' column (schema) instead of 'title' (code)
            const { data, error: fetchError } = await supabase
                .from('cards')
                .select('habit, creator_id, profiles(display_name)')
                .eq('id', cardId)
                .single();

            if (fetchError) {
                console.error('Error fetching invite context:', fetchError);
                setLoading(false);
                return;
            }

            if (data) {
                setHabitInfo({
                    title: data.habit,
                    creator_id: data.creator_id,
                    profiles: data.profiles
                });
                setInviterName(data.profiles?.display_name || 'A friend');
            }
            setLoading(false);
        };

        fetchContext();
    }, [cardId]);

    const handleJoin = () => {
        // Redirect to login with pre-fill and join context
        // We'll use the 'join' param in the final redirect after signup
        navigate(`/login?email=${encodeURIComponent(email || '')}&join=${cardId}`);
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

    return (
        <div className="invite-page">
            <div className="invite-card backdrop-blur">
                <div className="invite-header">
                    <span className="sparkle">✨</span>
                    <h2>You're Invited!</h2>
                    <span className="sparkle">✨</span>
                </div>

                <p className="invite-context">
                    <strong className="highlighter">{inviterName}</strong> invited you to collaborate on their habit:
                </p>

                <div className="habit-preview">
                    <h3 className="habit-title">"{habitInfo.title}"</h3>
                    <p className="habit-sub">Work together, stay accountable, and earn rewards!</p>
                </div>

                <div className="invite-actions">
                    <button onClick={handleJoin} className="button-primary join-btn">
                        Accept & Create Account
                    </button>
                    <p className="invite-tiny">Already have an account? Just sign in and you'll be added!</p>
                </div>
            </div>
        </div>
    );
};

export default Invite;
