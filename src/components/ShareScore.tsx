"use client";

import { useState } from "react";

interface Props {
  /** YYYY-MM-DD formatted date */
  dateStr: string;
  totalScore: number;
  streak: number;
  appUrl?: string;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ShareScore({
  dateStr,
  totalScore,
  streak,
  appUrl = "neuralpulse.app",
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = [
    `🧠 NeuralPulse`,
    `📅 ${formatDisplayDate(dateStr)}`,
    ``,
    `Daily Challenge: ${totalScore} pts`,
    streak > 0 ? `🔥 Streak: ${streak} day${streak !== 1 ? "s" : ""}` : null,
    ``,
    appUrl,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="glass-card-static p-4">
      <div className="bg-[var(--bg-secondary)] rounded-xl p-3 mb-3 font-mono text-xs leading-relaxed whitespace-pre-line text-text-secondary">
        {shareText}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="btn btn-md flex-1 btn-primary"
        >
          {typeof navigator.share === "function" ? "📤 Share" : "📋 Copy"}
        </button>
        <button
          onClick={handleCopy}
          className="btn btn-md btn-ghost"
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>
    </div>
  );
}
