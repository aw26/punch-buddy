import React, { useEffect, useState } from 'react';
import './CelebrationOverlay.css';
import { playSound } from '../utils/sound';

const CelebrationOverlay = ({ soundId, reward, onClose }) => {
    const [particles, setParticles] = useState([]);
    const [animationType, setAnimationType] = useState('confetti');

    useEffect(() => {
        playSound(soundId);
        setAnimationType(soundId);

        if (['confetti', 'cheering', 'trumpet', 'horn'].includes(soundId)) {
            const newParticles = [];
            const jewelTones = [
                '#E0115F', // Ruby
                '#50C878', // Emerald
                '#0F52BA', // Sapphire
                '#FFD700', // Gold
                '#9966CC', // Amethyst
                '#0891b2'  // Turquoise
            ];

            for (let i = 0; i < 280; i++) {
                newParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * -60,
                    color: jewelTones[Math.floor(Math.random() * jewelTones.length)],
                    delay: Math.random() * 4,
                    duration: 4 + Math.random() * 4,
                    rotation: Math.random() * 1080,
                    size: 10 + Math.random() * 12,
                    emoji: null, // Strictly paper shimmer
                    isSquare: true
                });
            }
            setParticles(newParticles);
        }

        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [soundId, onClose]);

    return (
        <div className={`celebration-overlay ${animationType}`} onClick={onClose}>
            <div className="celebration-content">
                <h1 className="bounce-in">CONGRATULATIONS!</h1>
                {reward && (
                    <div className="reward-reveal">
                        <p>You've earned:</p>
                        <h2 className="reward-text">{reward}</h2>
                    </div>
                )}

                {particles.length > 0 && (
                    <div className="particles-container">
                        {particles.map(p => (
                            <div
                                key={p.id}
                                className={`particle ${p.emoji ? 'emoji-particle' : p.isSquare ? 'square-particle' : 'shape-particle'}`}
                                style={{
                                    left: `${p.x}%`,
                                    top: `${p.y}%`,
                                    backgroundColor: p.emoji ? 'transparent' : p.color,
                                    animationDelay: `${p.delay}s`,
                                    animationDuration: `${p.duration}s`,
                                    transform: `rotate(${p.rotation}deg)`,
                                    fontSize: p.emoji ? `${p.size}px` : undefined,
                                    width: p.isSquare ? `${p.size}px` : undefined,
                                    height: p.isSquare ? `${p.size * 0.6}px` : undefined
                                }}
                            >
                                {p.emoji}
                            </div>
                        ))}
                    </div>
                )}

                {animationType === 'horn' && <div className="horn-pulse"></div>}

                {animationType === 'ding' && (
                    <div className="ripple-container">
                        <div className="ripple"></div>
                        <div className="ripple" style={{ animationDelay: '0.4s' }}></div>
                        <div className="ripple" style={{ animationDelay: '0.8s' }}></div>
                    </div>
                )}

                <p className="tap-to-dismiss">Tap to dismiss</p>
            </div>
        </div>
    );
};

export default CelebrationOverlay;
