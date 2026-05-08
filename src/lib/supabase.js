import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if credentials are present and not placeholders
const isValidConfig = supabaseUrl && 
                     supabaseAnonKey && 
                     supabaseUrl !== 'https://your-project-id.supabase.co' &&
                     supabaseAnonKey !== 'your-anon-key';

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!isValidConfig) {
  console.log('🚀 TaskMate: Supabase URL/Key missing. App will run in Simulation Mode.');
}

export default supabase;
