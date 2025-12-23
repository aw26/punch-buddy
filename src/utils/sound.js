// Simple synth for sound effects to avoid external assets
const AudioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioContext();

const playTone = (freq, type, duration, volume = 0.1) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
};

// Shimmering sparkle sound
const playShimmer = (duration = 0.5) => {
    for (let i = 0; i < 15; i++) {
        const freq = 2000 + Math.random() * 3000;
        const delay = Math.random() * duration;
        setTimeout(() => playTone(freq, 'sine', 0.1, 0.05), delay * 1000);
    }
};

export const playSound = (soundId) => {
    if (localStorage.getItem('punchtime_muted') === 'true') return;

    if (ctx.state === 'suspended') ctx.resume();

    switch (soundId) {
        case 'ding':
            playTone(880, 'sine', 1);
            setTimeout(() => playTone(1760, 'sine', 1), 100);
            break;
        case 'confetti':
            // Shimmering pop
            playTone(400, 'triangle', 0.1);
            playShimmer(0.3);
            break;
        case 'cheering':
            // Simulated applause/cheer with white noise + tones
            for (let i = 0; i < 8; i++) {
                setTimeout(() => playTone(300 + Math.random() * 200, 'triangle', 0.2, 0.05), i * 80);
            }
            playShimmer(0.5);
            break;
        case 'trumpet':
            playTone(523.25, 'sawtooth', 0.2); // C5
            setTimeout(() => playTone(659.25, 'sawtooth', 0.2), 150); // E5
            setTimeout(() => playTone(783.99, 'sawtooth', 0.4), 300); // G5
            playShimmer(0.6);
            break;
        case 'horn': // Matching constants.js ID
            playTone(150, 'sawtooth', 0.5);
            playTone(220, 'sawtooth', 0.5); // Multi-tone for richness
            break;
        case 'punch':
            // Sharp paper punch / pop sound
            playTone(150, 'triangle', 0.05);
            setTimeout(() => playTone(300, 'square', 0.05), 20);
            break;
        default:
            // Default punch sound or fallback
            playTone(200, 'square', 0.1);
    }
};
