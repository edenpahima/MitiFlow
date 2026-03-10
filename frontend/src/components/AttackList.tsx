import type { AttackEvent } from '../types';

interface Props {
  attacks: AttackEvent[] | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#9333ea',
};

export function AttackList({ attacks }: Props) {
  return (
    <div style={{ background: '#1e1e2e', borderRadius: 8, padding: 20, marginBottom: 24 }}>
      <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>⚠️ Active Attacks</h2>
      {!attacks?.length ? (
        <div style={{ color: '#555', textAlign: 'center', padding: 20 }}>No active attacks</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              {['Victim IP', 'Type', 'Severity', 'PPS', 'BPS', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attacks.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #2a2a3e' }}>
                <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>{a.victimIp}</td>
                <td style={{ padding: '10px 12px' }}>{a.attackType}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: SEVERITY_COLORS[a.severity] + '22',
                    color: SEVERITY_COLORS[a.severity],
                    padding: '2px 10px', borderRadius: 12, fontSize: 12
                  }}>
                    {a.severity}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>{Math.round(a.pps)}</td>
                <td style={{ padding: '10px 12px' }}>{(a.bps / 1_000_000).toFixed(2)} Mbps</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: a.status === 'active' ? '#ef4444' : '#22c55e' }}>
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}