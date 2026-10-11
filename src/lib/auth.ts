import { cookies } from 'next/headers';
import { getSupabaseServerClient } from './supabase/server';
import { findUserById, findUserByEmail, createUser } from './store/repository';
import { UserProfile } from './types';

export const SESSION_COOKIE_NAME = 'trinance_session';

export async function getCurrentUser(): Promise<UserProfile | null> {
  // 1. Try Supabase Auth if configured
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email || '',
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Analyst',
          role: 'analyst',
          preferences: {
            theme: 'light',
            defaultMode: 'combined',
            layout: 'standard',
          },
          createdAt: user.created_at,
        };
      }
    } catch {
      // Supabase error, fall through
    }
  }

  // 2. Try Local Session Cookie
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionUserId) {
    const user = await findUserById(sessionUserId);
    if (user) {
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
      };
    }
  }

  // Not authenticated
  return null;
}
