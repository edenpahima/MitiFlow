import type { Stats } from '../types';

interface Props {
  stats: Stats | null;
}

export function StatCards({ stats }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
      <Card title="Active Attacks" value={stats?.activeAttacks ?? 0} color="#ef4444" />
      <Card title="Total Today" value={stats?.totalAttacksToday ?? 0} color="#f97316" />
      <Card title="Mitigated Today" value={stats?.mitigatedToday ?? 0} color="#22c55e" />
    </div>
  );
}

function Card({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div style={{
      background: '#1e1e2e', borderRadius: 8, padding: 20,
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{title}</div>
      <div style={{ color, fontSize: 36, fontWeight: 700 }}>{value}</div>
    </div>
  );
}