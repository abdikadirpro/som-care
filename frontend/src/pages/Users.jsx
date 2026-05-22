import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdEdit, MdClose, MdPowerSettingsNew, MdSupervisedUserCircle, MdDeleteOutline } from 'react-icons/md';
import api from '../utils/api';
import { formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ALL_ROLES   = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'CASHIER'];
const STAFF_ROLES = ['PHARMACIST', 'CASHIER'];
const ROLE_COLORS = { SUPER_ADMIN: 'badge-danger', ADMIN: 'badge-warning', PHARMACIST: 'badge-primary', CASHIER: 'badge-success' };
const EMPTY = { firstName: '', lastName: '', email: '', password: '', phone: '', role: 'CASHIER', city: '' };

export default function Users() {
  const { isSuperAdmin, user: me } = useAuth();
  const manageableRoles = isSuperAdmin() ? ALL_ROLES : STAFF_ROLES;

  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // user to confirm-delete
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const { data } = await api.get('/users', { params });
      setUsers(data.data || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  const openNew  = () => { setEditItem(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (u) => {
    setEditItem(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email || '', password: '', phone: u.phone || '', role: u.role, city: u.city || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { toast.error('Name required'); return; }
    if (!editItem && !form.password) { toast.error('Password required for new user'); return; }
    setSaving(true);
    try {
      if (editItem) { await api.put(`/users/${editItem.id}`, form); toast.success('User updated'); }
      else          { await api.post('/users', form);               toast.success('User created'); }
      setShowModal(false);
      load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (id) => {
    try { await api.patch(`/users/${id}/toggle-status`); toast.success('Status changed'); load(pagination.page); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('User deleted');
      setDeleteTarget(null);
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage staff accounts</p>
        </div>
        <button onClick={openNew} className="btn btn-primary"><MdAdd /> Add User</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Search users…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ width: 150 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {manageableRoles.map(r => <option key={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(8).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td></tr>
                ))
              : users.length === 0
              ? <tr><td colSpan={7}><div className="empty-state"><MdSupervisedUserCircle style={{ fontSize: 36 }} /><h3>No users found</h3></div></td></tr>
              : users.map(u => (
                <tr key={u.id}>
                  {/* Avatar + name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{u.email || '—'}</td>
                  <td style={{ fontSize: 12 }}>{u.phone || '—'}</td>
                  <td><span className={`badge ${ROLE_COLORS[u.role] || 'badge-muted'}`}>{u.role.replace('_', ' ')}</span></td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {/* Edit */}
                      <button onClick={() => openEdit(u)} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                        <MdEdit style={{ fontSize: 15 }} />
                      </button>
                      {/* Activate / Deactivate */}
                      <button
                        onClick={() => toggleStatus(u.id)}
                        className={`btn btn-icon btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                        disabled={u.id === me?.id}>
                        <MdPowerSettingsNew style={{ fontSize: 15 }} />
                      </button>
                      {/* Delete — SUPER_ADMIN only, can't delete self */}
                      {isSuperAdmin() && u.id !== me?.id && (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="btn btn-icon btn-sm"
                          title="Delete user"
                          style={{ color: 'var(--danger)', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.15)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,.08)'}>
                          <MdDeleteOutline style={{ fontSize: 15 }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {/* Pagination */}
        <div className="pagination">
          <span>{pagination.total} users</span>
          <div className="pagination-controls">
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => load(p)} className={`page-btn${p === pagination.page ? ' active' : ''}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Add / Edit Modal ═════════════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editItem ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">First Name *</label>
                    <input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Last Name *</label>
                    <input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{editItem ? 'New Password' : 'Password *'}</label>
                    <input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required={!editItem} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Phone</label>
                    <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Role</label>
                    <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                      {manageableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">City</label>
                    <input className="input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Delete Confirm Modal ══════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>Delete User</h3>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)' }}>
                Are you sure you want to permanently delete{' '}
                <strong style={{ color: 'var(--text)' }}>{deleteTarget.firstName} {deleteTarget.lastName}</strong>?
              </p>
              <div style={{ marginTop: '.75rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 10, fontSize: 12, color: 'var(--danger)', lineHeight: 1.65 }}>
                This action cannot be undone. Users with existing sales records cannot be deleted — deactivate them instead.
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteTarget(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn btn-danger" style={{ background: 'var(--danger)', color: '#fff' }}>
                {deleting ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
