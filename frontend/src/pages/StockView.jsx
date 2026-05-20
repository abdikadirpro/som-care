import { useState, useEffect, useCallback } from 'react';
import { MdSearch, MdMedication } from 'react-icons/md';
import { GiPill } from 'react-icons/gi';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';

export default function StockView() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 50, isActive: 'true' };
      if (search) params.search = search;
      const { data } = await api.get('/medicines', { params });
      setMedicines(data.data || []);
      setPagination(data.pagination || {});
    } catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  const stockBadge = (qty, min) => {
    if (qty === 0) return 'badge-danger';
    if (qty <= min) return 'badge-warning';
    return 'badge-success';
  };

  const stockLabel = (qty, min) => {
    if (qty === 0) return 'Out of Stock';
    if (qty <= min) return 'Low';
    return 'In Stock';
  };

  const lowCount   = medicines.filter(m => m.stockQuantity > 0 && m.stockQuantity <= m.minimumStock).length;
  const outCount   = medicines.filter(m => m.stockQuantity === 0).length;
  const totalCount = pagination.total;

  return (
    <div className="slide-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock View</h1>
          <p className="page-subtitle">Available stock &amp; selling prices</p>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span className="badge badge-muted">{totalCount} medicines</span>
        {lowCount  > 0 && <span className="badge badge-warning">{lowCount} low stock</span>}
        {outCount  > 0 && <span className="badge badge-danger">{outCount} out of stock</span>}
      </div>

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 420, marginBottom: '1rem' }}>
        <MdSearch className="search-icon" style={{ fontSize: 17 }} />
        <input
          className="input"
          placeholder="Search medicine name or generic..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Form</th>
              <th style={{ textAlign: 'center' }}>Available Stock</th>
              <th style={{ textAlign: 'right' }}>Selling Price</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  </tr>
                ))
              : medicines.length === 0
              ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <MdMedication style={{ fontSize: 36 }} />
                        <h3>No medicines found</h3>
                      </div>
                    </td>
                  </tr>
                )
              : medicines.map(med => (
                  <tr key={med.id}>
                    {/* Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <GiPill style={{ color: 'var(--primary)', fontSize: 15 }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{med.name}</div>
                          {med.genericName && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{med.genericName}{med.strength ? ` • ${med.strength}` : ''}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Form */}
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{med.form}</td>

                    {/* Stock qty */}
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`badge badge-${stockBadge(med.stockQuantity, med.minimumStock)}`}
                        style={{ fontSize: 13, fontWeight: 700, minWidth: 36, justifyContent: 'center' }}
                      >
                        {med.stockQuantity}
                      </span>
                    </td>

                    {/* Selling price */}
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
                      {formatCurrency(med.retailPrice)}
                    </td>

                    {/* Stock status */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge-${stockBadge(med.stockQuantity, med.minimumStock)}`}>
                        {stockLabel(med.stockQuantity, med.minimumStock)}
                      </span>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <span>{totalCount} medicines</span>
            <div className="pagination-controls">
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => load(p)} className={`page-btn ${p === pagination.page ? 'active' : ''}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
