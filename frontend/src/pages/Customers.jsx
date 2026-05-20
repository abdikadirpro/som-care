// import { useState, useEffect, useCallback } from 'react';
// import { MdAdd, MdEdit, MdDelete, MdSearch, MdClose, MdPeople } from 'react-icons/md';
// import api from '../utils/api';
// import { formatCurrency, formatDateTime } from '../utils/formatters';
// import toast from 'react-hot-toast';

// const EMPTY = { firstName: '', lastName: '', phone: '', email: '', address: '' };

// export default function Customers() {
//   const [customers, setCustomers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
//   const [search, setSearch] = useState('');
//   const [showModal, setShowModal] = useState(false);
//   const [editItem, setEditItem] = useState(null);
//   const [form, setForm] = useState(EMPTY);
//   const [saving, setSaving] = useState(false);

//   const load = useCallback(async (page = 1) => {
//     setLoading(true);
//     try {
//       const params = { page, limit: 20 };
//       if (search) params.search = search;
//       const { data } = await api.get('/customers', { params });
//       setCustomers(data.data || []);
//       setPagination(data.pagination || {});
//     } catch {} finally { setLoading(false); }
//   }, [search]);

//   useEffect(() => {
//     const t = setTimeout(() => load(1), 300);
//     return () => clearTimeout(t);
//   }, [load]);

//   const openNew = () => { setEditItem(null); setForm(EMPTY); setShowModal(true); };
//   const openEdit = (c) => { setEditItem(c); setForm({ firstName: c.firstName || '', lastName: c.lastName || '', phone: c.phone || '', email: c.email || '', address: c.address || '' }); setShowModal(true); };

//   const handleSave = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     try {
//       if (editItem) { await api.put(`/customers/${editItem.id}`, form); toast.success('Customer updated'); }
//       else { await api.post('/customers', form); toast.success('Customer added'); }
//       setShowModal(false); load(pagination.page);
//     } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
//     finally { setSaving(false); }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm('Delete customer?')) return;
//     try { await api.delete(`/customers/${id}`); toast.success('Deleted'); load(pagination.page); }
//     catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
//   };

//   return (
//     <div className="slide-up">
//       <div className="page-header">
//         <div><h1 className="page-title">Customers</h1><p className="page-subtitle">Manage customer profiles and loyalty</p></div>
//         <button onClick={openNew} className="btn btn-primary"><MdAdd /> Add Customer</button>
//       </div>

//       <div style={{ marginBottom: '1rem' }}>
//         <div className="search-bar">
//           <MdSearch className="search-icon" style={{ fontSize: 17 }} />
//           <input className="input" placeholder="Search customers by name or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
//         </div>
//       </div>

//       <div className="table-container">
//         <table>
//           <thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Loyalty Points</th><th>Credit Balance</th><th>Actions</th></tr></thead>
//           <tbody>
//             {loading ? Array(8).fill(0).map((_, i) => <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td></tr>)
//               : customers.length === 0 ? <tr><td colSpan={6}><div className="empty-state"><MdPeople style={{ fontSize: 36 }} /><h3>No customers found</h3></div></td></tr>
//               : customers.map(c => (
//               <tr key={c.id}>
//                 <td>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: .5 }}>
//                     <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
//                       {(c.firstName || c.phone || '?')[0].toUpperCase()}
//                     </div>
//                     <div style={{ fontWeight: 500 }}>{`${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Anonymous'}</div>
//                   </div>
//                 </td>
//                 <td style={{ fontSize: 12 }}>{c.phone || '—'}</td>
//                 <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email || '—'}</td>
//                 <td><span className="badge badge-primary">{c.loyaltyPoints} pts</span></td>
//                 <td><span className={parseFloat(c.creditBalance) > 0 ? 'badge badge-warning' : 'badge badge-muted'}>{formatCurrency(c.creditBalance)}</span></td>
//                 <td>
//                   <div style={{ display: 'flex', gap: 4 }}>
//                     <button onClick={() => openEdit(c)} className="btn btn-ghost btn-icon btn-sm"><MdEdit /></button>
//                     <button onClick={() => handleDelete(c.id)} className="btn btn-danger btn-icon btn-sm"><MdDelete /></button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         <div className="pagination">
//           <span>{pagination.total} customers</span>
//           <div className="pagination-controls">
//             {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
//               <button key={p} onClick={() => load(p)} className={`page-btn ${p === pagination.page ? 'active' : ''}`}>{p}</button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {showModal && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <h3>{editItem ? 'Edit Customer' : 'Add Customer'}</h3>
//               <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
//             </div>
//             <form onSubmit={handleSave}>
//               <div className="modal-body">
//                 <div className="form-grid">
//                   <div className="input-group"><label className="input-label">First Name</label><input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} /></div>
//                   <div className="input-group"><label className="input-label">Last Name</label><input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} /></div>
//                   <div className="input-group"><label className="input-label">Phone</label><input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
//                   <div className="input-group"><label className="input-label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
//                   <div className="input-group form-full"><label className="input-label">Address</label><input className="input" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
//                 <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : editItem ? 'Save' : 'Add'}</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
