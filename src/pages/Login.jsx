import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, User } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState(''); // New state
    const [otpCode, setOtpCode] = useState('');
    const [step, setStep] = useState('email'); // 'email' | 'otp'
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signInWithEmail, verifyOtp, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // ... (useEffect remains same) ...

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        console.log('handleEmailSubmit triggered, isLoading:', isLoading);
        if (isLoading) return; // Extra safety

        setIsLoading(true);
        setMessage('');

        // Use entered name or fallback to email prefix if empty (though we made it optional/required?)
        // Let's make it optional but default to email prefix if purely empty
        const finalName = displayName.trim() || email.split('@')[0];

        const { error } = await signInWithEmail(email, finalName);

        setIsLoading(false);
        if (error) {
            setMessage('Error sending login code: ' + error.message);
        } else {
            setStep('otp');
            setMessage('Check your email for the code or magic link!');
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const { data, error } = await verifyOtp(email, otpCode);
        setIsLoading(false);

        if (error) {
            setMessage('Invalid code. Please try again.');
        } else {
            // Success! Redirect to intended destination or dashboard
            const returnTo = searchParams.get('returnTo') || '/';
            navigate(returnTo);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card backdrop-blur">
                <div className="login-header">
                    <h2>{step === 'email' ? 'Welcome Back' : 'Verify Login'}</h2>
                    <p>{step === 'email'
                        ? 'Enter your email to sign in or create an account.'
                        : `Enter the code sent to ${email}`}</p>
                </div>

                {step === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="login-form">
                        <div className="input-group">
                            <User className="input-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <button type="submit" className="button-primary block" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Login Code'}
                        </button>
                    </form>
                ) : (
                    // ... (OTP form remains same) ...
                    <form onSubmit={handleOtpSubmit} className="login-form">
                        <div className="input-group">
                            <KeyRound className="input-icon" size={20} />
                            <input
                                type="text"
                                placeholder="123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.trim())}
                                required
                                maxLength={8}
                                disabled={isLoading}
                                autoFocus
                                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.4rem' }}
                            />
                        </div>
                        <button type="submit" className="button-primary block" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <button
                            type="button"
                            className="button-text"
                            onClick={() => setStep('email')}
                            style={{ width: '100%', marginTop: '1rem', color: '#888' }}
                        >
                            ← Back to Email
                        </button>
                    </form>
                )}

                {message && (
                    <div className={`message ${message.includes('Error') || message.includes('Invalid') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
