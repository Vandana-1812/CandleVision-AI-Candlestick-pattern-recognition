export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const isSupabaseConfigValid = !!supabaseConfig.url && !!supabaseConfig.publishableKey;