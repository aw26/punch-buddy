import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
                <Route path="/archive" element={<Archive />} />
                <Route path="/login" element={<Login />} />
                <Route path="/invite" element={<Invite />} />
            </Routes>
        </Layout>
    );
};

function App() {
    return (
        <AuthProvider>
            <HabitProvider>
                <Router>
                    <AppContent />
                </Router>
            </HabitProvider>
        </AuthProvider>
    );
}

export default App;
