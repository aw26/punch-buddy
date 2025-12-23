import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

const OnboardingTip = () => {
    const [visible, setVisible] = useState(() => {
        return !localStorage.getItem('punchtime_onboarding_dismissed');
    });

    if (!visible) return null;

    const handleDismiss = () => {
        setVisible(false);
        localStorage.setItem('punchtime_onboarding_dismissed', 'true');
    };

    return (
        <div style={{
            background: '#e3f2fd',
            color: '#0d47a1',
            padding: '0.75rem 1rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #bbdefb',
            position: 'relative'
        }}>
            <Lightbulb size={16} />
            <span>Tip: Add to your home screen for the best experience! 📱</span>
            <button
                onClick={handleDismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#0d47a1',
                    padding: '0 0.5rem',
                    position: 'absolute',
                    right: '8px',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default OnboardingTip;
