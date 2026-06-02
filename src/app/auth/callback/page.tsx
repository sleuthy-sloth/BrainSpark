"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Client-side page that handles the OAuth and magic link callback.
 *
 * Supabase redirects here after successful Google OAuth or magic link
 * sign-in. We exchange the auth code for a session client-side, then
 * redirect to the home page.
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"exchanging" | "done" | "error">("exchanging");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      // No code — maybe direct access or error
      setStatus("error");
      setTimeout(() => router.replace("/"), 2000);
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error("Auth callback error:", error.message);
        setStatus("error");
        setTimeout(() => router.replace("/"), 2000);
      } else {
        setStatus("done");
        // Redirect to home with welcome flag
        router.replace("/?welcome=true");
      }
    });
  }, [searchParams, router]);

  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="glass-card-static p-6 text-center animate-fade-in">
        {status === "exchanging" && (
          <>
            <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-text-secondary text-sm">Signing you in...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-[var(--accent-rose)] text-sm font-medium">
              Sign-in failed
            </p>
            <p className="text-text-muted text-xs mt-1">Redirecting...</p>
          </>
        )}
      </div>
    </main>
  );
}

// Need a separate default export with Suspense for useSearchParams
import { Suspense } from "react";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <CallbackContent />
    </Suspense>
  );
}
