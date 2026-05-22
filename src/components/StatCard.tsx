import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
}

const trendSymbol = { up: '↑', down: '↓', flat: '→' };
const trendColor = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  flat: 'text-muted',
};

export function StatCard({ label, value, hint, trend }: StatCardProps) {
  return (
    <Card padded={false} className="p-4">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <span className={`${trendColor[trend]} text-lg leading-none`}>
            {trendSymbol[trend]}
          </span>
        )}
      </div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </Card>
  );
}
