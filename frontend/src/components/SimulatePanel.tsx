import { useState } from 'react';
import axios from 'axios';

export function SimulatePanel() {
  const [victimIp, setVictimIp] = useState('10.0.0.5');
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('high');
  const [loading, setLoading] = useState(false);

  const trigger = async (type: string) => {
    setLoading(true);
    await axios.post(`/api/simulate/${type}`, { victimIp, intensity, amplificationFactor: 50 });
    setLoading(false);
  };

  const stop = async () => {
    setLoading(true);
    await axios.post('/api/simulate/stop');
    setLoading(false);
  };

  const inputStyle = {
    background: '#2a2a3e', border: '1px solid #444', borderRadius: 4,
    color: '#fff', padding: '6px 10px', fontSize: 14
  };

  const btnStyle = (color: string) => ({
    background: color + '22', color, border: `1px solid ${color}`,
    borderRadius: 4, padding: '8px 16px', cursor: 'pointer',
    fontSize: 13, fontWeight: 600, opacity: loading ? 0.5 : 1
  });

  return (
    <div style={{ background: '#1e1e2e', borderRadius: 8, padding: 20, marginBottom: 24 }}>
      <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>🧪 Attack Simulator</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={victimIp}
          onChange={e => setVictimIp(e.target.value)}
          placeholder="Victim IP"
          style={inputStyle}
        />
        <select
          value={intensity}
          onChange={e => setIntensity(e.target.value as 'low' | 'medium' | 'high')}
          style={inputStyle}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button disabled={loading} onClick={() => void trigger('syn-flood')} style={btnStyle('#ef4444')}>
          SYN Flood
        </button>
        <button disabled={loading} onClick={() => void trigger('udp-amplification')} style={btnStyle('#f97316')}>
          UDP Amplification
        </button>
        <button disabled={loading} onClick={() => void trigger('icmp-flood')} style={btnStyle('#eab308')}>
          ICMP Flood
        </button>
        <button disabled={loading} onClick={() => void stop()} style={btnStyle('#22c55e')}>
          ⏹ Stop
        </button>
      </div>
    </div>
  );
}