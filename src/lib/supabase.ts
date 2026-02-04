import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
// TODO: Revert to using import.meta.env once the environment cache is cleared
const supabaseUrl = 'https://qjvijqskzqyzgxgchllz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdmlqcXNrenF5emd4Z2NobGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDM3NjAsImV4cCI6MjA4NTIxOTc2MH0.jGvO6mS7FLAxgR66A9sBDS7IMn5fjwo-_q9hN4P1Ybg';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase env vars missing');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
