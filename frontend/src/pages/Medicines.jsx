import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdMedication, MdClose,
  MdWarning, MdStar, MdCloudUpload, MdImage,
} from 'react-icons/md';
import { GiPill } from 'react-icons/gi';
import api from '../utils/api';
import { formatCurrency, formatDate, isExpiringSoon, isExpired } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BACKEND}${url}`;
};

const FORM_OPTIONS = ['TABLET','CAPSULE','SYRUP','CREAM','INJECTION','DEVICE','DROPS','POWDER','OTHER'];
const EMPTY = {
  name:'', genericName:'', categoryId:'', supplierId:'', manufacturer:'', dosage:'',
  strength:'', form:'TABLET', purchasePrice:'', retailPrice:'', wholesalePrice:'',
  minimumPrice:'', piecesPerStrip:10, stripsPerBox:10, boxesPerDozen:12, stockQuantity:0,
  minimumStock:5, barcode:'', sku:'', batchNumber:'', expiryDate:'', description:'',
  prescriptionRequired:false, isActive:true, featured:false, taxPercent:0, discountPercent:0,
};

export default function Medicines() {
  const { isAdmin, canManageMedicines } = useAuth();
  const { confirm } = useConfirm();
  const fileInputRef = useRef(null);

  const [medicines, setMedicines]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pagination, setPagination] = useState({ total:0, page:1, limit:20, pages:1 });
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ categoryId:'', form:'', isActive:'true' });
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [showAdjust, setShowAdjust] = useState(null);
  const [adjustQty, setAdjustQty]   = useState('');
  const [adjustType, setAdjustType] = useState('PURCHASE');
  const [adjustNote, setAdjustNote] = useState('');
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragOver, setDragOver]     = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit:20, ...filters };
      if (search) params.search = search;
      const { data } = await api.get('/medicines', { params });
      setMedicines(data.data || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { const t = setTimeout(() => load(1), 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/suppliers?limit=100')])
      .then(([c, s]) => { setCategories(c.data.data || []); setSuppliers(s.data.data || []); })
      .catch(() => {});
  }, []);

  const resetImage = () => { setImageFile(null); setImagePreview(null); };

  const openNew = () => {
    setEditItem(null); setForm(EMPTY); resetImage(); setShowModal(true);
  };
  const openEdit = (m) => {
    setEditItem(m);
    setForm({
      name: m.name, genericName: m.genericName||'', categoryId: m.categoryId,
      supplierId: m.supplierId||'', manufacturer: m.manufacturer||'',
      dosage: m.dosage||'', strength: m.strength||'', form: m.form,
      purchasePrice: m.purchasePrice, retailPrice: m.retailPrice,
      wholesalePrice: m.wholesalePrice||'', minimumPrice: m.minimumPrice||'',
      piecesPerStrip: m.piecesPerStrip, stripsPerBox: m.stripsPerBox,
      boxesPerDozen: m.boxesPerDozen, stockQuantity: m.stockQuantity,
      minimumStock: m.minimumStock, barcode: m.barcode||'', sku: m.sku||'',
      batchNumber: m.batchNumber||'', expiryDate: m.expiryDate ? m.expiryDate.slice(0,10) : '',
      description: m.description||'', prescriptionRequired: m.prescriptionRequired,
      isActive: m.isActive, featured: m.featured||false,
      taxPercent: m.taxPercent, discountPercent: m.discountPercent,
    });
    setImageFile(null);
    setImagePreview(imgUrl(m.imageUrl) || null);
    setShowModal(true);
  };

  const pickFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.purchasePrice || !form.retailPrice) {
      toast.error('Please fill required fields'); return;
    }
    setSaving(true);
    try {
      let body;
      if (imageFile) {
        body = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (v !== null && v !== undefined) body.append(k, v);
        });
        body.append('image', imageFile);
      } else {
        body = form;
      }
      if (editItem) {
        await api.put(`/medicines/${editItem.id}`, body);
        toast.success('Medicine updated');
      } else {
        await api.post('/medicines', body);
        toast.success('Medicine added');
      }
      setShowModal(false); resetImage(); load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete Medicine?',
      message: 'Records with sales or purchase history will be deactivated instead of permanently deleted.',
      confirmText: 'Delete', type: 'danger',
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
      setShowAdjust(null); setAdjustQty(''); setAdjustNote(''); load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Adjustment failed'); }
  };

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicines</h1>
          <p className="page-subtitle">Manage inventory, pricing & product photos</p>
        </div>
        {canManageMedicines() && (
          <button onClick={openNew} className="btn btn-primary"><MdAdd /> Add Medicine</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'.75rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        <div className="search-bar" style={{ flex:1, minWidth:200 }}>
          <MdSearch className="search-icon" style={{ fontSize:17 }} />
          <input className="input" placeholder="Search name, barcode, generic..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft:34 }} />
        </div>
        <select className="input" style={{ width:160 }} value={filters.categoryId}
          onChange={e => setFilters(p => ({ ...p, categoryId: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" style={{ width:130 }} value={filters.form}
          onChange={e => setFilters(p => ({ ...p, form: e.target.value }))}>
          <option value="">All Forms</option>
          {FORM_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="input" style={{ width:130 }} value={filters.isActive}
          onChange={e => setFilters(p => ({ ...p, isActive: e.target.value }))}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="">All</option>
        </select>
      </div>

      <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem', fontSize:12, flexWrap:'wrap' }}>
        <span className="badge badge-muted">{pagination.total} medicines</span>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Medicine</th><th>Category</th><th>Stock</th>
              <th>Purchase</th><th>Retail</th><th>Expiry</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(8).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height:16, width:'100%', borderRadius:4 }} /></td></tr>
            )) : medicines.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><MdMedication style={{ fontSize:36 }} /><h3>No medicines found</h3></div></td></tr>
            ) : medicines.map(med => {
              const expired  = isExpired(med.expiryDate);
              const expiring = isExpiringSoon(med.expiryDate);
              const photo    = imgUrl(med.imageUrl);
              return (
                <tr key={med.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'.6rem' }}>
                      {/* Thumbnail */}
                      <div style={{ width:38, height:38, borderRadius:9, overflow:'hidden', flexShrink:0, background:'rgba(16,185,129,.08)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)' }}>
                        {photo
                          ? <img src={photo} alt={med.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : <GiPill style={{ color:'var(--primary)', fontSize:17 }} />
                        }
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontWeight:600, fontSize:13 }}>{med.name}</span>
                          {med.featured && <MdStar style={{ color:'#f59e0b', fontSize:13 }} title="Featured on landing page" />}
                        </div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{med.genericName||med.form} {med.strength && `• ${med.strength}`}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color:'var(--text-muted)', fontSize:12 }}>{med.category?.name}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span className={`badge badge-${med.stockQuantity===0?'danger':med.stockQuantity<=med.minimumStock?'warning':'success'}`}>{med.stockQuantity}</span>
                      <button onClick={() => setShowAdjust(med)} className="btn btn-ghost btn-sm btn-icon" title="Adjust stock" style={{ fontSize:13 }}>±</button>
                    </div>
                  </td>
                  <td>{formatCurrency(med.purchasePrice)}</td>
                  <td style={{ fontWeight:600, color:'var(--primary)' }}>{formatCurrency(med.retailPrice)}</td>
                  <td>
                    {med.expiryDate ? (
                      <span className={`badge ${expired?'badge-danger':expiring?'badge-warning':'badge-muted'}`} style={{ display:'flex', alignItems:'center', gap:3 }}>
                        {(expired||expiring) && <MdWarning style={{ fontSize:11 }} />}
                        {formatDate(med.expiryDate)}
                      </span>
                    ) : <span style={{ color:'var(--text-faint)' }}>—</span>}
                  </td>
                  <td><span className={`badge ${med.isActive?'badge-success':'badge-muted'}`}>{med.isActive?'Active':'Inactive'}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      {canManageMedicines() && <button onClick={() => openEdit(med)} className="btn btn-ghost btn-icon btn-sm"><MdEdit /></button>}
                      {isAdmin() && <button onClick={() => handleDelete(med.id)} disabled={deleting===med.id} className="btn btn-danger btn-icon btn-sm"><MdDelete /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pagination">
          <span>Showing {Math.min((pagination.page-1)*pagination.limit+1,pagination.total)}–{Math.min(pagination.page*pagination.limit,pagination.total)} of {pagination.total}</span>
          <div className="pagination-controls">
            {Array.from({ length: Math.min(pagination.pages,7) }, (_,i) => i+1).map(p => (
              <button key={p} onClick={() => load(p)} className={`page-btn ${p===pagination.page?'active':''}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:720 }}>
            <div className="modal-header">
              <h3 style={{ fontSize:16 }}>{editItem ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <button onClick={() => { setShowModal(false); resetImage(); }} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

                {/* ── Photo Upload ── */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:1, marginBottom:'.75rem' }}>
                    Medicine Photo
                  </div>
                  <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start', flexWrap:'wrap' }}>

                    {/* Drop zone / preview */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
                      style={{
                        width:130, height:130, borderRadius:14, flexShrink:0, cursor:'pointer', overflow:'hidden',
                        border:`2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                        background: dragOver ? 'rgba(16,185,129,.06)' : 'var(--surface-light)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all .15s', position:'relative',
                      }}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview"
                          style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      ) : (
                        <div style={{ textAlign:'center', color:'var(--text-faint)', pointerEvents:'none' }}>
                          <MdImage style={{ fontSize:36, opacity:.4, display:'block', margin:'0 auto .35rem' }} />
                          <div style={{ fontSize:11 }}>Click or drag photo</div>
                        </div>
                      )}
                    </div>

                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
                      onChange={e => pickFile(e.target.files[0])} />

                    {/* Info + actions */}
                    <div style={{ flex:1, minWidth:180 }}>
                      <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:'.6rem', lineHeight:1.6 }}>
                        Upload a clear photo of the medicine.<br />
                        JPG, PNG or WebP · max 5 MB.<br />
                        Photos appear on the public shop &amp; landing page.
                      </p>
                      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'.75rem' }}>
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          className="btn btn-secondary btn-sm" style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <MdCloudUpload style={{ fontSize:15 }} />
                          {imagePreview ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {imagePreview && (
                          <button type="button"
                            onClick={() => { resetImage(); f('imageUrl', ''); }}
                            className="btn btn-ghost btn-sm"
                            style={{ color:'var(--danger)' }}>
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Featured toggle */}
                      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, userSelect:'none' }}>
                        <input type="checkbox" checked={form.featured||false} onChange={e => f('featured', e.target.checked)} />
                        <MdStar style={{ color:'#f59e0b', fontSize:15 }} />
                        <span>Feature on landing page <span style={{ fontSize:11, color:'var(--text-faint)' }}>(advertise this medicine)</span></span>
                      </label>
                    </div>
                  </div>
                </div>

                <hr className="divider" />

                {/* ── Basic Info ── */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:1, marginBottom:'.75rem' }}>Basic Information</div>
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

                {/* ── Pricing ── */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:1, marginBottom:'.75rem' }}>Pricing</div>
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
                      <input className="input" type="number" step="0.01" min="0" max="100" value={form.taxPercent} onChange={e => f('taxPercent', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>

                <hr className="divider" />

                {/* ── Units ── */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:1, marginBottom:'.75rem' }}>Unit Configuration</div>
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

                {/* ── Stock & Tracking ── */}
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', textTransform:'uppercase', letterSpacing:1, marginBottom:'.75rem' }}>Stock & Tracking</div>
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
                    <div className="input-group">
                      <label className="input-label">Options</label>
                      <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:4 }}>
                        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                          <input type="checkbox" checked={form.prescriptionRequired} onChange={e => f('prescriptionRequired', e.target.checked)} />
                          Prescription Required
                        </label>
                        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
                          <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} />
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => { setShowModal(false); resetImage(); }} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Stock Adjust Modal ── */}
      {showAdjust && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:400 }}>
            <div className="modal-header">
              <h3 style={{ fontSize:15 }}>Adjust Stock — {showAdjust.name}</h3>
              <button onClick={() => setShowAdjust(null)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ padding:'.75rem', background:'var(--surface-light)', borderRadius:8, fontSize:13 }}>
                Current Stock: <strong style={{ color:'var(--primary)' }}>{showAdjust.stockQuantity}</strong>
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
