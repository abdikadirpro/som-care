import { useState, useEffect, useCallback } from 'react';
import { MdInventory2, MdSearch, MdWarning, MdTrendingDown, MdTrendingUp } from 'react-icons/md';
import api from '../utils/api';
import { formatDateTime } from '../utils/formatters';

const TYPE_COLORS = { PURCHASE: 'badge-success', SALE: 'badge-primary', RETURN: 'badge-info', DAMAGE: 'badge-danger', ADJUSTMENT: 'badge-warning', EXPIRED: 'badge-danger', TRANSFER: 'badge-muted' };

export default function Inventory() {
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, pages: 1 });
  const [filters, setFilters] = useState({ movementType: '', startDate: '', endDate: '' });
  const [search, setSearch] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 30, ...filters };
      const { data } = await api.get('/inventory/movements', { params });
      setMovements(data.data || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    api.get('/inventory/summary').then(r => setSummary(r.data.data)).catch(() => {});
  }, []);

  return (
    <div className="slide-up">
      <div className="page-header">
        <div><h1 className="page-title">Inventory</h1><p className="page-subtitle">Stock movements and tracking</p></div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Medicines', val: summary.total, color: '#10b981' },
            { label: 'Low Stock', val: summary.lowStock, color: '#f59e0b', icon: '⚠' },
            { label: 'Out of Stock', val: summary.outOfStock, color: '#ef4444' },
            { label: 'Expiring Soon', val: summary.expiringSoon, color: '#f97316' },
            { label: 'Expired', val: summary.expired, color: '#ef4444' },
            { label: 'Total Units', val: summary.totalUnitsInStock?.toLocaleString(), color: '#06b6d4' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '.875rem' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--font-head)' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 160 }} value={filters.movementType} onChange={e => setFilters(p => ({ ...p, movementType: e.target.value }))}>
          <option value="">All Movements</option>
          {['PURCHASE','SALE','RETURN','DAMAGE','ADJUSTMENT','EXPIRED','TRANSFER'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="input" type="date" style={{ width: 145 }} value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
        <input className="input" type="date" style={{ width: 145 }} value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Medicine</th><th>Type</th><th>Quantity</th><th>Prev Stock</th><th>New Stock</th><th>Note</th><th>By</th><th>Time</th></tr></thead>
          <tbody>
            {loading ? Array(10).fill(0).map((_, i) => <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td></tr>)
              : movements.length === 0 ? <tr><td colSpan={8}><div className="empty-state"><MdInventory2 style={{ fontSize: 36 }} /><h3>No movements found</h3></div></td></tr>
              : movements.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{m.medicine?.name}</div>
                </td>
                <td><span className={`badge ${TYPE_COLORS[m.movementType] || 'badge-muted'}`}>{m.movementType}</span></td>
                <td>
                  <span style={{ color: ['PURCHASE','RETURN','ADJUSTMENT'].includes(m.movementType) ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {['PURCHASE','RETURN','ADJUSTMENT'].includes(m.movementType) ? '+' : '-'}{m.quantity}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{m.previousStock}</td>
                <td style={{ fontWeight: 600 }}>{m.newStock}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.note || '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.user ? `${m.user.firstName} ${m.user.lastName}` : '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(m.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>{pagination.total} movements</span>
          <div className="pagination-controls">
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => load(p)} className={`page-btn ${p === pagination.page ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
