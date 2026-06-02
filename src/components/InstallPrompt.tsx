"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISS_KEY = "np_install_dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on mobile (check once)
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if already dismissed this week
    try {
      const dismissed = localStorage.getItem(INSTALL_DISMISS_KEY);
      if (dismissed) {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (parseInt(dismissed) > weekAgo) return;
      }
    } catch {}

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also check if already installed (for standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      // Already installed — don't show prompt
      return;
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  if (!show) return null;

  return (
    <div className="install-prompt">
      <div className="mx-4 max-w-lg mx-auto glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-violet)] flex items-center justify-center text-lg font-bold text-white shrink-0">
          N
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">Install NeuralPulse</p>
          <p className="text-xs text-text-muted">Play offline, track progress</p>
        </div>
        <button
          onClick={handleInstall}
          className="btn btn-sm btn-primary shrink-0"
        >
          Install App
        </button>
        <button
          onClick={handleDismiss}
          className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-primary shrink-0"
          aria-label="Dismiss install prompt"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
