"use client";

import type { TrendInfo } from "@/lib/statsEngine";

interface Props {
  trend: TrendInfo;
  /** Color for the sparkline stroke */
  color: string;
}

export default function TrendSparkline({ trend, color }: Props) {
  const { points, direction, directionPct } = trend;

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-14 text-[10px] text-text-muted text-center px-1">
        Play more to see trend
      </div>
    );
  }

  const width = 120;
  const height = 48;
  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const scores = points.map((p) => p.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = Math.max(maxScore - minScore, 1);

  const pathD = points
    .map((p, i) => {
      const x = padding + (i / Math.max(points.length - 1, 1)) * chartW;
      const y = padding + chartH - ((p.score - minScore) / range) * chartH;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const areaD = pathD + ` L${padding + chartW},${padding + chartH} L${padding},${padding + chartH} Z`;

  const arrowIcon =
    direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  const arrowColor =
    direction === "up"
      ? "var(--accent-green)"
      : direction === "down"
      ? "var(--accent-rose)"
      : "var(--text-muted)";

  return (
    <div className="flex items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="shrink-0"
      >
        {/* Area fill */}
        <path d={areaD} fill={`${color}15`} />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Start dot */}
        <circle
          cx={padding}
          cy={padding + chartH - ((scores[0] - minScore) / range) * chartH}
          r={2}
          fill={color}
        />
        {/* End dot */}
        <circle
          cx={padding + chartW}
          cy={padding + chartH - ((scores[scores.length - 1] - minScore) / range) * chartH}
          r={2}
          fill={color}
        />
      </svg>
      <span
        className="text-sm font-bold shrink-0"
        style={{ color: arrowColor }}
      >
        {arrowIcon} {directionPct > 0 ? "+" : ""}{directionPct}%
      </span>
    </div>
  );
}
