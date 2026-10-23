import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  delay?: number;
}

export default function StatCard({ icon, value, label, delay = 0 }: StatCardProps) {
  return (
    <div
      className="stat-card animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-teal">
        {icon}
      </div>
      <div className="mb-1 font-mono text-3xl font-bold tabular-nums text-slate-100" style={{ letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div className="text-[13px] font-medium text-slate-500">{label}</div>
    </div>
  );
}
