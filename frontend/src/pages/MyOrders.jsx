import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdReceiptLong, MdExpandMore, MdExpandLess, MdShoppingBag, MdArrowBack } from 'react-icons/md';
import { GiPill } from 'react-icons/gi';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
  COMPLETED: { bg: 'rgba(16,185,129,.12)', color: '#10b981', label: 'Completed' },
  CANCELLED:  { bg: 'rgba(239,68,68,.12)',  color: '#ef4444',  label: 'Cancelled' },
  RETURNED:   { bg: 'rgba(245,158,11,.12)', color: '#f59e0b',  label: 'Returned' },
};
const PAY_STYLE = {
  PAID:    { color: '#10b981', label: 'Paid' },
  PENDING: { color: '#f59e0b', label: 'Pending' },
  PARTIAL: { color: '#06b6d4', label: 'Partial' },
};

export default function MyOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/shop/orders/mine')
      .then(r => setOrders(r.data.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(p => p === id ? null : id);

  // Parse notes to extract delivery info
  const parseNote = (note) => {
    if (!note) return {};
    const parts = note.replace('[ONLINE_ORDER]', '').split('|').map(s => s.trim());
    const result = {};
    parts.forEach(p => {
      if (p.startsWith('Address:')) result.address = p.replace('Address:', '').trim();
      else if (p.startsWith('Phone:')) result.phone = p.replace('Phone:', '').trim();
      else if (p.startsWith('Ref:')) result.ref = p.replace('Ref:', '').trim();
      else if (p.startsWith('Note:')) result.note = p.replace('Note:', '').trim();
    });
    return result;
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '2rem' }}>
        <Link to="/shop" style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontSize: 13 }}>
          <MdArrowBack style={{ fontSize: 20 }} />
        </Link>
        <div>
          <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 900, color: '#fff' }}>My Orders</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: '.1rem' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'rgba(255,255,255,.3)' }}>
          <MdShoppingBag style={{ fontSize: 64, opacity: .15, marginBottom: '1rem' }} />
          <p style={{ fontSize: 15, marginBottom: '1rem' }}>No orders yet</p>
          <Link to="/shop" style={{ display: 'inline-block', padding: '.65rem 1.5rem', borderRadius: 10, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            Start Shopping
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {orders.map(order => {
            const info    = parseNote(order.notes);
            const status  = STATUS_STYLE[order.status]  || STATUS_STYLE.COMPLETED;
            const payInfo = PAY_STYLE[order.paymentStatus] || PAY_STYLE.PENDING;
            const isOpen  = expanded === order.id;

            return (
              <div key={order.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${isOpen ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,.07)'}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color .15s' }}>
                {/* Order header row */}
                <button
                  onClick={() => toggle(order.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MdReceiptLong style={{ color: '#10b981', fontSize: 20 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{order.invoiceNo}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: status.bg, color: status.color, fontWeight: 700 }}>{status.label}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,255,255,.05)', color: payInfo.color, fontWeight: 700 }}>Payment: {payInfo.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: '.2rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                      <span>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{formatCurrency(order.totalAmount)}</div>
                    {isOpen ? <MdExpandLess style={{ color: 'rgba(255,255,255,.3)', fontSize: 18 }} /> : <MdExpandMore style={{ color: 'rgba(255,255,255,.3)', fontSize: 18 }} />}
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,.05)' }}>
                    {/* Delivery info */}
                    {(info.address || info.phone) && (
                      <div style={{ marginTop: '.9rem', background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '.75rem 1rem', fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.7 }}>
                        <div style={{ fontWeight: 700, color: 'rgba(255,255,255,.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.3rem' }}>Delivery Info</div>
                        {info.address && <div>📍 {info.address}</div>}
                        {info.phone   && <div>📞 {info.phone}</div>}
                        {info.ref     && <div>🔖 Ref: {info.ref}</div>}
                      </div>
                    )}

                    {/* Items */}
                    <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                      {order.items?.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem .75rem', background: 'rgba(255,255,255,.03)', borderRadius: 9 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <GiPill style={{ color: '#10b981', fontSize: 14 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.medicine?.name}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>{parseFloat(item.quantity)} × {formatCurrency(item.sellingPrice)}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', flexShrink: 0 }}>{formatCurrency(item.totalPrice)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Payment method */}
                    <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
                      <span>Payment method: <strong style={{ color: '#fff' }}>{order.paymentMethod?.replace('_', ' ')}</strong></span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>Total: {formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
