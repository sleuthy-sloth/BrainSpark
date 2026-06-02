"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // 'google' | 'magic' | null
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setEmail("");
      setMagicSent(false);
      setError("");
      setLoading(null);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleGoogle = useCallback(async () => {
    setLoading("google");
    setError("");
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthErr) {
        setError(oauthErr.message);
        setLoading(null);
      }
      // If no error, the page redirects away — no need to clear loading
    } catch {
      setError("Failed to start Google sign-in. Please try again.");
      setLoading(null);
    }
  }, []);

  const handleMagicLink = useCallback(async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading("magic");
    setError("");
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: magicErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
      });
      if (magicErr) {
        setError(magicErr.message);
      } else {
        setMagicSent(true);
      }
    } catch {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setLoading(null);
    }
  }, [email]);

  const handleGuest = useCallback(() => {
    localStorage.setItem("guest_mode", "true");
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm glass-card-static animate-scale-in overflow-hidden"
          role="dialog"
          aria-label="Sign in"
        >
          {/* Header */}
          <div className="p-6 pb-0 text-center">
            <h2 className="text-2xl font-extrabold text-gradient">Sign In</h2>
            <p className="text-text-secondary text-sm mt-1">
              Sync your progress across devices
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loading !== null}
              className="btn btn-md w-full justify-center gap-3 btn-ghost border-[var(--border-accent)] hover:bg-white/5"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading === "google" ? "Connecting..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              <span className="text-xs text-text-muted uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>

            {/* Magic link */}
            {!magicSent ? (
              <div className="space-y-3">
                <p className="text-xs text-text-muted text-center">
                  Get a sign-in link via email
                </p>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-text-primary text-sm placeholder:text-text-muted outline-none focus:border-[var(--accent-blue)] transition-colors"
                  disabled={loading !== null}
                  autoComplete="email"
                />
                <button
                  onClick={handleMagicLink}
                  disabled={loading !== null}
                  className="btn btn-md w-full justify-center btn-primary"
                >
                  {loading === "magic" ? "Sending..." : "Send Magic Link"}
                </button>
              </div>
            ) : (
              <div className="text-center py-2 animate-fade-in">
                <div className="text-3xl mb-2">📧</div>
                <p className="text-sm text-text-secondary font-medium">
                  Check your inbox!
                </p>
                <p className="text-xs text-text-muted mt-1">
                  We sent a sign-in link to <strong>{email}</strong>
                </p>
                <button
                  onClick={() => setMagicSent(false)}
                  className="text-xs text-[var(--accent-blue)] hover:underline mt-3"
                >
                  Use a different email
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-[var(--accent-rose)] text-center animate-shake">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 text-center">
            <button
              onClick={handleGuest}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors underline underline-offset-2 decoration-dotted"
            >
              Play as Guest
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
