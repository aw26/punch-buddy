import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import PunchCard from '../components/PunchCard/PunchCard';
import { User, ArrowLeft } from 'lucide-react';

const UserProfile = () => {
    const { userId } = useParams();
    const { fetchPublicHabits, searchUserByEmail } = useHabits();
    const [publicHabits, setPublicHabits] = useState([]);
    const [profileName, setProfileName] = useState('User');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                // 1. Fetch public habits
                const habits = await fetchPublicHabits(userId);
                setPublicHabits(habits);

                // 2. We might want to fetch display name too if not available
                // Ideally this should be a separate little fetch or passed in location state
                // For now, let's grab it from the first habit if available, or just say "User Profile"
                if (habits.length > 0) {
                    // Check collaborators/followers details as a slightly hacky way? 
                    // Or better: Just do a profile fetch by ID which we don't strictly have in context yet publically
                    // Actually, we can assume the user landed here from search, so maybe we pass name in state?
                    // Let's rely on the cards for now or generic.
                }

            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [userId]);

    return (
        <div className="user-profile-page" style={{ padding: '1rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', textDecoration: 'none', marginBottom: '1.5rem' }}>
                <ArrowLeft size={18} /> Back to Home
            </Link>

            <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f0f0f0', borderRadius: '50%', padding: '1rem' }}>
                    <User size={32} color="#666" />
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>User Profile</h2>
                    <p style={{ margin: 0, color: '#888' }}>{userId ? 'Viewing Public Cards' : ''}</p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : (
                <>
                    {publicHabits.length === 0 ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f9f9f9', borderRadius: '12px', border: '2px dashed #eee' }}>
                            <p style={{ color: '#888' }}>This user has no public cards.</p>
                        </div>
                    ) : (
                        <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {publicHabits.map(habit => (
                                <PunchCard key={habit.id} habit={habit} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default UserProfile;
