import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSearch, MdClose, MdAdd, MdRemove, MdDelete,
  MdShoppingCart, MdArrowForward, MdCheck, MdUpload,
  MdDescription, MdWarning,
} from 'react-icons/md';
import { GiPill, GiMedicinePills } from 'react-icons/gi';
import { useAuth } from '../context/AuthContext';
import { useShopCart } from '../context/ShopCartContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl = (url) => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${BACKEND}${url}`;
};

const PAYMENT_METHODS = [
  { id: 'EVC_PLUS',  label: 'EVC Plus',        emoji: '🔴', number: '252-61-xxx-xxxx' },
  { id: 'TELEBIRR',  label: 'Telebirr',         emoji: '🟠', number: '*127# then pay'  },
  { id: 'ZAAD',      label: 'Zaad',             emoji: '🟢', number: '*136# then pay'  },
  { id: 'CBE_BIRR',  label: 'CBE Birr',         emoji: '🔵', number: '*847# then pay'  },
  { id: 'CASH',      label: 'Cash on Delivery',  emoji: '💵', number: null              },
];

export default function Shop() {
  const { user } = useAuth();
  const { items, addItem, updateQty, removeItem, clearCart, total, count } = useShopCart();
  const navigate = useNavigate();

  const [medicines, setMedicines]       = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeCat, setActiveCat]       = useState(null);
  const [pagination, setPagination]     = useState({ total: 0, page: 1, pages: 1 });
  const [cartOpen, setCartOpen]         = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Checkout form state
  const [form, setForm] = useState({ address: '', phone: '', paymentMethod: 'CASH', reference: '', notes: '' });
  const [placing, setPlacing]       = useState(false);
  const [ordered, setOrdered]       = useState(null);

  // Prescription upload state
  const [rxFile, setRxFile]         = useState(null);         // File object
  const [rxPreview, setRxPreview]   = useState(null);         // local object URL
  const [rxUploading, setRxUploading] = useState(false);
  const rxInputRef = useRef(null);

  const rxRequired = items.some(i => i.prescriptionRequired);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 24 };
      if (search.trim()) params.search = search.trim();
      if (activeCat)     params.categoryId = activeCat;
      const { data } = await api.get('/shop/medicines', { params });
      setMedicines(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {} finally { setLoading(false); }
  }, [search, activeCat]);

  useEffect(() => {
    api.get('/shop/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  // Clean up object URL when component unmounts or file changes
  useEffect(() => {
    return () => { if (rxPreview) URL.revokeObjectURL(rxPreview); };
  }, [rxPreview]);

  const handleAddToCart = (med) => {
    addItem(med);
    toast.success(`Added ${med.name}`, { icon: '💊' });
    setCartOpen(true);
  };

  const handleRxFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    if (rxPreview) URL.revokeObjectURL(rxPreview);
    setRxFile(file);
    setRxPreview(URL.createObjectURL(file));
  };

  const handleCheckout = () => {
    if (!user) { toast.error('Please login to checkout'); navigate('/login'); return; }
    if (user.role !== 'CUSTOMER') { toast.error('Please use a customer account to place orders'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    setCheckoutOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (!form.address.trim()) { toast.error('Delivery address is required'); return; }
    if (rxRequired && !rxFile) { toast.error('Please upload your prescription'); return; }

    setPlacing(true);
    try {
      // Upload prescription first if needed
      let prescriptionUrl = null;
      if (rxRequired && rxFile) {
        setRxUploading(true);
        const fd = new FormData();
        fd.append('prescription', rxFile);
        const { data: upData } = await api.post('/shop/upload-prescription', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        prescriptionUrl = upData.data?.url;
        setRxUploading(false);
      }

      const { data } = await api.post('/shop/orders', {
        items: items.map(i => ({ medicineId: i.medicineId, quantity: i.quantity })),
        paymentMethod:    form.paymentMethod,
        deliveryAddress:  form.address,
        phone:            form.phone,
        paymentReference: form.reference,
        notes:            form.notes,
        prescriptionUrl,
      });

      setOrdered(data.data);
      clearCart();
      setRxFile(null);
      setRxPreview(null);
      setCheckoutOpen(false);
      toast.success('Order placed successfully! 🎉');
    } catch (err) {
      setRxUploading(false);
      toast.error(err.response?.data?.message || 'Order failed');
    } finally { setPlacing(false); }
  };

  const selectedPayment = PAYMENT_METHODS.find(p => p.id === form.paymentMethod);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem', minHeight: '80vh' }}>

      {/* ── Heading ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: '#fff', marginBottom: '.25rem' }}>Medicine Shop</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)' }}>Browse our full range of quality medicines — all in stock and ready to order.</p>
      </div>

      {/* ── Search + Cart button ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)', fontSize: 18 }} />
          <input
            className="input"
            placeholder="Search medicines by name or generic…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', display: 'flex' }}>
              <MdClose style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
        <button
          onClick={() => setCartOpen(true)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.55rem 1rem', borderRadius: 10, background: count > 0 ? '#10b981' : 'rgba(255,255,255,.07)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          <MdShoppingCart style={{ fontSize: 18 }} />
          {count > 0 ? `Cart (${count})` : 'Cart'}
        </button>
      </div>

      {/* ── Category chips ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '.4rem', overflowX: 'auto', marginBottom: '1.5rem', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {[{ id: null, name: 'All', icon: '💊', _count: { medicines: pagination.total } }, ...categories].map(cat => (
          <button key={cat.id ?? 'all'}
            onClick={() => setActiveCat(cat.id)}
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 99,
              border: `1.5px solid ${activeCat === cat.id ? '#10b981' : 'rgba(255,255,255,.1)'}`,
              background: activeCat === cat.id ? 'rgba(16,185,129,.15)' : 'transparent',
              color: activeCat === cat.id ? '#10b981' : 'rgba(255,255,255,.6)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
            <span style={{ fontSize: 13 }}>{cat.icon || '💊'}</span>
            {cat.name}
            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99, background: activeCat === cat.id ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,.06)', color: 'inherit' }}>
              {cat._count?.medicines ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── Medicine grid ─────────────────────────────────────────────────── */}
      {loading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '1rem' }}>
            {Array(12).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />)}
          </div>
        : medicines.length === 0
        ? <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'rgba(255,255,255,.3)' }}>
            <GiPill style={{ fontSize: 56, opacity: .2, marginBottom: '1rem' }} />
            <p style={{ fontSize: 14 }}>{search ? `No results for "${search}"` : 'No medicines available'}</p>
          </div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(185px,1fr))', gap: '1rem' }}>
            {medicines.map(med => (
              <ShopMedicineCard key={med.id} med={med} onAdd={() => handleAddToCart(med)} />
            ))}
          </div>
      }

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '2rem' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${p === pagination.page ? '#10b981' : 'rgba(255,255,255,.1)'}`, background: p === pagination.page ? '#10b981' : 'transparent', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ══ Cart Drawer ═══════════════════════════════════════════════════ */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 420, background: '#111827', borderLeft: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', animation: 'slideRight .22s ease' }}>
            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <MdShoppingCart style={{ color: '#10b981', fontSize: 20 }} />
                <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Cart</span>
                {count > 0 && <span style={{ background: '#10b981', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '1px 7px' }}>{count}</span>}
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                {items.length > 0 && (
                  <button onClick={() => clearCart()} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Clear</button>
                )}
                <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'flex' }}>
                  <MdClose style={{ fontSize: 20 }} />
                </button>
              </div>
            </div>

            {/* Rx warning banner */}
            {rxRequired && (
              <div style={{ padding: '.65rem 1.25rem', background: 'rgba(245,158,11,.08)', borderBottom: '1px solid rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                <MdWarning style={{ fontSize: 16, flexShrink: 0 }} />
                Some items require a prescription — you'll upload it at checkout.
              </div>
            )}

            {/* Cart items */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem' }}>
              {items.length === 0
                ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,.25)', gap: '.75rem' }}>
                    <MdShoppingCart style={{ fontSize: 56, opacity: .15 }} />
                    <p style={{ fontSize: 13 }}>Your cart is empty</p>
                    <button onClick={() => setCartOpen(false)} className="btn btn-secondary btn-sm">Continue Shopping</button>
                  </div>
                : items.map(item => (
                    <CartRow key={item.medicineId} item={item} onQty={updateQty} onRemove={removeItem} />
                  ))
              }
            </div>

            {/* Cart footer */}
            {items.length > 0 && (
              <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,.07)', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.6)' }}>Subtotal ({count} items)</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{formatCurrency(total)}</span>
                </div>
                <button onClick={handleCheckout}
                  style={{ width: '100%', padding: '.75rem', borderRadius: 12, background: '#10b981', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', boxShadow: '0 4px 16px rgba(16,185,129,.35)' }}>
                  Checkout <MdArrowForward style={{ fontSize: 18 }} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ Checkout Modal ════════════════════════════════════════════════ */}
      {checkoutOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={() => setCheckoutOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: '#111827', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', animation: 'confirm-pop .2s ease' }}>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#111827', zIndex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Checkout</h3>
              <button onClick={() => setCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', display: 'flex' }}>
                <MdClose style={{ fontSize: 20 }} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Order summary */}
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '1rem' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.6rem' }}>Order Summary</div>
                {items.map(i => (
                  <div key={i.medicineId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: '.35rem', color: 'rgba(255,255,255,.7)', gap: '.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                      {i.name} × {i.quantity}
                      {i.prescriptionRequired && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 4, padding: '1px 5px' }}>Rx</span>
                      )}
                    </span>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>{formatCurrency(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, marginTop: '.6rem', paddingTop: '.6rem', borderTop: '1px solid rgba(255,255,255,.06)', color: '#10b981' }}>
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* ── PRESCRIPTION UPLOAD ── */}
              {rxRequired && (
                <div style={{ background: 'rgba(245,158,11,.06)', border: `1px solid ${rxFile ? 'rgba(16,185,129,.3)' : 'rgba(245,158,11,.25)'}`, borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <MdDescription style={{ color: '#f59e0b', fontSize: 18, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Prescription Required <span style={{ color: '#ef4444' }}>*</span></div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 1 }}>One or more items need a doctor's prescription. Upload a clear photo or scan.</div>
                    </div>
                  </div>

                  {/* File input trigger */}
                  <input ref={rxInputRef} type="file" accept="image/*" onChange={handleRxFileChange} style={{ display: 'none' }} />

                  {rxPreview ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(16,185,129,.3)' }}>
                      <img src={rxPreview} alt="Prescription preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: 'rgba(0,0,0,.3)', display: 'block' }} />
                      <button
                        onClick={() => { setRxFile(null); URL.revokeObjectURL(rxPreview); setRxPreview(null); if (rxInputRef.current) rxInputRef.current.value = ''; }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.7)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <MdClose style={{ fontSize: 14 }} />
                      </button>
                      <div style={{ padding: '.5rem .75rem', background: 'rgba(16,185,129,.1)', fontSize: 11, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                        <MdCheck style={{ fontSize: 14 }} /> Prescription ready to upload
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => rxInputRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.75rem', borderRadius: 10, border: '1.5px dashed rgba(245,158,11,.4)', background: 'rgba(245,158,11,.05)', color: '#f59e0b', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s', width: '100%' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,.05)'}>
                      <MdUpload style={{ fontSize: 20 }} />
                      Upload Prescription (JPG / PNG)
                    </button>
                  )}
                </div>
              )}

              {/* Delivery info */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', display: 'block', marginBottom: '.4rem' }}>Delivery Address <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea className="input" rows={2} placeholder="Your full delivery address…"
                  value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  style={{ resize: 'none', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', display: 'block', marginBottom: '.4rem' }}>Phone Number</label>
                <input className="input" placeholder="+252 61 000 0000"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>

              {/* Payment method */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', display: 'block', marginBottom: '.5rem' }}>Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.id} onClick={() => setForm(f => ({ ...f, paymentMethod: pm.id }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem .75rem', borderRadius: 10, border: `1.5px solid ${form.paymentMethod === pm.id ? '#10b981' : 'rgba(255,255,255,.1)'}`, background: form.paymentMethod === pm.id ? 'rgba(16,185,129,.12)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                      <span style={{ fontSize: 18 }}>{pm.emoji}</span> {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment instructions */}
              {selectedPayment?.number && (
                <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginBottom: '.4rem' }}>
                    {selectedPayment.emoji} How to pay via {selectedPayment.label}:
                  </div>
                  <ol style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', paddingLeft: '1.1rem', lineHeight: 2 }}>
                    <li>Dial <strong style={{ color: '#fff' }}>{selectedPayment.number}</strong></li>
                    <li>Send <strong style={{ color: '#10b981' }}>{formatCurrency(total)}</strong> to merchant: <strong style={{ color: '#fff' }}>+252 61 000 0000</strong></li>
                    <li>Enter the transaction reference below</li>
                  </ol>
                  <input className="input" placeholder="Transaction reference / code" style={{ marginTop: '.5rem', fontSize: 13 }}
                    value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
                </div>
              )}

              {form.paymentMethod === 'CASH' && (
                <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12, padding: '.85rem 1rem', fontSize: 12, color: 'rgba(255,255,255,.7)', lineHeight: 1.65 }}>
                  💵 <strong>Cash on Delivery</strong> — Pay when your order arrives. Our delivery team will collect payment.
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.6)', display: 'block', marginBottom: '.4rem' }}>Notes (optional)</label>
                <input className="input" placeholder="Any special instructions…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {/* Place order button */}
              <button onClick={handlePlaceOrder} disabled={placing || rxUploading}
                style={{ width: '100%', padding: '.8rem', borderRadius: 12, background: '#10b981', color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: placing ? 'default' : 'pointer', opacity: placing ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', boxShadow: '0 4px 16px rgba(16,185,129,.35)' }}>
                {rxUploading
                  ? <><Spinner /> Uploading prescription…</>
                  : placing
                  ? <><Spinner /> Placing Order…</>
                  : <><MdCheck style={{ fontSize: 18 }} /> Place Order — {formatCurrency(total)}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Order Success Modal ═══════════════════════════════════════════ */}
      {ordered && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, width: '100%', maxWidth: 400, padding: '2rem', textAlign: 'center', animation: 'confirm-pop .22s ease' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '2px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <MdCheck style={{ fontSize: 36, color: '#10b981' }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: '.5rem' }}>Order Placed!</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: '1rem', lineHeight: 1.65 }}>
              Your order has been received. We'll process it shortly and get it delivered to you.
            </p>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '.75rem', fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
              Order: <strong style={{ color: '#10b981' }}>{ordered.invoiceNo}</strong>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button onClick={() => { setOrdered(null); navigate('/my-orders'); }}
                style={{ flex: 1, padding: '.65rem', borderRadius: 10, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                View My Orders
              </button>
              <button onClick={() => setOrdered(null)}
                style={{ flex: 1, padding: '.65rem', borderRadius: 10, background: 'rgba(255,255,255,.07)', color: '#fff', fontWeight: 700, fontSize: 13, border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer' }}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideRight  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin        { to   { transform: rotate(360deg); } }
        @keyframes confirm-pop { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar       { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}

/* ── Spinner helper ─────────────────────────────────────────────────────── */
function Spinner() {
  return <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block', flexShrink: 0 }} />;
}

/* ── Shop medicine card ─────────────────────────────────────────────────── */
function ShopMedicineCard({ med, onAdd }) {
  const [imgErr, setImgErr] = useState(false);
  const photo   = imgUrl(med.imageUrl);
  const initials = med.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div
      style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all .18s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,.35)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>

      {/* Image area */}
      <div style={{ position: 'relative', width: '100%', height: 150, background: 'linear-gradient(135deg,#0d2e1a,#0a1f2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
        {photo && !imgErr
          ? <img src={photo} alt={med.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <>
              <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px solid rgba(16,185,129,.12)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              <div style={{ position: 'absolute', width: 65, height: 65, borderRadius: '50%', border: '1px solid rgba(16,185,129,.18)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.2rem', zIndex: 1 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '2px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GiMedicinePills style={{ color: '#10b981', fontSize: 22 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,.3)', letterSpacing: 1 }}>{initials}</span>
              </div>
            </>
        }

        {/* Stock badge */}
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', color: '#10b981', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>
          {med.stockQuantity} left
        </div>

        {/* Featured star */}
        {med.featured && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(90deg,#f59e0b,#f97316)', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 99 }}>★ Featured</div>
        )}

        {/* Rx badge */}
        {med.prescriptionRequired && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(239,68,68,.85)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, letterSpacing: .3 }}>
            Rx Required
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '.8rem .9rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
        {med.category && (
          <span style={{ fontSize: 9, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: .8 }}>
            {med.category.icon} {med.category.name}
          </span>
        )}
        <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 30 }}>
          {med.name}
        </div>
        {(med.form || med.strength) && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>
            {[med.form, med.strength].filter(Boolean).join(' · ')}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '.5rem' }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>{formatCurrency(med.retailPrice)}</span>
          <button onClick={onAdd}
            style={{ width: 34, height: 34, borderRadius: 10, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(16,185,129,.35)', transition: 'transform .1s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <MdAdd style={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Cart row ───────────────────────────────────────────────────────────── */
function CartRow({ item, onQty, onRemove }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '.75rem', display: 'flex', gap: '.75rem', alignItems: 'center', marginBottom: '.5rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(16,185,129,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <GiPill style={{ color: '#10b981', fontSize: 18 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
          {item.name}
          {item.prescriptionRequired && (
            <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>Rx</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>{formatCurrency(item.price)} each</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.4rem' }}>
          <button onClick={() => onQty(item.medicineId, item.quantity - 1)}
            style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: 'rgba(255,255,255,.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdRemove style={{ fontSize: 13 }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
          <button onClick={() => onQty(item.medicineId, item.quantity + 1)}
            style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid rgba(16,185,129,.3)', background: 'rgba(16,185,129,.1)', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdAdd style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.4rem' }}>
        <button onClick={() => onRemove(item.medicineId)}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
          <MdDelete style={{ fontSize: 15 }} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>{formatCurrency(item.price * item.quantity)}</span>
      </div>
    </div>
  );
}
