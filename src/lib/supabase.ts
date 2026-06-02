import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthUser = {
  id: string;
  email: string | undefined;
  username: string | undefined;
  avatarUrl: string | undefined;
};

/**
 * Returns the current session user or null if not authenticated.
 */
export async function getUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;

  const user = data.session.user;

  // Try to fetch profile — may fail if profiles table doesn't exist yet
  let username: string | undefined;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username;
  } catch {
    // Profile table may not exist yet
  }

  return {
    id: user.id,
    email: user.email,
    username,
    avatarUrl: user.user_metadata?.avatar_url,
  };
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
