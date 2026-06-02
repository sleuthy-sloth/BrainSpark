"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const path = usePathname();

  if (path === "/") return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-3 pb-2 safe-area-top">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <Link
          href="/"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center btn-ghost text-sm"
          aria-label="Back to home"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <Link href="/stats" className="btn btn-sm btn-ghost ml-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Stats
        </Link>
      </div>
    </nav>
  );
}
