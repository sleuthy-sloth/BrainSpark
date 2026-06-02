"use client";

import { useState, useEffect } from "react";

/**
 * Live countdown timer showing time until midnight UTC.
 * Updates every 60 seconds.
 */
export default function DailyCountdown() {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const tomorrow = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
      );
      const ms = tomorrow.getTime() - now.getTime();
      if (ms <= 0) {
        setDisplay("Now!");
        return;
      }
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);

      if (hours > 0) {
        setDisplay(`Next challenge in ${hours}h ${minutes}m`);
      } else {
        setDisplay(`Next challenge in ${minutes}m`);
      }
    }

    update();
    const interval = setInterval(update, 60000); // every 60s
    return () => clearInterval(interval);
  }, []);

  if (!display) return null;

  return (
    <p className="text-xs text-text-muted">{display}</p>
  );
}
