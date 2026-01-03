import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import PunchCard from '../components/PunchCard/PunchCard';
import { Home as HomeIcon, Users, Archive, Plus } from 'lucide-react';
import TourOverlay from '../components/TourOverlay';

const Home = () => {
    const { habits, loading, searchUserByEmail, onboardingAction, dismissOnboarding } = useHabits();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState('mine'); // 'mine', 'following', 'archive'
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Search State
    const [searchEmail, setSearchEmail] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);

    // Tour State
    const [tourSteps, setTourSteps] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchEmail.trim()) return;

        setSearchLoading(true);
        const { user: foundUser, error } = await searchUserByEmail(searchEmail.trim());
        setSearchLoading(false);

        if (foundUser) {
            navigate(`/profile/${foundUser.id}`);
        } else {
            alert('User not found. Check the email and try again!');
        }
    };

    // Effect to trigger tour based on onboardingAction or New User
    useEffect(() => {
        if (loading) return;

        // 1. Followed Card Flow
        if (onboardingAction?.type === 'follow') {
            setCurrentTab('following');
            setTourSteps([
                {
                    target: '.punch-card .card-header',
                    title: 'Say Hello! 👋',
                    content: "You're now following this card! Send a cheer or comment to encourage them."
                },
                {
                    target: '.punch-card .action-btn-copy',
                    title: 'Join In 👯‍♀️',
                    content: "Want to do this habit too? Click here to add it to your own cards."
                },
                {
                    target: '.btn-create',
                    title: 'Start Fresh ✨',
                    content: "Or create a completely new habit card from scratch."
                }
            ]);
        }
        // 2. Joined Collab Flow
        else if (onboardingAction?.type === 'join') {
            setCurrentTab('mine');
            setTourSteps([
                {
                    target: '.punch-card .card-header',
                    title: 'Collaborating! 🤝',
                    content: "You're now a collaborator on this card. Punches are shared!"
                },
                {
                    target: '.punch-card .comments-trigger',
                    title: 'Cheer the Team 👏',
                    content: "Send a message to your fellow collaborators."
                }
            ]);
        }
        // 3. New User Flow (No habits, no onboarding action)
        else if (!onboardingAction && habits.length === 0 && !localStorage.getItem('onboarding_seen')) {
            setTourSteps([
                {
                    target: '.empty-state',
                    title: 'Welcome to Punch Buddy! 👊',
                    content: "This is where your active habits will live."
                },
                {
                    target: '.btn-create',
                    title: 'Make Your First Habit',
                    content: "Click here to create your first punch card. It's easy!"
                }
            ]);
        }

    }, [onboardingAction, loading, habits.length]);

    const handleTourComplete = () => {
        setTourSteps(null);
        dismissOnboarding();
        localStorage.setItem('onboarding_seen', 'true');
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading your cards...</div>;

    // Filter by Tab
    let tabHabits = [];
    if (currentTab === 'mine') {
        tabHabits = habits.filter(h =>
            (h.creatorId === user?.id || (h.collaborators && h.collaborators.some(c => c.user_id === user?.id)))
            && !h.archived
        );
    } else if (currentTab === 'following') {
        tabHabits = habits.filter(h =>
            h.followers && h.followers.some(f => f.user_id === user?.id) && !h.archived
        );
    } else if (currentTab === 'archive') {
        tabHabits = habits.filter(h => h.archived);
    }

    // Filter by Category
    const filteredHabits = categoryFilter === 'All'
        ? tabHabits
        : tabHabits.filter(h => h.category === categoryFilter);

    // Sort: Active at top, Completed at bottom
    const sortedHabits = [...filteredHabits].sort((a, b) => {
        const aComplete = a.punches.length >= (a.punchCount || 10);
        const bComplete = b.punches.length >= (b.punchCount || 10);
        if (aComplete === bComplete) return new Date(b.createdAt) - new Date(a.createdAt);
        return aComplete ? 1 : -1;
    });

    // Extract dynamic categories from the current tab's habits
    const availableCategories = ['All', ...new Set(tabHabits.map(h => h.category).filter(Boolean))];

    return (
        <div className="home-page">
            {tourSteps && (
                <TourOverlay
                    steps={tourSteps}
                    onComplete={handleTourComplete}
                    onSkip={handleTourComplete}
                />
            )}

            <div className="tab-switcher" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => { setCurrentTab('mine'); setCategoryFilter('All'); }}
                    style={{ padding: '0.8rem 1rem', border: 'none', background: 'none', borderBottom: currentTab === 'mine' ? '3px solid #4a90e2' : 'none', fontWeight: currentTab === 'mine' ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <HomeIcon size={18} /> My Cards
                </button>
                <button
                    onClick={() => { setCurrentTab('following'); setCategoryFilter('All'); }}
                    style={{ padding: '0.8rem 1rem', border: 'none', background: 'none', borderBottom: currentTab === 'following' ? '3px solid #4a90e2' : 'none', fontWeight: currentTab === 'following' ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Users size={18} /> Following
                </button>
                <button
                    onClick={() => { setCurrentTab('archive'); setCategoryFilter('All'); }}
                    style={{ padding: '0.8rem 1rem', border: 'none', background: 'none', borderBottom: currentTab === 'archive' ? '3px solid #4a90e2' : 'none', fontWeight: currentTab === 'archive' ? 'bold' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Archive size={18} /> Archive
                </button>
            </div>

            {/* User Search (Only in Following Tab) */}
            {currentTab === 'following' && (
                <div className="user-search" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="email"
                            placeholder="Find friend by email..."
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            required
                            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }}
                        />
                        <button
                            type="submit"
                            disabled={searchLoading}
                            style={{
                                padding: '0 1.5rem',
                                background: '#242424',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}
                        >
                            {searchLoading ? 'Searching...' : 'Find'}
                        </button>
                    </form>
                </div>
            )}

            <div className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                    {currentTab === 'mine' ? 'Your Active Cards' : currentTab === 'following' ? "Friends' Progress" : 'Archived Cards'}
                </h2>
                {(currentTab === 'mine' || currentTab === 'following') && (
                    <Link to="/new" className="btn-create" style={{
                        background: '#242424', color: 'white', padding: '0.5rem 1rem',
                        borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        <Plus size={18} /> New Card
                    </Link>
                )}
            </div>

            {availableCategories.length > 2 && (
                <div className="category-filters" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '16px',
                                border: 'none',
                                background: categoryFilter === cat ? '#4a90e2' : '#f0f0f0',
                                color: categoryFilter === cat ? 'white' : '#666',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {sortedHabits.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f9f9f9', borderRadius: '12px', border: '2px dashed #eee' }}>
                    <p style={{ color: '#888' }}>
                        {currentTab === 'mine' ? "You don't have any active cards yet." : currentTab === 'following' ? "You aren't following anyone's cards yet." : "Your archive is empty."}
                    </p>
                    {currentTab === 'mine' && (
                        <Link to="/new" style={{ color: '#4a90e2', fontWeight: 'bold', textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>
                            Create your first card →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {sortedHabits.map(habit => (
                        <PunchCard key={habit.id} habit={habit} />
                    ))}
                </div>
            )}

            {sortedHabits.length > 0 && (
                <p style={{ marginTop: '2rem', color: '#888', fontSize: '0.8rem', textAlign: 'center' }}>
                    Showing {sortedHabits.length} {sortedHabits.length === 1 ? 'card' : 'cards'} {currentTab === 'mine' ? 'of mine' : (currentTab === 'following' ? "from friends" : 'in archive')}
                </p>
            )}
        </div>
    );
};
export default Home;
