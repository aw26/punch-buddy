import React from 'react';
import { useHabits } from '../context/HabitContext';
import { Link } from 'react-router-dom';
import PunchCard from '../components/PunchCard/PunchCard';

const Archive = () => {
    const { habits } = useHabits();
    const archivedHabits = habits.filter(h => h.archived);

    return (
        <div className="archive-page">
            <div className="page-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Archive</h2>
                <Link to="/" className="back-link" style={{ color: '#666' }}>Back to Active</Link>
            </div>

            {archivedHabits.length === 0 ? (
                <p>No archived cards yet.</p>
            ) : (
                <div className="card-grid">
                    {archivedHabits.map(habit => (
                        <PunchCard key={habit.id} habit={habit} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Archive;
