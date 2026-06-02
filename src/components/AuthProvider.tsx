"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, type AuthUser, getUser, signOut } from "@/lib/supabase";
import { syncOfflineQueue } from "@/lib/db";

interface AuthContextValue {
  /** The current user, or null if not signed in */
  user: AuthUser | null;
  /** True during initial session check (before we know if user is signed in) */
  loading: boolean;
  /** True if the user has chosen guest mode */
  isGuest: boolean;
  /** Request the user to sign in (opens modal) */
  requestSignIn: () => void;
  /** Sign out */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isGuest: false,
  requestSignIn: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Refresh user state
  const refreshUser = useCallback(async () => {
    const u = await getUser();
    setUser(u);
    setLoading(false);
  }, []);

  // Hydrate guest flag
  useEffect(() => {
    setIsGuest(localStorage.getItem("guest_mode") === "true");
  }, []);

  // Set up session listener
  useEffect(() => {
    // Check initial session
    refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Refresh user data
        await refreshUser();

        // Clear guest mode if they were a guest
        localStorage.removeItem("guest_mode");
        setIsGuest(false);

        // Sync any offline-queued sessions to Supabase
        try {
          const synced = await syncOfflineQueue();
          if (synced > 0) {
            console.log(`Synced ${synced} offline game sessions to Supabase`);
          }
        } catch (err) {
          console.warn("Offline queue sync failed:", err);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const value: AuthContextValue = {
    user,
    loading,
    isGuest,
    requestSignIn: () => {
      // This is handled by opening the modal — the consumer will check this
      // by reading the "showAuthModal" state that the AuthModal component controls
    },
    signOut: async () => {
      await signOut();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to control the auth modal visibility from any component.
 */
export function useAuthModal() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const openAuthModal = useCallback(() => setShowAuthModal(true), []);
  const closeAuthModal = useCallback(() => setShowAuthModal(false), []);

  return { showAuthModal, openAuthModal, closeAuthModal };
}
