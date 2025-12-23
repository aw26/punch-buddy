import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';
import PunchCard from '../components/PunchCard/PunchCard';
import { Home as HomeIcon, Users, Archive, Plus } from 'lucide-react';

const Home = () => {
    const { habits, loading } = useHabits();
    const { user } = useAuth();
    const [currentTab, setCurrentTab] = useState('mine'); // 'mine', 'following', 'archive'
    const [categoryFilter, setCategoryFilter] = useState('All');

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

            <div className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                    {currentTab === 'mine' ? 'Your Active Cards' : currentTab === 'following' ? "Friends' Progress" : 'Archived Cards'}
                </h2>
                {currentTab === 'mine' && (
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
