import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/shared/types/database';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid Supabase URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(20, 'VITE_SUPABASE_ANON_KEY is required'),
});

const parsedEnv = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const isSupabaseConfigured = parsedEnv.success;
export const envConfigError = parsedEnv.success
  ? null
  : parsedEnv.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' | ');

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-anon-key-please-configure-env';

export const supabase = createClient<Database>(
  parsedEnv.success ? parsedEnv.data.VITE_SUPABASE_URL : fallbackUrl,
  parsedEnv.success ? parsedEnv.data.VITE_SUPABASE_ANON_KEY : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
