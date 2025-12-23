const STORAGE_KEY = 'punchtime_habits_v1';

export const saveHabits = (habits) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (error) {
        console.error('Failed to save habits to localStorage', error);
    }
};

export const loadHabits = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load habits from localStorage', error);
        return [];
    }
};
