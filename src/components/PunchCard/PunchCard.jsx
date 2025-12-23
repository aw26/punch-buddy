import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../../context/HabitContext';
import { playSound } from '../../utils/sound';
import { SquareArrowUp, Pencil, Trash2, Users, TriangleAlert, MessageSquare } from 'lucide-react';
import CommentsSection from './CommentsSection';
import './PunchCard.css';

const PunchSlot = ({ index, filled, color, onClick, isComplete }) => {
    return (
        <div
            className={`punch-slot ${filled ? 'filled' : ''} ${isComplete ? 'complete' : ''}`}
            onClick={!filled && !isComplete ? onClick : undefined}
            style={{
                '--card-color': color
            }}
        >
            {filled && <span className="checkmark">✔</span>}
        </div>
    );
};

const PunchCard = ({ habit }) => {
    const { punchHabit, deleteHabit, archiveHabit } = useHabits();
    const [showComments, setShowComments] = React.useState(false);
    const [showCopyToast, setShowCopyToast] = React.useState(false);
    const totalSlots = habit.punchCount || 10;
    const filledSlots = habit.punches.length;
    const isComplete = filledSlots >= totalSlots;

    const handlePunch = () => {
        if (isComplete) return;

        // Play generic punch sound
        playSound('punch');

        punchHabit(habit.id);

        // Check if this was the last punch (logic in parent or effect?)
        // If it becomes complete, handle celebration locally or global overlay?
        // Start with local alert/effect.
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

    return (
        <div
            className={`punch-card ${isExpired && !isComplete ? 'expired' : ''}`}
            style={{
                '--card-color': habit.color,
                backgroundColor: habit.color, // Direct application to ensure it takes effect
                opacity: isExpired && !isComplete ? 0.8 : 1,
            }}
        >
            {showCopyToast && <div className="copy-toast">Link Copied! 📋</div>}
            <div className="card-header">
                <div className="card-icon">{habit.icon}</div>
                <div className="card-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3>{habit.title}</h3>
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
                    <button onClick={() => {
                        const baseUrl = window.location.href.split('#')[0].replace(/\/$/, "");
                        const url = habit.id
                            ? `${baseUrl}/#/share?id=${habit.id}`
                            : `${baseUrl}/#/share?data=${btoa(JSON.stringify(habit))}`;
                        navigator.clipboard.writeText(url);
                        setShowCopyToast(true);
                        setTimeout(() => setShowCopyToast(false), 2000);
                    }} className="btn-icon" title="Share Link"><SquareArrowUp size={16} /></button>
                    {!habit.archived && <Link to={`/edit/${habit.id}`} className="btn-icon" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit"><Pencil size={16} /></Link>}
                    <button onClick={() => { if (confirm('Delete this card?')) deleteHabit(habit.id); }} className="btn-icon" title="Delete"><Trash2 size={16} /></button>
                </div>
            </div>

            {habit.collaborators && habit.collaborators.length > 0 && (
                <div className="collaborators-badge" style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} /> Collaborating with: {habit.collaborators.map(c => c.profiles?.display_name || 'Friend').join(', ')}
                </div>
            )}

            <div className="punch-grid" style={{ gridTemplateColumns: `repeat(${totalSlots === 30 ? 6 : 5}, 1fr)` }}>
                {[...Array(totalSlots)].map((_, i) => (
                    <PunchSlot
                        key={i}
                        index={i}
                        filled={i < filledSlots}
                        color={habit.color}
                        onClick={handlePunch}
                        isComplete={isComplete}
                    />
                ))}
            </div>

            <div className="card-footer">
                <span className="expiration" style={{ color: isExpired && !isComplete ? '#ff5252' : 'rgba(255,255,255,0.9)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {isExpired && !isComplete ? <><TriangleAlert size={14} /> Expired: </> : 'Expires: '} {habit.expiresAt ? habit.expiresAt.split('T')[0] : 'Never'}
                </span>
                {streak > 1 && <span className="streak">🔥 {streak} day streak!</span>}
            </div>

            {isComplete && !habit.archived && (
                <div className="completion-banner">
                    <p>Completed!</p>
                    <button onClick={() => archiveHabit(habit.id)}>Archive</button>
                </div>
            )}

            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                <button
                    onClick={() => setShowComments(!showComments)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <MessageSquare size={14} /> {habit.comments?.length || 0} {showComments ? 'Hide Comments' : 'Comments & Cheers'}
                </button>
                {showComments && <CommentsSection cardId={habit.id} comments={habit.comments || []} />}
            </div>
        </div>
    );
};

export default PunchCard;
