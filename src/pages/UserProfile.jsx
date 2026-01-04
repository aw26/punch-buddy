import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import { supabase } from '../utils/supabaseClient';
import PunchCard from '../components/PunchCard/PunchCard';
import { User, ArrowLeft } from 'lucide-react';

const UserProfile = () => {
    const { userId } = useParams();
    const { fetchPublicHabits, searchUserByEmail } = useHabits();
    const [publicHabits, setPublicHabits] = useState([]);
    const [profileName, setProfileName] = useState('User');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            if (!userId) return;
            setLoading(true);
            try {
                // 1. Fetch public habits
                const habits = await fetchPublicHabits(userId);
                setPublicHabits(habits);

                // 2. Fetch profile display name
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('display_name, avatar_url')
                    .eq('id', userId)
                    .single();

                if (!profileError && profile) {
                    setProfileName(profile.display_name);
                    setAvatarUrl(profile.avatar_url);
                } else if (habits.length > 0) {
                    setProfileName(habits[0].creator_name || 'User');
                } else {
                    setProfileName('User');
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
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #eee'
                }}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={profileName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <User size={32} color="#666" />
                    )}
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>{profileName}</h2>
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
