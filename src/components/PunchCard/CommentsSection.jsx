import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../context/HabitContext';
import { useNavigate } from 'react-router-dom';
import { getRelativeTime } from '../../utils/dateUtils';

const CommentsSection = ({ cardId, comments, cardOwnerName }) => {
    const { user } = useAuth();
    const { addComment } = useHabits();
    const navigate = useNavigate();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [pendingEmoji, setPendingEmoji] = useState(null);
    const [showSignupPrompt, setShowSignupPrompt] = useState(false);


    const quickCheers = ['🎉', '👏', '🔥', '💪', '✨'];

    // --- Aggregation Logic ---
    const { emojiCounts, textComments } = useMemo(() => {
        const counts = {};
        const textList = [];

        // Initialize counts for quick cheers to ensure order
        quickCheers.forEach(e => counts[e] = 0);

        comments.forEach(c => {
            // 1. Count Emojis (if present)
            if (c.emoji) {
                counts[c.emoji] = (counts[c.emoji] || 0) + 1;
            }

            // 2. Add to text list ONLY if it has text
            if (c.comment_text && c.comment_text.trim()) {
                textList.push(c);
            }
        });

        return { emojiCounts: counts, textComments: textList };
    }, [comments]);

    const handleCheerClick = (emoji) => {
        if (user) {
            handleSubmit(null, emoji);
        } else {
            setPendingEmoji(emoji);
            setShowNamePrompt(true);
        }
    };

    const handleGuestCheerSubmit = async (e) => {
        e.preventDefault();
        if (!guestName.trim() || !pendingEmoji) return;

        setIsSubmitting(true);
        const { error } = await addComment(cardId, '', pendingEmoji, guestName.trim());
        setIsSubmitting(false);

        if (!error) {
            setShowNamePrompt(false);
            setGuestName('');
            setPendingEmoji(null);
            setShowSignupPrompt(true);
            setTimeout(() => setShowSignupPrompt(false), 8000);
        } else {
            alert(error);
        }
    };

    const handleSubmit = async (e, emoji = null) => {
        if (e) e.preventDefault();

        if (!user && newComment.trim()) {
            if (confirm('Create an account to leave text comments?')) {
                navigate(`/login?card=${cardId}`);
            }
            return;
        }

        if (!newComment && !emoji) return;

        setIsSubmitting(true);
        const { error } = await addComment(cardId, newComment, emoji);
        setIsSubmitting(false);

        if (!error) {
            setNewComment('');
            // If it was just a generic cheer, maybe show a small toast or animation?
        } else {
            alert(error);
        }
    };

    return (
        <div className="comments-section" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            {/* Guest Name Prompt Modal */}
            {showNamePrompt && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>What's your name?</h3>
                        <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>Let {cardOwnerName || 'the owner'} know who's cheering!</p>
                        <form onSubmit={handleGuestCheerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" placeholder="Your name" value={guestName} onChange={e => setGuestName(e.target.value)} autoFocus required style={{ padding: '0.8rem', borderRadius: '8px', border: '2px solid #ddd', fontSize: '1rem' }} />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => { setShowNamePrompt(false); setGuestName(''); }} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '2px solid #ddd', background: 'white', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: '#4a90e2', color: 'white', cursor: 'pointer' }}>Send</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Signup Toast */}
            {showSignupPrompt && (
                <div style={{ background: '#48bb78', padding: '10px', borderRadius: '8px', marginBottom: '1rem', color: 'white', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🎉 Cheer sent! Sign up to do more?</span>
                    <button onClick={() => navigate(`/login?card=${cardId}`)} style={{ background: 'white', color: '#48bb78', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Sign Up</button>
                </div>
            )}

            {/* --- Counters Row (Click to Cheer) --- */}
            <div className="cheer-counters" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {Array.from(new Set([...quickCheers, ...Object.keys(emojiCounts)])).map(emoji => {
                    const count = emojiCounts[emoji] || 0;
                    // Only show if it's a quick cheer OR if it has votes
                    if (!quickCheers.includes(emoji) && count === 0) return null;

                    // Calculate Tooltip Text
                    const cheerers = comments
                        .filter(c => c.emoji === emoji)
                        .map(c => c.profiles?.display_name || c.guest_name || 'Anonymous Buddy');

                    let tooltip = '';
                    if (cheerers.length > 0) {
                        const uniqueCheerers = [...new Set(cheerers)];
                        if (uniqueCheerers.length <= 3) {
                            tooltip = uniqueCheerers.join(', ');
                        } else {
                            tooltip = `${uniqueCheerers.slice(0, 3).join(', ')} and ${uniqueCheerers.length - 3} others`;
                        }
                    } else {
                        tooltip = 'Be the first to cheer!';
                    }

                    return (
                        <button
                            key={emoji}
                            onClick={() => handleCheerClick(emoji)}
                            disabled={isSubmitting}
                            title={tooltip}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: count > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                                border: count > 0 ? '1px solid rgba(255,255,255,0.3)' : '1px dashed rgba(255,255,255,0.2)',
                                borderRadius: '20px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: isSubmitting ? 0.7 : 1
                            }}
                            onMouseEnter={e => {
                                if (!isSubmitting) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = count > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)';
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
                            {count > 0 && (
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* --- Text Comments List --- */}
            <div className="text-comments-list" style={{ marginBottom: '1.5rem' }}>
                {textComments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', padding: '1rem' }}>
                        No text comments yet.
                    </div>
                ) : (
                    textComments.map(c => {
                        const relativeTime = getRelativeTime(c.created_at);
                        return (
                            <div key={c.id} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fff' }}>
                                        {c.profiles?.display_name || c.guest_name || 'Anonymous'}
                                        {c.emoji && <span style={{ marginLeft: '6px' }}>{c.emoji}</span>} {/* Show emoji next to name if mixed */}
                                    </span>
                                    <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>
                                        "{c.comment_text}"
                                    </span>
                                </div>
                                {relativeTime && (
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                        {relativeTime}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input for Text Comments */}
            <form onSubmit={e => handleSubmit(e)} style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    placeholder={user ? "Write a comment..." : "Log in to comment..."}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '20px', // Rounder input to match redesign
                        padding: '0.6rem 1rem',
                        color: 'white',
                        fontSize: '0.9rem',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '0 1.2rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        opacity: !newComment.trim() ? 0.5 : 1
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default CommentsSection;
