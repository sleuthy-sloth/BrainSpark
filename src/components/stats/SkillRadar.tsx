"use client";

import { useMemo } from "react";
import type { SkillScore } from "@/lib/statsEngine";

interface Props {
  skills: SkillScore[];
}

export default function SkillRadar({ skills }: Props) {
  const numAxes = skills.length;
  const cx = 120;
  const cy = 120;
  const radius = 90;
  const strokeColor = "rgba(255,255,255,0.08)";
  const fillColor = "rgba(74,158,255,0.15)";
  const lineColor = "var(--accent-blue)";
  const dotColor = "var(--accent-blue)";

  // Grid rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const points = useMemo(() => {
    return skills.map((skill, i) => {
      const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
      const value = skill.score / 100;
      return {
        x: cx + radius * value * Math.cos(angle),
        y: cy + radius * value * Math.sin(angle),
      };
    });
  }, [skills]);

  const polygonPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 240 240"
        className="w-full max-w-[260px] h-auto"
        role="img"
        aria-label="Skill radar chart"
      >
        {/* Grid rings */}
        {rings.map((ring) => {
          const r = radius * ring;
          const ringPath = Array.from({ length: numAxes })
            .map((_, i) => {
              const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
              const x = cx + r * Math.cos(angle);
              const y = cy + r * Math.sin(angle);
              return `${i === 0 ? "M" : "L"}${x},${y}`;
            })
            .join(" ") + "Z";
          return (
            <path
              key={ring}
              d={ringPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={1}
            />
          );
        })}

        {/* Axis lines */}
        {skills.map((skill, i) => {
          const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          return (
            <line
              key={skill.skill}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={strokeColor}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <path
          d={polygonPath}
          fill={fillColor}
          stroke={lineColor}
          strokeWidth={2}
          className="transition-all duration-500"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={dotColor}
            stroke="white"
            strokeWidth={1}
          />
        ))}

        {/* Axis labels */}
        {skills.map((skill, i) => {
          const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
          const labelR = radius + 22;
          const x = cx + labelR * Math.cos(angle);
          const y = cy + labelR * Math.sin(angle);
          return (
            <text
              key={skill.skill}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={skill.color}
              fontSize="10"
              fontFamily="inherit"
              fontWeight={600}
            >
              {skill.skill}
            </text>
          );
        })}
      </svg>

      {/* Legend / score breakdown */}
      <div className="grid grid-cols-5 gap-2 mt-4 w-full max-w-xs">
        {skills.map((s) => (
          <div key={s.skill} className="text-center">
            <p
              className="text-lg font-extrabold"
              style={{ color: s.color }}
            >
              {s.score}
            </p>
            <p className="text-[9px] text-text-muted uppercase tracking-wider">
              {s.skill}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
