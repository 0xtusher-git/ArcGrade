interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  delay?: number;
  color?: string;
}

export default function StatCard({ icon, value, label, delay = 0, color = '#4a9aba' }: StatCardProps) {
  return (
    <div
      className="stat-card animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
        style={{ background: `${color}22`, border: `1px solid ${color}44` }}
      >
        {icon}
      </div>
      <div className="text-3xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div className="text-sm text-white/50 font-medium">{label}</div>
    </div>
  );
}
