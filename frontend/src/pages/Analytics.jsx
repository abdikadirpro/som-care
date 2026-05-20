import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend,
} from 'recharts';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>{p.name}: {p.value > 100 ? formatCurrency(p.value) : p.value}</p>)}
    </div>
  );
};

export default function Analytics() {
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [topMeds, setTopMeds] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [d, m, h, top, pl] = await Promise.all([
          api.get(`/analytics/daily?days=${period}`),
          api.get(`/analytics/monthly?year=${year}`),
          api.get('/analytics/hourly'),
          api.get('/analytics/top-medicines?limit=10'),
          api.get('/analytics/profit-loss'),
        ]);
        setDaily(d.data.data);
        setMonthly(m.data.data);
        setHourly(h.data.data);
        setTopMeds(top.data.data);
        setProfitLoss(pl.data.data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [period, year]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 14 }} />)}
    </div>
  );

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Comprehensive sales and profit analysis</p></div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <select className="input" style={{ width: 130 }} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <select className="input" style={{ width: 100 }} value={year} onChange={e => setYear(e.target.value)}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* P&L Summary */}
      {profitLoss && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '.75rem' }}>
          {[
            { label: 'Total Revenue', val: formatCurrency(profitLoss.totalRevenue), color: '#10b981' },
            { label: 'Total Discount', val: formatCurrency(profitLoss.totalDiscount), color: '#f59e0b' },
            { label: 'Cost of Goods', val: formatCurrency(profitLoss.totalCost), color: '#6b7280' },
            { label: 'Gross Profit', val: formatCurrency(profitLoss.grossProfit), color: '#22c55e' },
            { label: 'Total Loss', val: formatCurrency(profitLoss.totalLoss), color: '#ef4444' },
            { label: 'Total Expenses', val: formatCurrency(profitLoss.totalExpenses), color: '#f97316' },
            { label: 'Net Income', val: formatCurrency(profitLoss.netIncome), color: profitLoss.netIncome >= 0 ? '#22c55e' : '#ef4444' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '.875rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: s.color, fontFamily: 'var(--font-head)' }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Daily Revenue & Profit */}
      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: '.25rem' }}>Daily Revenue & Profit</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Last {period} days breakdown</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={daily} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revGr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profGr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}k` : 0} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGr)" />
            <Area type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2} fill="url(#profGr)" />
            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} fill="url(#expGr)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Monthly */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: '1.25rem' }}>Monthly Revenue {year}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: '1.25rem' }}>Today's Hourly Sales</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hourly} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}k` : 0} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="count" name="Sales" stroke="#06b6d4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Medicines */}
      <div className="table-container">
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Top Selling Medicines</h3>
        </div>
        <table>
          <thead><tr><th>#</th><th>Medicine</th><th>Qty Sold</th><th>Revenue</th><th>Profit</th><th>Sales Count</th></tr></thead>
          <tbody>
            {topMeds.map((m, i) => (
              <tr key={i}>
                <td><span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{i + 1}</span></td>
                <td><div style={{ fontWeight: 500 }}>{m.medicine?.name}</div></td>
                <td style={{ fontWeight: 600 }}>{Math.round(m.totalQuantity)}</td>
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(m.totalRevenue)}</td>
                <td style={{ color: 'var(--success)' }}>{formatCurrency(m.totalProfit)}</td>
                <td style={{ color: 'var(--text-muted)' }}>{m.salesCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
