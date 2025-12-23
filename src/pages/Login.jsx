import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Login = () => {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [displayName, setDisplayName] = useState('');
    const [status, setStatus] = useState('');
    const { signInWithEmail } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }

        const joinParam = searchParams.get('join');
        if (joinParam) {
            localStorage.setItem('pending_join', joinParam);
            console.log('Stored cross-tab pending join:', joinParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Sending magic link...');
        const { error } = await signInWithEmail(email, displayName);
        if (error) {
            setStatus('Error: ' + error.message);
        } else {
            setStatus('Check your email for the magic link!');
        }
    };

    return (
        <div className="login-container" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '800' }}>Login to Punch Buddy</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: '2.5rem', fontSize: '1.1rem', fontWeight: '500' }}>
                Sign in to sync your cards across devices <br /> and collaborate with friends.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="text"
                    placeholder="Display Name (public)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                />
                <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                />
                <button
                    type="submit"
                    className="button-primary"
                    style={{
                        padding: '0.8rem',
                        borderRadius: '8px',
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Send Magic Link
                </button>
            </form>
            {status && <p style={{ marginTop: '1rem', color: status.startsWith('Error') ? 'red' : 'green' }}>{status}</p>}
        </div>
    );
};

export default Login;
