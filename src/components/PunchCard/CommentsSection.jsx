import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../context/HabitContext';

const CommentsSection = ({ cardId, comments }) => {
    const { user } = useAuth();
    const { addComment } = useHabits();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e, emoji = null) => {
        if (e) e.preventDefault();
        if (!newComment && !emoji) return;

        setIsSubmitting(true);
        const { error } = await addComment(cardId, newComment, emoji);
        setIsSubmitting(false);

        if (!error) {
            setNewComment('');
        } else {
            alert(error);
        }
    };

    const quickCheers = ['🎉', '👏', '🔥', '💪', '✨'];

    return (
        <div className="comments-section" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <div className="quick-cheers" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {quickCheers.map(emoji => (
                    <button
                        key={emoji}
                        onClick={(e) => handleSubmit(e, emoji)}
                        disabled={isSubmitting}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '0.4rem 0.8rem',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            <div className="comments-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                {comments.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', opacity: 0.9, fontStyle: 'italic' }}>No cheers yet. Be the first!</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} style={{ marginBottom: '0.8rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{c.profiles?.display_name || 'Anonymous'}</span>
                                <span style={{ fontWeight: 'normal', opacity: 0.8, fontSize: '0.7rem' }}>
                                    {new Date(c.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {c.emoji && <span style={{ fontSize: '1.1rem' }}>{c.emoji}</span>}
                                {c.comment_text && <span>{c.comment_text}</span>}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {user && (
                <form onSubmit={e => handleSubmit(e)} style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="Say something nice..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 0.8rem',
                            color: 'white',
                            fontSize: '0.85rem'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                        }}
                    >
                        Send
                    </button>
                </form>
            )}
        </div>
    );
};

export default CommentsSection;
