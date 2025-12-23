import React, { useState, useEffect } from 'react';

// Simple sound toggle component that manages localStorage directly
// to work with the decoupled sound utility
const SoundToggle = () => {
    const [muted, setMuted] = useState(() => {
        return localStorage.getItem('punchtime_muted') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('punchtime_muted', muted);
    }, [muted]);

    return (
        <button
            onClick={() => setMuted(!muted)}
            style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                backgroundColor: muted ? '#eee' : '#fff'
            }}
            title={muted ? 'Unmute' : 'Mute'}
        >
            {muted ? '🔇' : '🔊'}
        </button>
    );
};

export default SoundToggle;
