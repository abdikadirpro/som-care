import { useState, useEffect } from 'react';
import {
  MdTrendingUp, MdTrendingDown, MdShoppingCart, MdMedication,
  MdWarning, MdAttachMoney, MdSchedule, MdReceiptLong,
  MdPerson, MdPointOfSale,
} from 'react-icons/md';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import api from '../utils/api';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ icon: Icon, label, value, sub, trend, color = 'var(--primary)' }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ fontSize: 22, color }} />
      </div>
      {trend !== undefined && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color: trend >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {trend >= 0 ? <MdTrendingUp /> : <MdTrendingDown />} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-head)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value > 100 ? formatCurrency(p.value) : p.value}</p>
      ))}
    </div>
  );
};

// ─── Pharmacist / Cashier personal dashboard ────────────────────────────────

function PharmacistDashboard({ user }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/my-stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
      {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
    </div>
  );

  const netProfit = (stats?.today?.profit || 0) - (stats?.today?.loss || 0);

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Welcome back, {user?.firstName}!</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.role?.replace('_', ' ')} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Personal stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        <StatCard icon={MdPointOfSale}  label="My Sales Today"     value={stats?.today?.salesCount ?? 0}          sub="transactions"                       color="#10b981" />
        <StatCard icon={MdAttachMoney}  label="My Revenue Today"   value={formatCurrency(stats?.today?.revenue)}  sub="total billed"                       color="#06b6d4" />
        <StatCard icon={MdTrendingUp}   label="Today's Profit"     value={formatCurrency(stats?.today?.profit)}   sub={`Loss: ${formatCurrency(stats?.today?.loss)}`} color="#22c55e" />
        <StatCard icon={MdShoppingCart} label="This Month Sales"   value={stats?.month?.salesCount ?? 0}          sub={formatCurrency(stats?.month?.revenue)} color="#f59e0b" />
        <StatCard icon={MdReceiptLong}  label="Net Profit Today"   value={formatCurrency(netProfit)}              sub={netProfit >= 0 ? 'Profitable' : 'Loss today'} color={netProfit >= 0 ? '#10b981' : '#ef4444'} />
        <StatCard icon={MdPerson}       label="Lifetime Sales"     value={stats?.total?.salesCount ?? 0}          sub={formatCurrency(stats?.total?.revenue)} color="#8b5cf6" />
      </div>

      {/* 7-day trend */}
      {stats?.trend?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: '.25rem' }}>My Sales — Last 7 Days</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: '1.25rem' }}>Daily revenue from your transactions</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.trend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="myRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v > 0 ? `${(v / 1000).toFixed(1)}k` : 0} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#myRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sales */}
      {stats?.recentSales?.length > 0 && (
        <div className="table-container">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <MdReceiptLong style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>My Recent Transactions</h3>
            <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>{stats.recentSales.length}</span>
          </div>
          <table>
            <thead>
              <tr><th>Invoice</th><th>Items</th><th>Payment</th><th>Amount</th><th>Time</th></tr>
            </thead>
            <tbody>
              {stats.recentSales.map(sale => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: 600, fontSize: 12 }}>{sale.invoiceNo}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {sale.items.slice(0, 2).map(i => i.medicine?.name).join(', ')}
                    {sale.items.length > 2 ? ` +${sale.items.length - 2} more` : ''}
                  </td>
                  <td><span className="badge badge-muted">{sale.paymentMethod?.replace('_', ' ')}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(sale.totalAmount)}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-faint)' }}>{formatDateTime(sale.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Admin / Super-Admin full dashboard ─────────────────────────────────────

