import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdLocalShipping, MdShoppingBag } from 'react-icons/md';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';

const EMPTY_SUP = { name: '', contactPerson: '', phone: '', email: '', address: '', city: '' };

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_SUP);
  const [saving, setSaving] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSupplier, setPurchaseSupplier] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([{ medicineId: '', quantity: 1, purchasePrice: '', expiryDate: '', batchNumber: '' }]);
  const [paidAmount, setPaidAmount] = useState('');
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [showPurchases, setShowPurchases] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await api.get('/suppliers', { params });
      setSuppliers(data.data || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api.get('/medicines?limit=200&isActive=true').then(r => setMedicines(r.data.data || [])).catch(() => {});
  }, []);

  const openNew = () => { setEditItem(null); setForm(EMPTY_SUP); setShowModal(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ name: s.name, contactPerson: s.contactPerson || '', phone: s.phone || '', email: s.email || '', address: s.address || '', city: s.city || '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Supplier name required'); return; }
    setSaving(true);
    try {
      if (editItem) { await api.put(`/suppliers/${editItem.id}`, form); toast.success('Supplier updated'); }
      else { await api.post('/suppliers', form); toast.success('Supplier added'); }
      setShowModal(false); load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Supplier?',
      message: 'Suppliers with linked medicines or purchase history cannot be deleted.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!ok) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Deleted'); load(pagination.page); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const openPurchase = (s) => { setPurchaseSupplier(s); setPurchaseItems([{ medicineId: '', quantity: 1, purchasePrice: '', expiryDate: '', batchNumber: '' }]); setPaidAmount(''); setShowPurchaseModal(true); };

  const totalPurchase = purchaseItems.reduce((s, i) => s + (parseFloat(i.purchasePrice || 0) * parseInt(i.quantity || 0)), 0);

  const handlePurchaseSave = async () => {
    const validItems = purchaseItems.filter(i => i.medicineId && i.quantity > 0 && i.purchasePrice > 0);
    if (validItems.length === 0) { toast.error('Add at least one valid item'); return; }
    setSavingPurchase(true);
    try {
      await api.post('/suppliers/purchases/create', { supplierId: purchaseSupplier.id, items: validItems, paidAmount: parseFloat(paidAmount || 0) });
      toast.success('Purchase created'); setShowPurchaseModal(false); load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Purchase failed'); }
    finally { setSavingPurchase(false); }
  };

  const loadPurchases = async () => {
    try {
      const { data } = await api.get('/suppliers/purchases?limit=50');
      setPurchases(data.data || []);
      setShowPurchases(true);
    } catch {}
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div><h1 className="page-title">Suppliers</h1><p className="page-subtitle">Manage supplier relationships and purchases</p></div>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button onClick={loadPurchases} className="btn btn-secondary"><MdShoppingBag /> Purchase History</button>
          <button onClick={openNew} className="btn btn-primary"><MdAdd /> Add Supplier</button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="search-bar">
          <MdSearch className="search-icon" style={{ fontSize: 17 }} />
          <input className="input" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Supplier</th><th>Contact</th><th>Phone</th><th>Email</th><th>City</th><th>Balance Due</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array(8).fill(0).map((_, i) => <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td></tr>)
              : suppliers.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><MdLocalShipping style={{ fontSize: 36 }} /><h3>No suppliers found</h3></div></td></tr>
              : suppliers.map(s => (
              <tr key={s.id}>
                <td><div style={{ fontWeight: 600 }}>{s.name}</div></td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.contactPerson || '—'}</td>
                <td style={{ fontSize: 12 }}>{s.phone || '—'}</td>
                <td style={{ fontSize: 12 }}>{s.email || '—'}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{s.city || '—'}</td>
                <td><span className={parseFloat(s.balanceDue) > 0 ? 'badge badge-danger' : 'badge badge-success'}>{formatCurrency(s.balanceDue)}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openPurchase(s)} className="btn btn-primary btn-sm btn-icon" title="New Purchase"><MdShoppingBag /></button>
                    <button onClick={() => openEdit(s)} className="btn btn-ghost btn-icon btn-sm"><MdEdit /></button>
                    {isAdmin() && <button onClick={() => handleDelete(s.id)} className="btn btn-danger btn-icon btn-sm"><MdDelete /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>{pagination.total} suppliers</span>
          <div className="pagination-controls">
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => load(p)} className={`page-btn ${p === pagination.page ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editItem ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group form-full"><label className="input-label">Supplier Name *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
                  <div className="input-group"><label className="input-label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Phone</label><input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="input-group"><label className="input-label">City</label><input className="input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
                  <div className="input-group form-full"><label className="input-label">Address</label><textarea className="input" rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
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

      {/* New Purchase Modal */}
      {showPurchaseModal && purchaseSupplier && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>New Purchase — {purchaseSupplier.name}</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {purchaseItems.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '.5rem', alignItems: 'flex-end' }}>
                  <div className="input-group">
                    {idx === 0 && <label className="input-label">Medicine</label>}
                    <select className="input" value={item.medicineId} onChange={e => { const n = [...purchaseItems]; n[idx].medicineId = e.target.value; const med = medicines.find(m => m.id == e.target.value); if (med) n[idx].purchasePrice = med.purchasePrice; setPurchaseItems(n); }}>
                      <option value="">Select...</option>
                      {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    {idx === 0 && <label className="input-label">Qty</label>}
                    <input className="input" type="number" min="1" value={item.quantity} onChange={e => { const n = [...purchaseItems]; n[idx].quantity = e.target.value; setPurchaseItems(n); }} />
                  </div>
                  <div className="input-group">
                    {idx === 0 && <label className="input-label">Price</label>}
                    <input className="input" type="number" step="0.01" value={item.purchasePrice} onChange={e => { const n = [...purchaseItems]; n[idx].purchasePrice = e.target.value; setPurchaseItems(n); }} placeholder="0.00" />
                  </div>
                  <div className="input-group">
                    {idx === 0 && <label className="input-label">Expiry</label>}
                    <input className="input" type="date" value={item.expiryDate} onChange={e => { const n = [...purchaseItems]; n[idx].expiryDate = e.target.value; setPurchaseItems(n); }} />
                  </div>
                  <div className="input-group">
                    {idx === 0 && <label className="input-label">Batch</label>}
                    <input className="input" value={item.batchNumber} onChange={e => { const n = [...purchaseItems]; n[idx].batchNumber = e.target.value; setPurchaseItems(n); }} placeholder="Batch #" />
                  </div>
                  <button onClick={() => setPurchaseItems(p => p.filter((_, i) => i !== idx))} className="btn btn-danger btn-icon btn-sm" style={{ marginTop: idx === 0 ? 20 : 0 }}><MdDelete /></button>
                </div>
              ))}
              <button onClick={() => setPurchaseItems(p => [...p, { medicineId: '', quantity: 1, purchasePrice: '', expiryDate: '', batchNumber: '' }])} className="btn btn-secondary btn-sm"><MdAdd /> Add Item</button>

              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Amount</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalPurchase)}</div>
                </div>
                <div className="input-group" style={{ width: 200 }}>
                  <label className="input-label">Paid Amount</label>
                  <input className="input" type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder={totalPurchase.toFixed(2)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowPurchaseModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handlePurchaseSave} disabled={savingPurchase} className="btn btn-primary">{savingPurchase ? 'Saving...' : 'Create Purchase'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Purchases List Modal */}
      {showPurchases && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3>Purchase History</h3>
              <button onClick={() => setShowPurchases(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <table>
                <thead><tr><th>Invoice</th><th>Supplier</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 11, fontFamily: 'monospace' }}>{p.invoiceNo}</td>
                      <td style={{ fontSize: 12 }}>{p.supplier?.name}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(p.totalAmount)}</td>
                      <td style={{ fontSize: 12 }}>{formatCurrency(p.paidAmount)}</td>
                      <td><span className={parseFloat(p.dueAmount) > 0 ? 'badge badge-danger' : 'badge badge-success'}>{formatCurrency(p.dueAmount)}</span></td>
                      <td><span className={`badge badge-${p.status === 'PAID' ? 'success' : p.status === 'PARTIAL' ? 'warning' : 'danger'}`}>{p.status}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
