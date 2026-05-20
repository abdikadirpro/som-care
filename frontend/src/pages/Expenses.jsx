import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdAttachMoney } from 'react-icons/md';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const CATEGORIES = ['Rent', 'Utilities', 'Salary', 'Supplies', 'Maintenance', 'Marketing', 'Transport', 'Other'];
const EMPTY = { title: '', amount: '', category: '', note: '', expenseDate: new Date().toISOString().slice(0, 10) };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [filters, setFilters] = useState({ startDate: '', endDate: '', category: '' });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/expenses', { params: { page, limit: 20, ...filters } });
      setExpenses(data.data || []);
      setPagination(data.pagination || {});
      setTotal(data.data?.reduce((s, e) => s + parseFloat(e.amount), 0) || 0);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  const openNew = () => { setEditItem(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (e) => { setEditItem(e); setForm({ title: e.title, amount: e.amount, category: e.category || '', note: e.note || '', expenseDate: e.expenseDate.slice(0, 10) }); setShowModal(true); };

  const handleSave = async (ev) => {
    ev.preventDefault();
    if (!form.title || !form.amount || !form.expenseDate) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      if (editItem) { await api.put(`/expenses/${editItem.id}`, form); toast.success('Updated'); }
      else { await api.post('/expenses', form); toast.success('Expense added'); }
      setShowModal(false); load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete expense?')) return;
    try { await api.delete(`/expenses/${id}`); toast.success('Deleted'); load(pagination.page); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div><h1 className="page-title">Expenses</h1><p className="page-subtitle">Track operational expenses</p></div>
        <button onClick={openNew} className="btn btn-primary"><MdAdd /> Add Expense</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: '.875rem', flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Showing Total</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)', fontFamily: 'var(--font-head)' }}>{formatCurrency(total)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 160 }} value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="input" type="date" style={{ width: 145 }} value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
        <input className="input" type="date" style={{ width: 145 }} value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Note</th><th>By</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array(8).fill(0).map((_, i) => <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td></tr>)
              : expenses.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><MdAttachMoney style={{ fontSize: 36 }} /><h3>No expenses found</h3></div></td></tr>
              : expenses.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{e.title}</td>
                <td><span className="badge badge-muted">{e.category || '—'}</span></td>
                <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(e.amount)}</td>
                <td style={{ fontSize: 12 }}>{formatDate(e.expenseDate)}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note || '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.creator ? `${e.creator.firstName} ${e.creator.lastName}` : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(e)} className="btn btn-ghost btn-icon btn-sm"><MdEdit /></button>
                    <button onClick={() => handleDelete(e.id)} className="btn btn-danger btn-icon btn-sm"><MdDelete /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>{pagination.total} expenses</span>
          <div className="pagination-controls">
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => load(p)} className={`page-btn ${p === pagination.page ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editItem ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group form-full"><label className="input-label">Title *</label><input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
                  <div className="input-group"><label className="input-label">Amount (ETB) *</label><input className="input" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required /></div>
                  <div className="input-group"><label className="input-label">Date *</label><input className="input" type="date" value={form.expenseDate} onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))} required /></div>
                  <div className="input-group"><label className="input-label">Category</label>
                    <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      <option value="">Select Category</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="input-group form-full"><label className="input-label">Note</label><textarea className="input" rows={2} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Optional note..." /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : editItem ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
