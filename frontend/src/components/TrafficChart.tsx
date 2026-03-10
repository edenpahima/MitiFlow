import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartPoint } from '../types';


interface Props {
  data: ChartPoint[] | null;
}

export function TrafficChart({ data }: Props) {
  return (
    <div style={{ background: '#1e1e2e', borderRadius: 8, padding: 20, marginBottom: 24 }}>
      <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>📊 Live Traffic</h2>
      {!data?.length ? (
        <div style={{ color: '#555', textAlign: 'center', padding: 20 }}>
          Collecting traffic data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis
              dataKey="time"
              stroke="#555"
              tick={{ fill: '#555', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#555" tick={{ fill: '#555', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 6 }}
              labelStyle={{ color: '#888' }}
            />
            <Legend wrapperStyle={{ color: '#888', fontSize: 13 }} />
            <Line
              type="monotone"
              dataKey="pps"
              name="Total PPS"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="attackPps"
              name="Attack PPS"
              stroke="#ef4444"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}