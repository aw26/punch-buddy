import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import { ICONS, JEWEL_TONES, SOUND_OPTIONS } from '../constants';
import { supabase } from '../utils/supabaseClient';
import { playSound } from '../utils/sound';
import { Copy, Mail, Lightbulb, UserPlus } from 'lucide-react';
import './CreateHabit.css';

const CATEGORY_SUGGESTIONS = ['Health', 'Creativity', 'Learning', 'Social', 'Work'];

const CreateHabit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { addHabit, updateHabit, habits, shareHabit } = useHabits();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        reward: '',
        expiresAt: '',
        icon: ICONS[0],
        color: JEWEL_TONES[0].value,
        sound: SOUND_OPTIONS[0].id,
        category: '',
        mode: 'personal',
        isPrivate: false,
        punchCount: 10
    });

    const [collaborators, setCollaborators] = useState([]);
    const [inviteUsername, setInviteUsername] = useState('');
    const [pendingCollaborators, setPendingCollaborators] = useState([]); // Array of { email, status, displayName }
    const { searchUserByEmail } = useHabits();

    const handleAddCollaborator = async () => {
        if (!inviteUsername.trim()) return;
        const email = inviteUsername.trim();

        // Prevent duplicates
        if (pendingCollaborators.some(p => p.email.toLowerCase() === email.toLowerCase())) {
            alert('User already in invite list');
            setInviteUsername('');
            return;
        }

        const result = await searchUserByEmail(email);

        if (result.user) {
            setPendingCollaborators(prev => [...prev, {
                email: email,
                status: 'found',
                displayName: result.user.display_name,
                userId: result.user.id
            }]);
        } else {
            setPendingCollaborators(prev => [...prev, {
                email: email,
                status: 'invite_needed',
                displayName: email
            }]);
        }
        setInviteUsername('');
    };

    const removePendingCollaborator = (index) => {
        setPendingCollaborators(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        if (id) {
            const existing = habits.find(h => h.id === id);
            if (existing) {
                setFormData({
                    title: existing.title,
                    reward: existing.reward,
                    expiresAt: existing.expiresAt ? existing.expiresAt.split('T')[0] : '',
                    icon: existing.icon,
                    color: existing.color,
                    sound: existing.sound || 'ding',
                    category: existing.category || '',
                    mode: existing.mode || 'personal',
                    isPrivate: existing.isPrivate || false,
                    punchCount: existing.punchCount || 10
                });

                if (existing.mode === 'collab') {
                    fetchCollaborators(id);
                }
            }
        }
    }, [id, habits]);

    const fetchCollaborators = async (cardId) => {
        const { data } = await supabase
            .from('collaborators')
            .select('*, profiles(display_name)')
            .eq('card_id', cardId);

        if (data) {
            setCollaborators(data.map(d => ({
                userId: d.user_id,
                username: d.profiles?.display_name || 'Unknown',
                joinedAt: d.joined_at
            })));
        }
    };

    const handleShare = async () => {
        if (!inviteUsername) return;
        setShareMsg('Sharing...');
        setShowInviteBtn(false);
        setInviteLink('');
        const { error, success, notFound, inviteLink: generatedLink } = await shareHabit(id, inviteUsername);
        if (error) {
            if (notFound) {
                setShareMsg('User hasn\'t signed up yet. Please share the link to collaborate on this card!');
                setShowInviteBtn(true);
                setInviteLink(generatedLink);
            } else {
                setShareMsg('Error: ' + error);
            }
        } else {
            setShareMsg('Shared successfully!');
            setInviteUsername('');
            fetchCollaborators(id); // Reload list
        }
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setShareMsg('Invite link copied!');
    };

    const sendEmailInvite = () => {
        const baseUrl = window.location.href.split('#')[0].replace(/\/$/, "");
        const subject = encodeURIComponent(`Collaborate on Punch Buddy! ✨`);
        const body = encodeURIComponent(`Hi there!\n\nI'm using Punch Buddy to track my habits and I'd love for you to collaborate with me on "${formData.title}".\n\nJoin me here: ${baseUrl}\n\nHappy punching!`);
        window.location.href = `mailto:${inviteUsername}?subject=${subject}&body=${body}`;
        setShareMsg('Email client opened!');
        setShowInviteBtn(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.reward) return;

        let habitId = id;

        if (id) {
            await updateHabit(id, formData);
        } else {
            // New Habit Creation
            const newHabit = await addHabit(formData);
            if (newHabit) habitId = newHabit.id;
        }

        // Handle Pending Collaborators (for both new and editing)
        if (habitId && formData.mode === 'collab' && pendingCollaborators.length > 0) {
            for (const collaborator of pendingCollaborators) {
                await shareHabit(habitId, collaborator.email);
            }

            // Check for "invite needed" users to show final status
            const guests = pendingCollaborators.filter(c => c.status === 'invite_needed');
            if (guests.length > 0) {
                // If there were guests, we should probably redirect to the share page or show a modal
                // For now, let's alert or specific flow
                // Actually, standard flow is: create -> redirect to Dashboard.
                // The user said: "invite by sharing this card with them after saving!"
                // So we just let them go to dashboard, and they can open the card to see the share button.
                // Maybe a toast would be nice?
                alert(`Card created! ${guests.length} users haven't joined yet. Don't forget to share the card link with them!`);
            } else {
                alert('Card created and collaborators added!');
            }
        }

        navigate('/');
    };

    return (
        <div className="create-habit-page">
            <h2>{id ? 'Edit Punch Card' : 'New Punch Card'}</h2>

            <form onSubmit={handleSubmit} className="habit-form">
                {!user && (
                    <div className="login-tip" style={{ padding: '1rem', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(74, 144, 226, 0.2)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Lightbulb size={18} color="#4a90e2" />
                        <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>
                            <strong>Tip:</strong> We recommend <Link to="/login" style={{ color: '#4a90e2', fontWeight: 'bold' }}>logging in</Link> to ensure you don't lose your progress, and so your friends can cheer you on!
                        </p>
                    </div>
                )}
                <div className="form-group">
                    <label>Habit Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Morning Jog"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Card Mode</label>
                    <div className="mode-options" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="mode"
                                value="personal"
                                checked={formData.mode === 'personal'}
                                onChange={() => setFormData({ ...formData, mode: 'personal', isPrivate: false })}
                            />
                            Personal
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="mode"
                                value="collab"
                                checked={formData.mode === 'collab'}
                                onChange={() => setFormData({ ...formData, mode: 'collab', isPrivate: false })}
                            />
                            Collab
                        </label>
                    </div>
                    {/* Private Toggle - Only for Personal Mode */}
                    {formData.mode === 'personal' && (
                        <div style={{ marginTop: '0.8rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#555' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isPrivate}
                                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                                />
                                Make this card Private (Hidden from public profile)
                            </label>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>Punch Goal</label>
                    <div className="punch-options" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="punchCount"
                                value={10}
                                checked={formData.punchCount === 10}
                                onChange={() => setFormData({ ...formData, punchCount: 10 })}
                            />
                            10 Punches
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="punchCount"
                                value={30}
                                checked={formData.punchCount === 30}
                                onChange={() => setFormData({ ...formData, punchCount: 30 })}
                            />
                            30 Punches
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label>Reward</label>
                    <input
                        type="text"
                        placeholder="e.g. Buy a new book"
                        required={formData.mode !== 'collab'}
                        value={formData.reward}
                        onChange={e => setFormData({ ...formData, reward: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Expiration Date</label>
                    <input
                        type="date"
                        value={formData.expiresAt}
                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Choose Icon</label>
                    <div className="icon-grid">
                        {ICONS.map(icon => (
                            <button
                                key={icon}
                                type="button"
                                className={`icon-btn ${formData.icon === icon ? 'selected' : ''}`}
                                onClick={() => setFormData({ ...formData, icon })}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Card Color</label>
                    <div className="color-grid">
                        {JEWEL_TONES.map(tone => (
                            <button
                                key={tone.value}
                                type="button"
                                className={`color-btn ${formData.color === tone.value ? 'selected' : ''}`}
                                style={{ backgroundColor: tone.value }}
                                onClick={() => setFormData({ ...formData, color: tone.value })}
                                aria-label={tone.name}
                            />
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Celebration Sound</label>
                    <select
                        value={formData.sound}
                        onChange={e => {
                            setFormData({ ...formData, sound: e.target.value });
                            playSound(e.target.value);
                        }}
                    >
                        {SOUND_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id} onClick={() => playSound(opt.id)}>
                                {opt.label} (Click to Preview)
                            </option>
                        ))}
                    </select>

                </div>

                <div className="form-group">
                    <label>Category (Optional)</label>
                    <div className="category-suggestions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {CATEGORY_SUGGESTIONS.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                className={`category-pill ${formData.category === cat ? 'selected' : ''}`}
                                onClick={() => setFormData({ ...formData, category: cat })}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '16px',
                                    border: '1px solid #ddd',
                                    background: formData.category === cat ? '#242424' : 'white',
                                    color: formData.category === cat ? 'white' : '#666',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Or type your own..."
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                    />
                </div>

                {
                    formData.mode === 'collab' && (
                        <div className="form-group" style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                            <label>Add Collaborators</label>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>
                                Search for friends by <b>email</b> or <b>display name</b> to add them.
                            </p>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="Enter email or display name..."
                                    value={inviteUsername}
                                    onChange={e => setInviteUsername(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCollaborator();
                                        }
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCollaborator}
                                    className="button-secondary"
                                    style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                                    disabled={!inviteUsername}
                                >
                                    <UserPlus size={16} style={{ marginRight: '4px' }} /> Add
                                </button>
                            </div>

                            {/* Pending List */}
                            {pendingCollaborators.length > 0 && (
                                <div className="pending-collaborators" style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#444' }}>Will be invited:</h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {pendingCollaborators.map((c, i) => (
                                            <li key={i} style={{
                                                padding: '0.6rem',
                                                background: '#f5f5f5',
                                                marginBottom: '6px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                color: '#333'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 500 }}>{c.displayName || c.email}</span>
                                                    <span style={{ fontSize: '0.75rem', color: c.status === 'found' ? '#2e7d32' : '#e65100' }}>
                                                        {c.status === 'found'
                                                            ? '✅ User found - Will be added immediately'
                                                            : '⚠️ Not on Punch Buddy - Invite link will be generated after save'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removePendingCollaborator(i)}
                                                    style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', padding: '4px' }}
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Existing Collaborators (if editing) */}
                            {collaborators.length > 0 && (
                                <div className="collaborators-list" style={{ marginTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#666' }}>Current Collaborators:</h4>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {collaborators.map(c => (
                                            <li key={c.userId} style={{ padding: '0.75rem', background: '#f5f5f5', marginBottom: '6px', borderRadius: '8px', fontSize: '0.95rem', color: '#333', fontWeight: '500' }}>
                                                {c.username}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )
                }

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/')} className="btn-cancel">
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit">
                        {id ? 'Save Changes' : 'Create Card'}
                    </button>
                </div>
            </form >
        </div >
    );
};

export default CreateHabit;