function AdminDashboard() {
  const [stats, setStats]         = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [lowStock, setLowStock]   = useState([]);
  const [expiring, setExpiring]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, h, top, ls, exp] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/daily?days=14'),
          api.get('/analytics/hourly'),
          api.get('/analytics/top-medicines?limit=5'),
          api.get('/medicines/low-stock'),
          api.get('/medicines/expiring?days=30'),
        ]);
        setStats(s.data.data);
        setDailyData(d.data.data);
        setHourlyData(h.data.data.slice(7, 21));
        setTopMedicines(top.data.data);
        setLowStock(ls.data.data?.slice(0, 6) || []);
        setExpiring(exp.data.data?.slice(0, 5) || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
      {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
    </div>
  );

  const pieData = topMedicines.slice(0, 5).map(m => ({
    name: m.medicine?.name?.split(' ').slice(0, 2).join(' ') || 'Unknown',
    value: Math.round(m.totalRevenue),
  }));

  return (
    <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard icon={MdAttachMoney}  label="Today's Revenue"   value={formatCurrency(stats?.today?.revenue)}      sub={`${stats?.today?.salesCount} sales`}              color="#10b981" />
        <StatCard icon={MdTrendingUp}   label="Today's Profit"    value={formatCurrency(stats?.today?.profit)}       sub={`Loss: ${formatCurrency(stats?.today?.loss)}`}    color="#22c55e" />
        <StatCard icon={MdShoppingCart} label="Monthly Revenue"   value={formatCurrency(stats?.month?.revenue)}      sub={`${stats?.month?.salesCount} orders`}             color="#06b6d4" />
        <StatCard icon={MdMedication}   label="Total Medicines"   value={stats?.inventory?.total?.toLocaleString()}  sub={`${stats?.inventory?.lowStock} low stock`}        color="#8b5cf6" />
        <StatCard icon={MdWarning}      label="Expiring Soon"     value={stats?.inventory?.expiringSoon || 0}        sub="within 30 days"                                   color="#ef4444" />
        <StatCard icon={MdSchedule}     label="Year Revenue"      value={formatCurrency(stats?.year?.revenue)}       sub={`${stats?.year?.salesCount} total sales`}         color="#3b82f6" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Revenue Trend (14 days)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Daily revenue and profit overview</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="profit"  name="Profit"  stroke="#06b6d4" strokeWidth={2} fill="url(#profGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: '.25rem' }}>Top Medicines</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: '1rem' }}>By revenue (30 days)</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No sales data yet</p></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {pieData.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatCurrency(m.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly */}
      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: '.25rem' }}>Today's Hourly Sales</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: '1.25rem' }}>Sales activity by hour</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={hourlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v > 0 ? `${(v / 1000).toFixed(1)}k` : 0} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Low stock + expiring */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="table-container">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <MdWarning style={{ color: 'var(--warning)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Low Stock Alert</h3>
            <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{lowStock.length}</span>
          </div>
          {lowStock.length === 0
            ? <div className="empty-state"><p>All stock levels are fine</p></div>
            : (
              <table>
                <thead><tr><th>Medicine</th><th>Stock</th><th>Min</th></tr></thead>
                <tbody>
                  {lowStock.map(m => (
                    <tr key={m.id}>
                      <td><div style={{ fontWeight: 500 }}>{m.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.category?.name}</div></td>
                      <td><span className={`badge badge-${m.stockQuantity === 0 ? 'danger' : 'warning'}`}>{m.stockQuantity}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.minimumStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>

        <div className="table-container">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <MdSchedule style={{ color: 'var(--danger)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Expiring Soon</h3>
            <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>{expiring.length}</span>
          </div>
          {expiring.length === 0
            ? <div className="empty-state"><p>No medicines expiring soon</p></div>
            : (
              <table>
                <thead><tr><th>Medicine</th><th>Expiry</th><th>Stock</th></tr></thead>
                <tbody>
                  {expiring.map(m => (
                    <tr key={m.id}>
                      <td><div style={{ fontWeight: 500 }}>{m.name}</div></td>
                      <td><span className="badge badge-danger">{formatDate(m.expiryDate)}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.stockQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      </div>
    </div>
  );
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const isStaff = user?.role === 'PHARMACIST' || user?.role === 'CASHIER';
  return isStaff ? <PharmacistDashboard user={user} /> : <AdminDashboard />;
}
