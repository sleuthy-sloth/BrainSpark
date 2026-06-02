import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Returns the current session user or null if not authenticated.
 * Checks session storage first, then attempts a refresh.
 */
export async function getUser(): Promise<{
  id: string;
  email: string | undefined;
  username: string | undefined;
} | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;

  const user = data.session.user;

  // Fetch profile for username
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    username: profile?.username,
  };
}
