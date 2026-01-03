import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../../context/HabitContext';
import { useAuth } from '../../context/AuthContext';
import { playSound } from '../../utils/sound';
import { SquareArrowUp, Pencil, Trash2, Users, TriangleAlert, MessageSquare, Heart, Copy } from 'lucide-react';
import CommentsSection from './CommentsSection';
import { supabase } from '../../utils/supabaseClient';
import './PunchCard.css';

const PunchSlot = ({ index, filled, color, onClick, isComplete }) => {
    return (
        <div
            className={`punch-slot ${filled ? 'filled' : ''} ${isComplete ? 'complete' : ''}`}
            onClick={onClick}
            style={{
                '--card-color': color,
                cursor: onClick ? 'pointer' : 'default'
            }}
        >
            {filled && <span className="checkmark">✔</span>}
        </div>
    );
};

const PunchCard = ({ habit, previewMode = false }) => {
    const { punchHabit, deleteHabit, archiveHabit, habits, followCard, unpunchHabit, copyHabit } = useHabits();
    const { user } = useAuth();
    const [showComments, setShowComments] = React.useState(false);
    const [showCopyToast, setShowCopyToast] = React.useState(false);

    // Derived state
    const totalSlots = (typeof habit.punchCount === 'number' && habit.punchCount > 0) ? habit.punchCount : 10;
    const filledSlots = habit.punches.length;
    const isComplete = filledSlots >= totalSlots;
    const isOwner = user?.id === habit.creatorId;
    const isCollaborator = user && habit.collaborators?.some(c => c.user_id === user.id);
    const ownerName = isOwner ? 'You' : (habit.creatorName || 'Friend');

    // DEBUG:
    console.log('PunchCard Debug:', { id: habit.id, title: habit.title, totalSlots, filledSlots, punchCountRaw: habit.punchCount, isComplete });

    const [isPunching, setIsPunching] = useState(false);

    const handlePunch = async () => {
        if (isComplete || isPunching) return;

        setIsPunching(true);
        // Play generic punch sound
        playSound('punch');

        try {
            await punchHabit(habit.id);
        } finally {
            // Small delay to prevent double-taps
            setTimeout(() => setIsPunching(false), 500);
        }
    };

    const calculateStreak = () => {
        if (filledSlots === 0) return 0;

        const sortedDates = [...habit.punches].sort((a, b) => new Date(a) - new Date(b));
        const uniqueDays = [...new Set(sortedDates.map(p => new Date(p).toDateString()))];

        let streak = 0;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();

        const lastPunchDay = uniqueDays[uniqueDays.length - 1];

        // If last punch wasn't today or yesterday, streak is broken
        if (lastPunchDay !== todayStr && lastPunchDay !== yesterdayStr) {
            return 0;
        }

        // Count backwards
        let checkDate = new Date(lastPunchDay);
        for (let i = uniqueDays.length - 1; i >= 0; i--) {
            if (uniqueDays[i] === checkDate.toDateString()) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    };

    const streak = calculateStreak();
    const isExpired = habit.expiresAt && new Date(habit.expiresAt) < new Date().setHours(0, 0, 0, 0);

    const handleSlotClick = (i) => {
        if (previewMode) return;

        // Permission check for punching
        // Only Owner or Collaborator can punch
        const canPunch = isOwner || isCollaborator;

        if (!canPunch) {
            // It's a followed card (or public view)
            alert(`This is ${ownerName}'s card. To track your own habits, create a new habit or add this one to your cards!`);
            return;
        }

        // Punching: Next available slot (if not complete)
        if (!isComplete && i === filledSlots) {
            handlePunch();
        }
        // Unpunching: Last filled slot
        else if (i === filledSlots - 1) {
            if (confirm('Undo last punch?')) {
                unpunchHabit(habit.id);
            }
        }
    };

    return (
        <div
            className={`punch-card ${isExpired && !isComplete ? 'expired' : ''}`}
            style={{
                '--card-color': habit.color,
                backgroundColor: habit.color,
                opacity: isExpired && !isComplete ? 0.8 : 1,
            }}
        >
            {showCopyToast && <div className="copy-toast">Link Copied! 📋</div>}
            <div className="card-header">
                <div className="card-icon">{habit.icon}</div>
                <div className="card-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0 }}>{habit.title}</h3>
                        {!isOwner && !previewMode && (
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                by {ownerName}
                            </span>
                        )}
                        {habit.mode === 'collab' && (
                            <span
                                className="collab-lozenge"
                                title={`Collaborators: ${habit.collaborators?.map(c => c.profiles?.display_name || 'Friend').join(', ') || 'Pending...'}`}
                                style={{
                                    fontSize: '0.6rem',
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                    textTransform: 'uppercase',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.5px',
                                    cursor: 'help'
                                }}
                            >
                                Collab
                            </span>
                        )}
                    </div>
                    <p className="reward">🏆 Reward: {habit.reward || (habit.mode === 'collab' ? 'Collaborative Goal' : 'None set')}</p>
                </div>
                <div className="card-actions">
                    {/* Follow/Unfollow Button */}
                    {user && user.id !== habit.creatorId && (
                        <button
                            onClick={async () => {
                                const isFollowing = habit.followers?.some(f => f.user_id === user.id);
                                if (isFollowing) {
                                    alert('You are already following this card! (Unfollow not implemented yet)');
                                } else {
                                    const { error } = await followCard(habit.id, habit);
                                    if (error) alert('Error following: ' + error);
                                    else alert('Followed! Check your "Following" tab.');
                                }
                            }}
                            className="btn-icon"
                            title="Follow this card"
                            style={{ color: habit.followers?.some(f => f.user_id === user?.id) ? '#ff4081' : 'inherit' }}
                        >
                            <Heart size={16} fill={habit.followers?.some(f => f.user_id === user?.id) ? '#ff4081' : 'none'} />
                        </button>
                    )}

                    {/* Copy/Clone Button for non-owners */}
                    {user && user.id !== habit.creatorId && !previewMode && (
                        <button
                            onClick={async () => {
                                if (confirm('Add this habit to your own cards?')) {
                                    const { error } = await copyHabit(habit);
                                    if (error) alert('Error copying: ' + error);
                                    else alert('Added to your cards!');
                                }
                            }}
                            className="btn-icon action-btn-copy"
                            title="Add to my habits"
                        >
                            <Copy size={16} />
                        </button>
                    )}

                    {!previewMode && (
                        <button onClick={() => {
                            const baseUrl = window.location.href.split('#')[0].replace(/\/$/, "");
                            const url = habit.id
                                ? `${baseUrl}/#/share?id=${habit.id}`
                                : `${baseUrl}/#/share?data=${btoa(JSON.stringify(habit))}`;
                            navigator.clipboard.writeText(url);
                            setShowCopyToast(true);
                            setTimeout(() => setShowCopyToast(false), 2000);
                        }} className="btn-icon" title="Share Link"><SquareArrowUp size={16} /></button>
                    )}

                    {/* Only show Edit/Delete if creator */}
                    {(!habit.creatorId || habit.creatorId === user?.id) && !previewMode && (
                        <>
                            {!habit.archived && <Link to={`/edit/${habit.id}`} className="btn-icon" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit"><Pencil size={16} /></Link>}
                            <button onClick={() => { if (confirm('Delete this card?')) deleteHabit(habit.id); }} className="btn-icon" title="Delete"><Trash2 size={16} /></button>
                        </>
                    )}
                </div>
            </div>

            {habit.collaborators && habit.collaborators.length > 0 && (
                <div className="collaborators-badge" style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} /> Collaborating with: {habit.collaborators.map(c => c.profiles?.display_name || 'Friend').join(', ')}
                </div>
            )}

            <div className="punch-grid" style={{ gridTemplateColumns: `repeat(${totalSlots === 30 ? 6 : 5}, 1fr)` }}>
                {[...Array(totalSlots)].map((_, i) => {
                    // Determine if actionable
                    let isActionable = false;
                    if (!previewMode) {
                        if (!isComplete && i === filledSlots) isActionable = true; // Next empty
                        if (i === filledSlots - 1) isActionable = true; // Last filled
                    }

                    return (
                        <PunchSlot
                            key={i}
                            index={i}
                            filled={i < filledSlots}
                            color={habit.color}
                            onClick={isActionable ? () => handleSlotClick(i) : undefined}
                            isComplete={isComplete}
                        />
                    );
                })}
            </div>

            <div className="card-footer">
                {!previewMode && (
                    <span className="expiration" style={{ color: isExpired && !isComplete ? '#ff5252' : 'rgba(255,255,255,0.9)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {isExpired && !isComplete ? <><TriangleAlert size={14} /> Expired: </> : 'Expires: '} {habit.expiresAt ? habit.expiresAt.split('T')[0] : 'Never'}
                    </span>
                )}
                {streak > 1 && <span className="streak">🔥 {streak} day streak!</span>}
            </div>

            {isComplete && !habit.archived && !previewMode && (
                <div className="completion-banner">
                    <p>Completed!</p>
                    <button onClick={() => archiveHabit(habit.id)}>Archive</button>
                </div>
            )}

            {!previewMode && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="comments-trigger"
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <MessageSquare size={14} /> {habit.comments?.length || 0} {showComments ? 'Hide Comments' : 'Cheer or Comment'}
                    </button>
                    {showComments && <CommentsSection cardId={habit.id} comments={habit.comments || []} cardOwnerName={ownerName} />}
                </div>
            )}
        </div>
    );
};

export default PunchCard;
