"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const path = usePathname();

  // Don't show on home page (bottom nav handles it)
  if (path === "/") return null;

  // Extract a readable title from the path
  const segments = path.split("/").filter(Boolean);
  const pageTitle = segments.length > 0
    ? segments[segments.length - 1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  return (
    <nav className="relative z-40 px-5 pt-3 pb-2 safe-area-top-only">
      <div className="flex items-center gap-3">
        <Link
          href={segments.length > 1 ? "/" + segments.slice(0, -1).join("/") : "/"}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-white transition-colors"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        {pageTitle && (
          <span className="text-[15px] font-semibold text-white">{pageTitle}</span>
        )}
      </div>
    </nav>
  );
}
