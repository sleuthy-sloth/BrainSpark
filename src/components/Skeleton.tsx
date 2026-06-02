"use client";

interface SkeletonProps {
  variant?: "card" | "text" | "chart";
  lines?: number;
  className?: string;
}

export default function Skeleton({
  variant = "card",
  lines = 3,
  className = "",
}: SkeletonProps) {
  if (variant === "card") {
    return (
      <div
        className={`glass-card-static p-5 ${className}`}
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-card-hover)] animate-pulse shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-[var(--bg-card-hover)] rounded animate-pulse w-3/4" />
            <div className="h-3 bg-[var(--bg-card-hover)] rounded animate-pulse w-1/2" />
            <div className="h-3 bg-[var(--bg-card-hover)] rounded animate-pulse w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div
        className={`glass-card-static p-5 ${className}`}
        aria-busy="true"
        aria-label="Loading chart"
      >
        {/* Simulated bar chart skeleton */}
        <div className="space-y-1">
          <div className="h-3 bg-[var(--bg-card-hover)] rounded animate-pulse w-1/3 mb-4" />
          <div className="flex items-end gap-2 h-28">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[var(--bg-card-hover)] animate-pulse"
                style={{ height: `${40 + Math.random() * 60}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-2 bg-[var(--bg-card-hover)] rounded animate-pulse"
                style={{ width: `${30 + Math.random() * 20}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Text variant
  return (
    <div
      className={`space-y-2 ${className}`}
      aria-busy="true"
      aria-label="Loading text"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-[var(--bg-card-hover)] rounded animate-pulse"
          style={{ width: `${60 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  );
}
