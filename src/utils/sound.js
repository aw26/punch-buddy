// Simple synth for sound effects to avoid external assets

let ctx = null;
let noiseBuffer = null;

const getContext = () => {
    if (!ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
    }
    return ctx;
};

const getNoiseBuffer = (context) => {
    if (!noiseBuffer) {
        const bufferSize = context.sampleRate * 2; // 2 seconds
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noiseBuffer = buffer;
    }
    return noiseBuffer;
};

const playTone = (freq, type, duration, volume = 0.1) => {
    const context = getContext();
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, context.currentTime);

    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    osc.connect(gain);
    gain.connect(context.destination);

    osc.start();
    osc.stop(context.currentTime + duration);
};

// Shimmering sparkle sound
const playShimmer = (duration = 0.5) => {
    for (let i = 0; i < 15; i++) {
        const freq = 2000 + Math.random() * 3000;
        const delay = Math.random() * duration;
        setTimeout(() => playTone(freq, 'sine', 0.1, 0.05), delay * 1000);
    }
};

const playNoise = (duration = 0.1, volume = 0.2) => {
    const context = getContext();
    const noise = context.createBufferSource();
    noise.buffer = getNoiseBuffer(context);
    const gain = context.createGain();

    // Bandpass filter to make it sound more like paper/texture
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    noise.start();
};

export const playSound = (soundId) => {
    if (localStorage.getItem('punchtime_muted') === 'true') return;

    const context = getContext();
    if (context.state === 'suspended') {
        context.resume().catch(err => console.error(err));
    }

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
            // "Happy Pop + Crunch"

            // 1. The Pop (Happy upward inflection, slight bubble feel)
            {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.frequency.setValueAtTime(400, context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, context.currentTime + 0.15);

                gain.gain.setValueAtTime(0.15, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);

                osc.type = 'sine';
                osc.connect(gain);
                gain.connect(context.destination);
                osc.start();
                osc.stop(context.currentTime + 0.15);
            }

            // 2. The Paper Crunch (Crisp high-end texture)
            {
                playNoise(0.05, 0.3); // Shorter, crisper noise
            }
            break;
        default:
            // Bubble Pop style fallback
            {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.frequency.setValueAtTime(400, context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1); // Pitch bend up
                gain.gain.setValueAtTime(0.1, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(context.destination);
                osc.start();
                osc.stop(context.currentTime + 0.1);
            }
    }
};
