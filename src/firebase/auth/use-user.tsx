'use client';

import { useEffect, useState } from 'react';
import { type User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export type AppUser = {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  user_metadata: User['user_metadata'];
  raw: User;
};

function toAppUser(user: User): AppUser {
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    null;

  const photoURL =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null;

  return {
    uid: user.id,
    id: user.id,
    email: user.email ?? null,
    displayName,
    photoURL,
    user_metadata: user.user_metadata,
    raw: user,
  };
}

export function useUser() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setUser(data.session?.user ? toAppUser(data.session.user) : null);
      setLoading(false);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ? toAppUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
