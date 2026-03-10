import { usePolling } from './hooks/useApi';
import { StatCards } from './components/StatCards';
import { AttackList } from './components/AttackList';
import { MitigationRules } from './components/MitigationRules';
import { SimulatePanel } from './components/SimulatePanel';
import { BgpLog } from './components/BgpLog';
import type { AttackEvent, MitigationRule, BgpLogEntry, Stats } from './types';

export default function App() {
  const { data: stats, refetch: refetchStats } = usePolling<Stats>('/api/attacks/stats');
  const { data: attacks, refetch: refetchAttacks } = usePolling<AttackEvent[]>('/api/attacks?status=active');
  const { data: rules, refetch: refetchRules } = usePolling<MitigationRule[]>('/api/mitigate?status=active');
  const { data: bgpLog } = usePolling<BgpLogEntry[]>('/api/mitigate/bgp-log');

  const refetchAll = () => {
    void refetchStats();
    void refetchAttacks();
    void refetchRules();
  };

  return (
<div style={{ background: '#12121f', minHeight: '100vh', padding: '24px 16px',fontFamily: 'sans-serif',boxSizing: 'border-box' as const,}}>
  <div style={{ maxWidth: 1100, margin: '0 auto',width: '100%',}}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: '#fff', fontSize: 24, margin: 0 }}>🛡️ MitiFlow</h1>
          <p style={{ color: '#555', margin: '4px 0 0' }}>DDoS Detection & Mitigation Control Plane</p>
        </div>

        <StatCards stats={stats} />
        <SimulatePanel />
        <AttackList attacks={attacks} />
        <MitigationRules rules={rules} onWithdraw={refetchAll} />
        <BgpLog log={bgpLog} />
      </div>
    </div>
  );
}