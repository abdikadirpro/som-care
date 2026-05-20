import { useState, useEffect, useCallback } from 'react';
import { MdDescription, MdCheck, MdClose, MdSearch } from 'react-icons/md';
import api from '../utils/api';
import { formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger' };

export default function Prescriptions() {
  const { hasRole } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [uploadForm, setUploadForm] = useState({ customerId: '', notes: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/prescriptions', { params });
      setPrescriptions(data.data || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => { api.get('/customers?limit=100').then(r => setCustomers(r.data.data || [])).catch(() => {}); }, []);

  const handleReview = async (status) => {
    setReviewing(true);
    try {
      await api.patch(`/prescriptions/${selected.id}/review`, { status, notes: reviewNote });
      toast.success(`Prescription ${status.toLowerCase()}`);
      setSelected(null); setReviewNote(''); load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Review failed'); }
    finally { setReviewing(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadForm.customerId) { toast.error('Select customer and file'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('prescription', uploadFile);
    fd.append('customerId', uploadForm.customerId);
    fd.append('notes', uploadForm.notes);
    try {
      await api.post('/prescriptions', fd);
      toast.success('Prescription uploaded'); setShowUpload(false); load(1);
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div><h1 className="page-title">Prescriptions</h1><p className="page-subtitle">Manage prescription reviews</p></div>
        <button onClick={() => setShowUpload(true)} className="btn btn-primary"><MdDescription /> Upload Prescription</button>
      </div>

      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem' }}>
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Customer</th><th>Status</th><th>Notes</th><th>Reviewed By</th><th>Submitted</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? Array(8).fill(0).map((_, i) => <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td></tr>)
              : prescriptions.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><MdDescription style={{ fontSize: 36 }} /><h3>No prescriptions</h3></div></td></tr>
              : prescriptions.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.customer ? `${p.customer.firstName || ''} ${p.customer.lastName || ''}`.trim() || p.customer.phone : '—'}</td>
                <td><span className={`badge ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>{p.notes || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.reviewer ? `${p.reviewer.firstName} ${p.reviewer.lastName}` : '—'}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(p.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setSelected(p); setReviewNote(''); }} className="btn btn-secondary btn-sm">Review</button>
                    {p.imageUrl && (
                      <a href={`${import.meta.env.VITE_API_URL?.replace('/api','')}${p.imageUrl}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>{pagination.total} prescriptions</span>
          <div className="pagination-controls">
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => load(p)} className={`page-btn ${p === pagination.page ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Review Prescription</h3>
              <button onClick={() => setSelected(null)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '.75rem', background: 'var(--surface-light)', borderRadius: 8, fontSize: 13 }}>
                <div><strong>Customer:</strong> {selected.customer ? `${selected.customer.firstName || ''} ${selected.customer.lastName || ''}`.trim() : '—'}</div>
                <div><strong>Submitted:</strong> {formatDateTime(selected.createdAt)}</div>
                {selected.notes && <div><strong>Notes:</strong> {selected.notes}</div>}
              </div>
              {selected.imageUrl && (
                <a href={`${import.meta.env.VITE_API_URL?.replace('/api','')}${selected.imageUrl}`} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '.75rem', background: 'rgba(16,185,129,.1)', borderRadius: 8, textAlign: 'center', color: 'var(--primary)', fontSize: 13 }}>
                  View Prescription Image
                </a>
              )}
              <div className="input-group">
                <label className="input-label">Review Note</label>
                <textarea className="input" rows={3} value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add a note about this prescription..." />
              </div>
              <div style={{ display: 'flex', gap: '.75rem' }}>
                <button onClick={() => handleReview('REJECTED')} disabled={reviewing} className="btn btn-danger" style={{ flex: 1 }}>
                  <MdClose /> Reject
                </button>
                <button onClick={() => handleReview('APPROVED')} disabled={reviewing} className="btn btn-primary" style={{ flex: 1 }}>
                  <MdCheck /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Upload Prescription</h3>
              <button onClick={() => setShowUpload(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Customer *</label>
                  <select className="input" value={uploadForm.customerId} onChange={e => setUploadForm(p => ({ ...p, customerId: e.target.value }))} required>
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.firstName || ''} {c.lastName || ''} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Prescription File (Image or PDF) *</label>
                  <input type="file" accept="image/*,.pdf" onChange={e => setUploadFile(e.target.files[0])} className="input" style={{ padding: '.45rem' }} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Notes</label>
                  <textarea className="input" rows={2} value={uploadForm.notes} onChange={e => setUploadForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowUpload(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={uploading} className="btn btn-primary">{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
