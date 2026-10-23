'use client';
import { useEffect, useRef, useState } from 'react';
import { getScoreColor } from '@/lib/scoring';

interface ScoreRingProps {
  score: number;
  size?: number;
  animate?: boolean;
}

export default function ScoreRing({ score, size = 200, animate = true }: ScoreRingProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const [ringFill, setRingFill] = useState(0);
  const hasAnimated = useRef(false);

  const radius = (size / 2) - 18;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);

  useEffect(() => {
    if (!animate || hasAnimated.current) return;
    hasAnimated.current = true;

    // Animate counter
    let start: number | null = null;
    const duration = 1400;
    const step = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - prog, 3); // ease-out cubic
      setDisplayed(Math.floor(eased * score));
      setRingFill(eased * score);
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score, animate]);

  const strokeDashoffset = circumference - (ringFill / 100) * circumference;

  const label =
    score >= 70 ? 'Trusted' :
    score >= 40 ? 'Neutral' :
    score >= 10 ? 'Suspicious' : 'Unknown';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={10}
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold leading-none tabular-nums"
          style={{ fontSize: size * 0.28, color }}
        >
          {displayed}
        </span>
        <span className="mt-1 font-mono font-medium text-slate-500" style={{ fontSize: size * 0.09 }}>
          / 100
        </span>
        <span
          className="mt-2 rounded-full px-3 py-0.5 font-semibold"
          style={{
            fontSize: size * 0.08,
            background: `${color}1a`,
            color,
            border: `1px solid ${color}33`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
