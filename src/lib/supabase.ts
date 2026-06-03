import { createClient } from "@supabase/supabase-js";

/**
 * Lazily initialized Supabase client.
 * During static generation (no env vars), returns a minimal no-op stub
 * so build doesn't crash. At runtime with env vars, returns the real client.
 */
function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
}

function getSupabaseKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
}

/** Non-null assertion — real usage always has env vars at runtime */
export const supabase = createClient(getSupabaseUrl(), getSupabaseKey());

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
