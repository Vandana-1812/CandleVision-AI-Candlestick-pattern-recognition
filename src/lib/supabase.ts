'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { reportClientError } from '@/lib/telemetry';
import { isSupabaseConfigValid, supabaseConfig } from './supabase-config';

let browserSupabaseClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigValid) {
    reportClientError('supabase.config', new Error('Supabase client configuration missing or invalid'));
    return null;
  }

  try {
    if (!browserSupabaseClient) {
      browserSupabaseClient = createClient(supabaseConfig.url!, supabaseConfig.publishableKey!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }

    return browserSupabaseClient;
  } catch (error) {
    reportClientError('supabase.initialize', error);
    return null;
  }
}