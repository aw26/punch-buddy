import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HabitProvider, useHabits } from './context/HabitContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Archive from './pages/Archive';
import CreateHabit from './pages/CreateHabit';
import SharedCard from './pages/SharedCard';
import Login from './pages/Login';
import CelebrationOverlay from './components/CelebrationOverlay';
import Invite from './pages/Invite';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';

const AppContent = () => {
    const { celebration, clearCelebration } = useHabits();
    return (
        <Layout>
            {celebration && (
                <CelebrationOverlay
                    soundId={celebration.soundId}
                    reward={celebration.reward}
                    onClose={clearCelebration}
                />
            )}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/new" element={<CreateHabit />} />
                <Route path="/edit/:id" element={<CreateHabit />} />
                <Route path="/share" element={<SharedCard />} />
                <Route path="/invite" element={<Invite />} />
                <Route path="/shared/:id" element={<SharedCard />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/:userId" element={<UserProfile />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
};

import { initAudio } from './utils/sound';

function App() {
    React.useEffect(() => {
        const unlockAudio = () => {
            initAudio();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

    return (
        <Router>
            <AuthProvider>
                <HabitProvider>
                    <AppContent />
                </HabitProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
