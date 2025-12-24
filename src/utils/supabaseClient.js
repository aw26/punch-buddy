import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jzydcwjwcckvmwcsodcm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eWRjd2p3Y2Nrdm13Y3NvZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzU1NTcsImV4cCI6MjA4MTg1MTU1N30.UQPu6XBY5x_QshAbRxiW7JGFvYFANpQXMoeMue54SB4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
