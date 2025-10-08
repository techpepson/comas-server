import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { configDotenv } from 'dotenv';

configDotenv();

const supabaseUrl =
  process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error(
    'Missing Supabase URL. Set SUPABASE_PROJECT_URL or SUPABASE_URL in your environment.',
  );
}

if (!supabaseKey) {
  throw new Error(
    'Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in your environment.',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
