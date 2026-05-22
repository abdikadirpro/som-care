import { useState, useEffect, useCallback } from 'react';
import {
  MdRefresh, MdSearch, MdVisibility, MdClose,
  MdLocalShipping, MdCheckCircle, MdCancel, MdAccessTime,
  MdDescription, MdPerson, MdPhone, MdLocationOn, MdPayment,
} from 'react-icons/md';
import { GiMedicinePills } from 'react-icons/gi';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BACKEND}${url}`;
};

const STATUS_META = {
  PENDING:    { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,.12)',  icon: MdAccessTime      },
  PROCESSING: { label: 'Processing', color: '#06b6d4', bg: 'rgba(6,182,212,.12)',   icon: MdRefresh         },
  SHIPPED:    { label: 'Shipped',    color: '#a78bfa', bg: 'rgba(167,139,250,.12)', icon: MdLocalShipping   },
  DELIVERED:  { label: 'Delivered',  color: '#10b981', bg: 'rgba(16,185,129,.12)',  icon: MdCheckCircle     },
  CANCELLED:  { label: 'Cancelled',  color: '#ef4444', bg: 'rgba(239,68,68,.12)',   icon: MdCancel          },
};

const STATUS_FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const PAYMENT_LABELS = {
  CASH: 'Cash / COD', EVC_PLUS: 'EVC Plus', TELEBIRR: 'Telebirr',
  ZAAD: 'Zaad', CBE_BIRR: 'CBE Birr', BANK: 'Bank',
};

function parseOrderNotes(notes = '') {
  const result = {};
  if (!notes) return result;
  const parts = notes.split(' | ');
  parts.forEach(p => {
    if (p.startsWith('Address: '))   result.address   = p.slice(9);
    if (p.startsWith('Phone: '))     result.phone     = p.slice(7);
    if (p.startsWith('Ref: '))       result.ref       = p.slice(5);
    if (p.startsWith('Note: '))      result.note      = p.slice(6);
  });
  return result;
}

export default function OnlineOrders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('ALL');
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [selected, setSelected]   = useState(null); // detail modal
  const [updating, setUpdating]   = useState(null); // id being updated
  const [rxViewer, setRxViewer]   = useState(null); // prescription image URL

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await api.get('/shop/admin/orders', { params });
      setOrders(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(1); }, [load]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await api.patch(`/shop/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order marked as ${STATUS_META[newStatus]?.label}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, onlineStatus: newStatus } : o));
      if (selected?.id === orderId) setSelected(s => ({ ...s, onlineStatus: newStatus }));
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const counts = { ALL: pagination.total };

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Online Orders</h1>
          <p className="page-subtitle">Manage customer orders placed through the online shop</p>
        </div>
        <button onClick={() => load(pagination.page)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <MdRefresh style={{ fontSize: 16 }} /> Refresh
        </button>
      </div>

      {/* ── Status filter tabs ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '.4rem', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: 2, scrollbarWidth: 'none' }}>
        {['ALL', ...STATUS_FLOW].map(s => {
          const meta = STATUS_META[s];
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatus(s)}
              style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${active ? (meta?.color || 'var(--primary)') : 'var(--border)'}`, background: active ? (meta?.bg || 'rgba(16,185,129,.12)') : 'transparent', color: active ? (meta?.color || 'var(--primary)') : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {meta && <meta.icon style={{ fontSize: 13 }} />}
              {meta?.label || 'All Orders'}
            </button>
          );
        })}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Prescription</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(6).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(9).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 18, borderRadius: 4, width: j === 2 ? 120 : 80 }} /></td>
                    ))}
                  </tr>
                ))
              : orders.length === 0
              ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>No orders found</td></tr>
              : orders.map(order => {
                  const meta    = STATUS_META[order.onlineStatus] || STATUS_META.PENDING;
                  const notes   = parseOrderNotes(order.notes);
                  const isUpdating = updating === order.id;

                  return (
                    <tr key={order.id}>
                      {/* Invoice */}
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {order.invoiceNo}
                        </span>
                      </td>

                      {/* Customer */}
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                          {order.cashier?.firstName} {order.cashier?.lastName}
                        </div>
                        {(notes.phone || order.cashier?.phone) && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {notes.phone || order.cashier?.phone}
                          </div>
                        )}
                      </td>

                      {/* Items summary */}
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>
                          {order.items?.slice(0, 2).map(item => (
                            <div key={item.id}>{item.medicine?.name} ×{item.quantity}</div>
                          ))}
                          {order.items?.length > 2 && (
                            <div style={{ color: 'var(--text-muted)' }}>+{order.items.length - 2} more</div>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <div style={{ fontSize: 10, color: order.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--warning)', fontWeight: 600, marginTop: 2 }}>
                          {order.paymentStatus}
                        </div>
                      </td>

                      {/* Payment method */}
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                      </td>

                      {/* Prescription */}
                      <td>
                        {order.prescriptionUrl ? (
                          <button onClick={() => setRxViewer(imgUrl(order.prescriptionUrl))}
                            style={{ display: 'flex', alignItems: 'center', gap: '.3rem', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: '3px 8px', color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            <MdDescription style={{ fontSize: 13 }} /> View
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {format(new Date(order.createdAt), 'MMM d, HH:mm')}
                      </td>

                      {/* Status dropdown */}
                      <td>
                        <div style={{ position: 'relative' }}>
                          <select
                            value={order.onlineStatus || 'PENDING'}
                            onChange={e => handleStatusUpdate(order.id, e.target.value)}
                            disabled={isUpdating}
                            style={{ appearance: 'none', background: meta.bg, border: `1px solid ${meta.color}44`, borderRadius: 8, padding: '3px 28px 3px 8px', fontSize: 11, fontWeight: 700, color: meta.color, cursor: 'pointer', opacity: isUpdating ? .6 : 1 }}>
                            {STATUS_FLOW.map(s => (
                              <option key={s} value={s} style={{ background: '#1f2937', color: '#fff' }}>
                                {STATUS_META[s].label}
                              </option>
                            ))}
                          </select>
                          <meta.icon style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: meta.color, pointerEvents: 'none' }} />
                        </div>
                      </td>

                      {/* Detail */}
                      <td>
                        <button onClick={() => setSelected(order)}
                          style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: 11, fontWeight: 600 }}>
                          <MdVisibility style={{ fontSize: 14 }} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            <span>{pagination.total} orders</span>
            <div className="pagination-controls">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => load(p)} className={`page-btn${p === pagination.page ? ' active' : ''}`}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ Order Detail Modal ═══════════════════════════════════════════ */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontWeight: 800 }}>Order Details</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{selected.invoiceNo}</div>
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-ghost btn-icon"><MdClose style={{ fontSize: 18 }} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Status row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  {(() => { const m = STATUS_META[selected.onlineStatus] || STATUS_META.PENDING; return <><m.icon style={{ color: m.color, fontSize: 18 }} /><span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.label}</span></>; })()}
                </div>
                <select
                  value={selected.onlineStatus || 'PENDING'}
                  onChange={e => handleStatusUpdate(selected.id, e.target.value)}
                  disabled={updating === selected.id}
                  className="input"
                  style={{ width: 'auto', fontSize: 13, fontWeight: 700 }}>
                  {STATUS_FLOW.map(s => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>

              {/* Customer info */}
              <div style={{ background: 'var(--surface-light)', borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.25rem' }}>Customer</div>
                {[
                  { icon: MdPerson,      val: `${selected.cashier?.firstName || ''} ${selected.cashier?.lastName || ''}`.trim() },
                  { icon: MdPhone,       val: parseOrderNotes(selected.notes).phone || selected.cashier?.phone },
                  { icon: MdLocationOn,  val: parseOrderNotes(selected.notes).address },
                  { icon: MdPayment,     val: PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod },
                ].filter(r => r.val).map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: 13, color: 'var(--text)' }}>
                    <row.icon style={{ color: 'var(--text-faint)', fontSize: 16, flexShrink: 0 }} />
                    <span>{row.val}</span>
                  </div>
                ))}
                {parseOrderNotes(selected.notes).ref && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '.25rem' }}>
                    Payment ref: <strong style={{ color: 'var(--text)' }}>{parseOrderNotes(selected.notes).ref}</strong>
                  </div>
                )}
                {parseOrderNotes(selected.notes).note && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Note: {parseOrderNotes(selected.notes).note}
                  </div>
                )}
              </div>

              {/* Prescription */}
              {selected.prescriptionUrl && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.5rem' }}>Prescription</div>
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                    <img
                      src={imgUrl(selected.prescriptionUrl)}
                      alt="Prescription"
                      style={{ width: '100%', maxHeight: 280, objectFit: 'contain', background: 'rgba(0,0,0,.2)', display: 'block' }}
                    />
                    <a href={imgUrl(selected.prescriptionUrl)} target="_blank" rel="noreferrer"
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
                      Open Full
                    </a>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.5rem' }}>Items</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {selected.items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: 'var(--surface-light)', borderRadius: 10, padding: '.6rem .85rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(16,185,129,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {item.medicine?.imageUrl
                          ? <img src={imgUrl(item.medicine.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <GiMedicinePills style={{ color: 'var(--primary)', fontSize: 18 }} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.medicine?.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {item.medicine?.form} · Qty: {item.quantity}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(item.totalPrice)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatCurrency(item.sellingPrice)} ea</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: 'var(--primary)', paddingTop: '.75rem', borderTop: '1px solid var(--border)' }}>
                <span>Total</span>
                <span>{formatCurrency(selected.totalAmount)}</span>
              </div>
            </div>

            <div className="modal-footer">
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                Placed {format(new Date(selected.createdAt), 'MMM d, yyyy HH:mm')}
              </div>
              <button onClick={() => setSelected(null)} className="btn btn-secondary btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Prescription Image Viewer ════════════════════════════════════ */}
      {rxViewer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setRxViewer(null)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 700, width: '100%' }}>
            <button onClick={() => setRxViewer(null)}
              style={{ position: 'absolute', top: -12, right: -12, zIndex: 1, background: '#1f2937', border: '1px solid rgba(255,255,255,.1)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <MdClose style={{ fontSize: 18 }} />
            </button>
            <img src={rxViewer} alt="Prescription" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)' }} />
            <a href={rxViewer} target="_blank" rel="noreferrer"
              style={{ display: 'block', textAlign: 'center', marginTop: '.75rem', fontSize: 13, color: 'var(--primary)', fontWeight: 700 }}>
              Open Original
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
