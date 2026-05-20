import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdMedication, MdClose, MdWarning } from 'react-icons/md';
import { GiPill } from 'react-icons/gi';
import api from '../utils/api';
import { formatCurrency, formatDate, isExpiringSoon, isExpired, stockStatus } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';

const FORM_OPTIONS = ['TABLET','CAPSULE','SYRUP','CREAM','INJECTION','DEVICE','DROPS','POWDER','OTHER'];
const UNIT_TYPES = ['PIECE','STRIP','BOX','DOZEN','SUB_DOZEN','CARTON','BOTTLE','PACK'];
const EMPTY = { name:'', genericName:'', categoryId:'', supplierId:'', manufacturer:'', dosage:'', strength:'', form:'TABLET', purchasePrice:'', retailPrice:'', wholesalePrice:'', minimumPrice:'', piecesPerStrip:10, stripsPerBox:10, boxesPerDozen:12, stockQuantity:0, minimumStock:5, barcode:'', sku:'', batchNumber:'', expiryDate:'', description:'', prescriptionRequired:false, isActive:true, taxPercent:0, discountPercent:0 };

export default function Medicines() {
  const { isAdmin, canManageMedicines } = useAuth();
  const { confirm } = useConfirm();
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ categoryId: '', form: '', isActive: 'true' });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showAdjust, setShowAdjust] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('PURCHASE');
  const [adjustNote, setAdjustNote] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      if (search) params.search = search;
      const { data } = await api.get('/medicines', { params });
      setMedicines(data.data || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/suppliers?limit=100')])
      .then(([c, s]) => { setCategories(c.data.data || []); setSuppliers(s.data.data || []); })
      .catch(() => {});
  }, []);

  const openNew = () => { setEditItem(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (m) => {
    setEditItem(m);
    setForm({
      name: m.name, genericName: m.genericName || '', categoryId: m.categoryId, supplierId: m.supplierId || '',
      manufacturer: m.manufacturer || '', dosage: m.dosage || '', strength: m.strength || '', form: m.form,
      purchasePrice: m.purchasePrice, retailPrice: m.retailPrice, wholesalePrice: m.wholesalePrice || '',
      minimumPrice: m.minimumPrice || '', piecesPerStrip: m.piecesPerStrip, stripsPerBox: m.stripsPerBox,
      boxesPerDozen: m.boxesPerDozen, stockQuantity: m.stockQuantity, minimumStock: m.minimumStock,
      barcode: m.barcode || '', sku: m.sku || '', batchNumber: m.batchNumber || '',
      expiryDate: m.expiryDate ? m.expiryDate.slice(0, 10) : '', description: m.description || '',
      prescriptionRequired: m.prescriptionRequired, isActive: m.isActive, taxPercent: m.taxPercent, discountPercent: m.discountPercent,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.purchasePrice || !form.retailPrice) {
      toast.error('Please fill required fields'); return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/medicines/${editItem.id}`, form);
        toast.success('Medicine updated');
      } else {
        await api.post('/medicines', form);
        toast.success('Medicine added');
      }
      setShowModal(false);
      load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Medicine?',
      message: 'Records with sales or purchase history will be deactivated instead of permanently deleted.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!ok) return;
    setDeleting(id);
    try { await api.delete(`/medicines/${id}`); toast.success('Deleted'); load(pagination.page); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleAdjust = async () => {
    if (!adjustQty || parseInt(adjustQty) <= 0) { toast.error('Enter valid quantity'); return; }
    try {
      await api.post(`/medicines/${showAdjust.id}/adjust-stock`, { quantity: adjustQty, movementType: adjustType, note: adjustNote });
      toast.success('Stock adjusted');
      setShowAdjust(null); setAdjustQty(''); setAdjustNote('');
      load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Adjustment failed'); }
  };

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicines</h1>
          <p className="page-subtitle">Manage pharmacy inventory & pricing</p>
        </div>
        {canManageMedicines() && <button onClick={openNew} className="btn btn-primary"><MdAdd /> Add Medicine</button>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <MdSearch className="search-icon" style={{ fontSize: 17 }} />
          <input className="input" placeholder="Search name, barcode, generic..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input" style={{ width: 160 }} value={filters.categoryId} onChange={e => setFilters(p => ({ ...p, categoryId: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" style={{ width: 130 }} value={filters.form} onChange={e => setFilters(p => ({ ...p, form: e.target.value }))}>
          <option value="">All Forms</option>
          {FORM_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="input" style={{ width: 130 }} value={filters.isActive} onChange={e => setFilters(p => ({ ...p, isActive: e.target.value }))}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', fontSize: 12, flexWrap: 'wrap' }}>
        <span className="badge badge-muted">{pagination.total} medicines</span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Medicine</th><th>Category</th><th>Stock</th><th>Purchase</th><th>Retail</th><th>Expiry</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(8).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height: 16, width: '100%', borderRadius: 4 }} /></td></tr>
            )) : medicines.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><MdMedication style={{ fontSize: 36 }} /><h3>No medicines found</h3></div></td></tr>
            ) : medicines.map(med => {
              const ss = stockStatus(med.stockQuantity, med.minimumStock);
              const expired = isExpired(med.expiryDate);
              const expiring = isExpiringSoon(med.expiryDate);
              return (
                <tr key={med.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: .75 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <GiPill style={{ color: 'var(--primary)', fontSize: 15 }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{med.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{med.genericName || med.form} {med.strength && `• ${med.strength}`}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{med.category?.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge badge-${med.stockQuantity === 0 ? 'danger' : med.stockQuantity <= med.minimumStock ? 'warning' : 'success'}`}>{med.stockQuantity}</span>
                      <button onClick={() => setShowAdjust(med)} className="btn btn-ghost btn-sm btn-icon" title="Adjust stock" style={{ fontSize: 13 }}>±</button>
                    </div>
                  </td>
                  <td>{formatCurrency(med.purchasePrice)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(med.retailPrice)}</td>
                  <td>
                    {med.expiryDate ? (
                      <span className={`badge ${expired ? 'badge-danger' : expiring ? 'badge-warning' : 'badge-muted'}`} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {(expired || expiring) && <MdWarning style={{ fontSize: 11 }} />}
                        {formatDate(med.expiryDate)}
                      </span>
                    ) : <span style={{ color: 'var(--text-faint)' }}>—</span>}
                  </td>
                  <td><span className={`badge ${med.isActive ? 'badge-success' : 'badge-muted'}`}>{med.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {canManageMedicines() && <button onClick={() => openEdit(med)} className="btn btn-ghost btn-icon btn-sm"><MdEdit /></button>}
                      {isAdmin() && <button onClick={() => handleDelete(med.id)} disabled={deleting === med.id} className="btn btn-danger btn-icon btn-sm"><MdDelete /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pagination">
          <span>Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
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
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>{editItem ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Basic Info */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.75rem' }}>Basic Information</div>
                  <div className="form-grid">
                    <div className="input-group form-full">
                      <label className="input-label">Medicine Name *</label>
                      <input className="input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Paracetamol 500mg" required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Generic Name</label>
                      <input className="input" value={form.genericName} onChange={e => f('genericName', e.target.value)} placeholder="Generic/scientific name" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Manufacturer</label>
                      <input className="input" value={form.manufacturer} onChange={e => f('manufacturer', e.target.value)} placeholder="e.g. GSK, Pfizer" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Category *</label>
                      <select className="input" value={form.categoryId} onChange={e => f('categoryId', e.target.value)} required>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Supplier</label>
                      <select className="input" value={form.supplierId} onChange={e => f('supplierId', e.target.value)}>
                        <option value="">No Supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Form</label>
                      <select className="input" value={form.form} onChange={e => f('form', e.target.value)}>
                        {FORM_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Dosage</label>
                      <input className="input" value={form.dosage} onChange={e => f('dosage', e.target.value)} placeholder="e.g. 500mg, 10ml" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Strength</label>
                      <input className="input" value={form.strength} onChange={e => f('strength', e.target.value)} placeholder="e.g. 500mg" />
                    </div>
                  </div>
                </div>

                <hr className="divider" />

                {/* Pricing */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.75rem' }}>Pricing (ETB)</div>
                  <div className="form-grid">
                    <div className="input-group">
                      <label className="input-label">Purchase Price *</label>
                      <input className="input" type="number" step="0.01" min="0" value={form.purchasePrice} onChange={e => f('purchasePrice', e.target.value)} placeholder="0.00" required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Retail Price *</label>
                      <input className="input" type="number" step="0.01" min="0" value={form.retailPrice} onChange={e => f('retailPrice', e.target.value)} placeholder="0.00" required />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Wholesale Price</label>
                      <input className="input" type="number" step="0.01" min="0" value={form.wholesalePrice} onChange={e => f('wholesalePrice', e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Tax %</label>
                      <input className="input" type="number" step="0.01" min="0" max="100" value={form.taxPercent} onChange={e => f('taxPercent', e.target.value)} placeholder="0.00" />
                    </div>
                  </div>
                </div>

                <hr className="divider" />

                {/* Unit System */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.75rem' }}>Unit Configuration</div>
                  <div className="form-grid-3">
                    <div className="input-group">
                      <label className="input-label">Pieces / Strip</label>
                      <input className="input" type="number" min="1" value={form.piecesPerStrip} onChange={e => f('piecesPerStrip', parseInt(e.target.value))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Strips / Box</label>
                      <input className="input" type="number" min="1" value={form.stripsPerBox} onChange={e => f('stripsPerBox', parseInt(e.target.value))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Boxes / Dozen</label>
                      <input className="input" type="number" min="1" value={form.boxesPerDozen} onChange={e => f('boxesPerDozen', parseInt(e.target.value))} />
                    </div>
                  </div>
                </div>

                <hr className="divider" />

                {/* Stock & Expiry */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.75rem' }}>Stock & Tracking</div>
                  <div className="form-grid">
                    <div className="input-group">
                      <label className="input-label">Stock Quantity</label>
                      <input className="input" type="number" min="0" value={form.stockQuantity} onChange={e => f('stockQuantity', parseInt(e.target.value))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Minimum Stock Alert</label>
                      <input className="input" type="number" min="0" value={form.minimumStock} onChange={e => f('minimumStock', parseInt(e.target.value))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Barcode</label>
                      <input className="input" value={form.barcode} onChange={e => f('barcode', e.target.value)} placeholder="Scan or enter barcode" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Batch Number</label>
                      <input className="input" value={form.batchNumber} onChange={e => f('batchNumber', e.target.value)} placeholder="e.g. BN-2024-001" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Expiry Date</label>
                      <input className="input" type="date" value={form.expiryDate} onChange={e => f('expiryDate', e.target.value)} />
                    </div>
                    <div className="input-group" style={{ justifyContent: 'flex-end' }}>
                      <label className="input-label">Options</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" checked={form.prescriptionRequired} onChange={e => f('prescriptionRequired', e.target.checked)} />
                          Prescription Required
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                          <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} />
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {showAdjust && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 15 }}>Adjust Stock — {showAdjust.name}</h3>
              <button onClick={() => setShowAdjust(null)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '.75rem', background: 'var(--surface-light)', borderRadius: 8, fontSize: 13 }}>
                Current Stock: <strong style={{ color: 'var(--primary)' }}>{showAdjust.stockQuantity}</strong>
              </div>
              <div className="input-group">
                <label className="input-label">Movement Type</label>
                <select className="input" value={adjustType} onChange={e => setAdjustType(e.target.value)}>
                  <option value="PURCHASE">Purchase (+)</option>
                  <option value="RETURN">Return (+)</option>
                  <option value="ADJUSTMENT">Adjustment (+)</option>
                  <option value="DAMAGE">Damage (-)</option>
                  <option value="EXPIRED">Expired (-)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Quantity</label>
                <input className="input" type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="Enter quantity" autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Note</label>
                <input className="input" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Optional note..." />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAdjust(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAdjust} className="btn btn-primary">Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
