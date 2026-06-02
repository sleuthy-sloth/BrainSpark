"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";

interface UserMenuProps {
  /** Called when user wants to sign in */
  onSignInClick: () => void;
}

export default function UserMenu({ onSignInClick }: UserMenuProps) {
  const { user, isGuest, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Signed-in user
  if (user) {
    const initial = (user.email?.[0] ?? user.id[0]).toUpperCase();
    const displayName = user.username ?? user.email ?? "Player";

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold bg-[var(--accent-blue)] text-white hover:brightness-110 transition-all"
          aria-label="User menu"
          title={displayName}
        >
          {initial}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 glass-card-static animate-fade-in overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
              <p className="text-sm font-medium text-text-primary truncate">
                {displayName}
              </p>
              {user.email && (
                <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:text-[var(--accent-rose)] hover:bg-white/5 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Guest mode
  if (isGuest) {
    return (
      <button
        onClick={onSignInClick}
        className="text-xs text-text-muted hover:text-[var(--accent-blue)] transition-colors whitespace-nowrap"
        title="Sign in to sync your progress"
      >
        Sign in ⇧
      </button>
    );
  }

  // Anonymous — no guest mode set
  return (
    <button
      onClick={onSignInClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center btn-ghost text-sm"
      aria-label="Sign in"
      title="Sign in"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </button>
  );
}
