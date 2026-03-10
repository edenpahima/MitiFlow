import type { BgpLogEntry } from '../types';

interface Props {
  log: BgpLogEntry[] | null;
}

export function BgpLog({ log }: Props) {
  const reversed = log ? [...log].reverse() : [];

  return (
    <div style={{ background: '#1e1e2e', borderRadius: 8, padding: 20 }}>
      <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>📡 Mock BGP Log</h2>
      <div style={{ fontFamily: 'monospace', fontSize: 13, maxHeight: 200, overflowY: 'auto' }}>
        {!reversed.length ? (
          <div style={{ color: '#555' }}>No BGP activity yet</div>
        ) : (
          reversed.map((entry, i) => (
            <div key={i} style={{ marginBottom: 6, color: entry.action === 'PUSH' ? '#22c55e' : '#ef4444' }}>
              <span style={{ color: '#555', marginRight: 8 }}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ marginRight: 8 }}>[{entry.action}]</span>
              <span style={{ color: '#ccc' }}>{entry.rule}</span>
              <span style={{ color: '#555', marginLeft: 8 }}>→ {entry.router}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}