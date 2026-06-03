"use client";

import NavBar from "@/components/NavBar";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <>
      <NavBar />
      <main className="relative z-10 px-5 pt-4 pb-4 has-bottom-nav">
        <div className="max-w-lg mx-auto">
          <h1 className="text-[22px] font-bold text-white mb-6">Profile</h1>

          <div className="elevate-card p-5">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center text-2xl text-[var(--accent-blue)] font-mono-digits">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-white">
                      {user.username || "User"}
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)]">{user.email}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <button onClick={signOut} className="btn btn-md btn-ghost w-full justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <path d="M16 17l5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-[var(--text-secondary)] text-center py-6">
                Sign in to sync your progress across devices
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
