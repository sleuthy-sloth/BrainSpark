"use client";

import { useStore, type ToastType } from "@/store";

const TOAST_ICONS: Record<ToastType, string> = {
  success: "✅",
  error: "⚠️",
  info: "ℹ️",
  streak: "🔥",
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: "var(--accent-green)",
  error: "var(--accent-rose)",
  info: "var(--accent-blue)",
  streak: "var(--accent-amber)",
};

export default function ToastNotification() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-[70] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-slide-down cursor-pointer"
          onClick={() => removeToast(toast.id)}
        >
          <div
            className="glass-card-static px-4 py-3 flex items-center gap-2.5 max-w-sm mx-2 shadow-lg shadow-black/30"
            style={{ borderLeft: `3px solid ${TOAST_COLORS[toast.type]}` }}
          >
            <span className="text-lg shrink-0">
              {TOAST_ICONS[toast.type]}
            </span>
            <p className="text-sm font-medium text-text-primary leading-snug">
              {toast.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
