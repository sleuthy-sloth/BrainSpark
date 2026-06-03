"use client";

import { useEffect } from "react";
import { useStore } from "@/store";
import AuthProvider, { useAuth, useAuthModal } from "@/components/AuthProvider";
import AuthModal from "@/components/AuthModal";
import UserMenu from "@/components/UserMenu";
import InstallPrompt from "@/components/InstallPrompt";
import ToastNotification from "@/components/ToastNotification";
import BottomNav from "@/components/BottomNav";

/** Inner component that has access to auth context */
function RootInner({ children }: { children: React.ReactNode }) {
  const loadProgress = useStore((s) => s.loadProgress);
  const { openAuthModal, closeAuthModal, showAuthModal } = useAuthModal();

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return (
    <>
      <div className="bg-gradient-canvas" />
      <div className="relative z-10 min-h-dvh">{children}</div>

      {/* Floating UserMenu top-right */}
      <div className="fixed top-3 right-4 z-50">
        <UserMenu onSignInClick={openAuthModal} />
      </div>

      {/* Bottom Navigation (Elevate-style) */}
      <BottomNav />

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={closeAuthModal} />

      {/* Toast Notifications */}
      <ToastNotification />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </>
  );
}

export default function RootClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RootInner>{children}</RootInner>
    </AuthProvider>
  );
}
