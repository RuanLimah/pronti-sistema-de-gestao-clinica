import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Supabase env vars missing');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
