import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export default supabase
        