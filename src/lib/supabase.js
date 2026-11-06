import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When the env vars are missing the app falls back to the built-in catalogue (src/data/products.js).
export const supabaseEnabled = Boolean(url && anonKey);
export const supabase = supabaseEnabled ? createClient(url, anonKey) : null;
