import { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdShoppingCart, MdUndo, MdClose, MdReceipt } from 'react-icons/md';
import api from '../utils/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useConfirm } from '../context/ConfirmContext';

const STATUS_COLORS = { COMPLETED: 'badge-success', CANCELLED: 'badge-danger', RETURNED: 'badge-warning' };
const PAY_COLORS = { PAID: 'badge-success', PARTIAL: 'badge-warning', PENDING: 'badge-danger' };

export default function Sales() {
  const { confirm } = useConfirm();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', paymentMethod: '', startDate: '', endDate: '' });
  const [selected, setSelected] = useState(null);
  const [todaySummary, setTodaySummary] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      if (search) params.search = search;
      const { data } = await api.get('/sales', { params });
      setSales(data.data || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api.get('/sales/today-summary').then(r => setTodaySummary(r.data.data)).catch(() => {});
  }, []);

  const handleReturn = async (id) => {
    const ok = await confirm({
      title: 'Return This Sale?',
      message: 'Stock will be restored and the sale will be marked as returned. This cannot be undone.',
      confirmText: 'Return Sale',
      type: 'return',
    });
    if (!ok) return;
    try {
      await api.post(`/sales/${id}/return`);
      toast.success('Sale returned'); load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Return failed'); }
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div><h1 className="page-title">Sales History</h1><p className="page-subtitle">All transactions and orders</p></div>
      </div>

      {/* Today Summary */}
      {todaySummary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: "Today's Revenue", val: formatCurrency(todaySummary.totalRevenue), color: '#10b981' },
            { label: "Today's Profit", val: formatCurrency(todaySummary.totalProfit), color: '#22c55e' },
            { label: "Today's Sales", val: todaySummary.salesCount, color: '#06b6d4' },
            { label: "Today's Expenses", val: formatCurrency(todaySummary.totalExpenses), color: '#f59e0b' },
            { label: 'Net Income', val: formatCurrency(todaySummary.netIncome), color: todaySummary.netIncome >= 0 ? '#22c55e' : '#ef4444' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '.875rem' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'var(--font-head)' }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
          <MdSearch className="search-icon" style={{ fontSize: 17 }} />
          <input className="input" placeholder="Search invoice number..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input" style={{ width: 130 }} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="RETURNED">Returned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select className="input" style={{ width: 130 }} value={filters.paymentMethod} onChange={e => setFilters(p => ({ ...p, paymentMethod: e.target.value }))}>
          <option value="">All Payments</option>
          {['CASH','TELEBIRR','EVC_PLUS','ZAAD','CBE_BIRR','BANK','CARD'].map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
        </select>
        <input className="input" type="date" style={{ width: 145 }} value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
        <input className="input" type="date" style={{ width: 145 }} value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Total</th><th>Paid</th><th>Method</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array(10).fill(0).map((_, i) => <tr key={i}><td colSpan={9}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td></tr>)
              : sales.length === 0 ? <tr><td colSpan={9}><div className="empty-state"><MdShoppingCart style={{ fontSize: 36 }} /><h3>No sales found</h3></div></td></tr>
              : sales.map(s => (
              <tr key={s.id} style={{ cursor: 'pointer' }}>
                <td><div style={{ fontWeight: 600, fontSize: 12, color: 'var(--primary)', fontFamily: 'monospace' }}>{s.invoiceNo}</div></td>
                <td style={{ fontSize: 12 }}>{s.customer ? `${s.customer.firstName || ''} ${s.customer.lastName || ''}`.trim() || s.customer.phone : <span style={{ color: 'var(--text-faint)' }}>Walk-in</span>}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.items?.length || 0} items</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(s.totalAmount)}</td>
                <td style={{ fontSize: 12 }}>{formatCurrency(s.paidAmount)}</td>
                <td><span className="badge badge-info">{s.paymentMethod.replace('_',' ')}</span></td>
                <td><span className={`badge ${STATUS_COLORS[s.status] || 'badge-muted'}`}>{s.status}</span></td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(s.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setSelected(s)} className="btn btn-ghost btn-icon btn-sm" title="View"><MdReceipt /></button>
                    {s.status === 'COMPLETED' && <button onClick={() => handleReturn(s.id)} className="btn btn-danger btn-icon btn-sm" title="Return"><MdUndo /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>{pagination.total} total sales</span>
          <div className="pagination-controls">
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => load(p)} className={`page-btn ${p === pagination.page ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 15 }}>Sale Details</h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selected.invoiceNo}</div>
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: '1rem' }}>
                {[
                  ['Customer', selected.customer ? `${selected.customer.firstName || ''} ${selected.customer.lastName || ''}` : 'Walk-in Customer'],
                  ['Cashier', `${selected.cashier?.firstName} ${selected.cashier?.lastName}`],
                  ['Payment', selected.paymentMethod.replace('_',' ')],
                  ['Date', formatDateTime(selected.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.items?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem .75rem', background: 'var(--surface-light)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.medicine?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.quantity} × {formatCurrency(item.sellingPrice)} ({item.sellingUnit})</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</div>
                      <div style={{ fontSize: 10, color: parseFloat(item.profit) > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {parseFloat(item.profit) > 0 ? '+' : ''}{formatCurrency(parseFloat(item.profit) - parseFloat(item.loss))} profit
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  ['Subtotal', formatCurrency(selected.subtotal)],
                  parseFloat(selected.discountAmount) > 0 ? ['Discount', `-${formatCurrency(selected.discountAmount)}`] : null,
                  parseFloat(selected.taxAmount) > 0 ? ['Tax', formatCurrency(selected.taxAmount)] : null,
                  ['Total', formatCurrency(selected.totalAmount)],
                  ['Paid', formatCurrency(selected.paidAmount)],
                  ['Change', formatCurrency(selected.changeAmount)],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: k === 'Total' ? 700 : 400 }}>
                    <span style={{ color: k === 'Total' ? 'var(--text)' : 'var(--text-muted)' }}>{k}</span>
                    <span style={{ color: k === 'Total' ? 'var(--primary)' : 'var(--text)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
