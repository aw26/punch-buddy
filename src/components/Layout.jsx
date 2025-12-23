import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SoundToggle from './SoundToggle';
import OnboardingTip from './OnboardingTip';
import './Layout.css';

const Layout = ({ children }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="app-layout">
            <header className="app-header">
                <Link to="/" className="logo" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Punch Buddy <span role="img" aria-label="sparkles">✨</span>
                    </h1>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        My Habit Rewards Card
                    </span>
                </Link>
                <div className="header-actions">
                    <SoundToggle />
                    {user ? (
                        <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', marginRight: '0.5rem' }}>
                                {user.email?.split('@')[0]}
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="button-text"
                                style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="button-text" style={{ fontSize: '0.9rem', textDecoration: 'none', fontWeight: 'bold', color: 'white' }}>
                            Login
                        </Link>
                    )}
                </div>
            </header>
            <OnboardingTip />

            <main className="app-content">
                {children}
            </main>

            <footer className="footer" style={{ padding: '2rem', textAlign: 'center', opacity: 0.9 }}>
                <p>Welcome to Angela's fun tools - built to brighten your day ☀️!</p>
                <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
                    Questions, ideas, feedback? Please share with me at <a href="mailto:menghuawu@gmail.com" style={{ color: 'inherit' }}>menghuawu@gmail.com</a>
                </p>
                <div style={{ marginTop: '1rem' }}>
                    <Link to="/archive" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }}>Archive</Link>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
