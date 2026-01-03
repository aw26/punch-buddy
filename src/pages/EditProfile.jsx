import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { ArrowLeft, User, Save } from 'lucide-react';

const EditProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setDisplayName(data.display_name || '');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const updates = {
                id: user.id,
                display_name: displayName,
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;
            setMessage('Profile updated successfully!');
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            setMessage('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(-1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#666', marginBottom: '2rem', fontSize: '1rem' }}
            >
                <ArrowLeft size={20} /> Back
            </button>

            <div className="card-container" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#f0f0f0', borderRadius: '50%', padding: '1rem' }}>
                        <User size={32} color="#666" />
                    </div>
                    <h2 style={{ margin: 0 }}>Edit Profile</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#444' }}>
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="How friends see you (e.g. Angela)"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#444' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={user?.email}
                            disabled
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #eee',
                                background: '#f9f9f9',
                                color: '#888',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>Email cannot be changed.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="button-primary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#242424',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: saving ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>

                    {message && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '10px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            background: message.includes('Error') ? '#fee2e2' : '#dcfce7',
                            color: message.includes('Error') ? '#dc2626' : '#166534'
                        }}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
