import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('AuthContext: Initial session check:', session);
            console.log('AuthContext: Current URL:', window.location.href);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Check for redirect after auth
            if (session?.user) {
                const returnCard = localStorage.getItem('return_card_after_auth');
                if (returnCard) {
                    localStorage.removeItem('return_card_after_auth');
                    // Navigate to the card they were trying to view
                    navigate(`/share?id=${returnCard}`);
                }
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [navigate]);

    const signInWithEmail = async (email, displayName) => {
        // We request a One-Time Password (OTP) - Supabase sends a code by default if Magic Link is disabled, or both.
        // But to be safe and cross-device, we rely on the user inputting the code from the email.
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // Restoring emailRedirectTo ensures the link works as a fallback
                emailRedirectTo: window.location.origin + window.location.pathname,
                data: {
                    display_name: displayName,
                },
                // Force code (if supported by project settings) or just rely on the template
            }
        });
        return { error };
    };

    const verifyOtp = async (email, token) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        });
        return { data, error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        user,
        session,
        loading,
        signInWithEmail,
        verifyOtp,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
