import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MdSearch, MdAdd, MdRemove, MdDelete, MdPrint, MdCheck,
  MdPerson, MdQrCodeScanner, MdClose, MdShoppingCart,
} from 'react-icons/md';
import { GiPill, GiMedicinePills } from 'react-icons/gi';
import { useCart } from '../context/CartContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const imgUrl  = (url) => { if (!url) return null; return url.startsWith('http') ? url : `${BACKEND}${url}`; };

const PAYMENT_METHODS = [
  { id: 'CASH',     label: 'Cash'     },
  { id: 'TELEBIRR', label: 'Telebirr' },
  { id: 'EVC_PLUS', label: 'EVC Plus' },
  { id: 'ZAAD',     label: 'Zaad'     },
  { id: 'CBE_BIRR', label: 'CBE Birr' },
  { id: 'BANK',     label: 'Bank'     },
  { id: 'CARD',     label: 'Card'     },
];

const CAT_COLORS = [
  '#0f4c81', '#1e3a5f', '#1a4731', '#4a1942', '#3b2800',
  '#1a3a4a', '#3b1a1a', '#2a1a3b', '#3a2a00', '#002a3b',
  '#1f3a1f', '#3a1a00',
];

export default function POS() {
  const {
    items, addItem, updateQty, updatePrice, removeItem, clearCart,
    discount, setDiscount,
    paymentMethod, setPaymentMethod,
    subtotal, discountAmount, totalAmount,
  } = useCart();

  const { confirm } = useConfirm();
  const [customer, setCustomer]               = useState(null);
  const [search, setSearch]                   = useState('');
  const [categories, setCategories]           = useState([]);
  const [activeCategory, setActiveCategory]   = useState(null);
  const [shelf, setShelf]                     = useState([]);
  const [shelfLoading, setShelfLoading]       = useState(true);
  const [paidAmount, setPaidAmount]           = useState('');
  const [processing, setProcessing]           = useState(false);
  const [lastReceipt, setLastReceipt]         = useState(null);
  const [showReceipt, setShowReceipt]         = useState(false);
  const [customerSearch, setCustomerSearch]   = useState('');
  const [customers, setCustomers]             = useState([]);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  // flash animation state: medicineId → timestamp
  const [addedFlash, setAddedFlash] = useState({});

  const searchRef = useRef(null);
  const paidRef   = useRef(null);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  const loadShelf = useCallback(async (categoryId = null, q = '') => {
    setShelfLoading(true);
    try {
      const params = { isActive: true, inStock: true, limit: 100 };
      if (categoryId) params.categoryId = categoryId;
      if (q.trim())   params.search     = q.trim();
      const { data } = await api.get('/medicines', { params });
      setShelf(data.data || []);
    } catch {} finally { setShelfLoading(false); }
  }, []);

  useEffect(() => { loadShelf(activeCategory, search); }, []);

  useEffect(() => {
    const t = setTimeout(() => loadShelf(activeCategory, search), 280);
    return () => clearTimeout(t);
  }, [search, activeCategory, loadShelf]);

  const handleBarcodeSearch = async () => {
    if (!search.trim()) return;
    try {
      const { data } = await api.get(`/medicines/barcode/${search.trim()}`);
      if (data.data?.stockQuantity > 0) {
        addItem(data.data, 'PIECE', 1);
        toast.success(`Added ${data.data.name}`, { icon: '💊' });
        setSearch('');
      } else {
        toast.error('Out of stock');
      }
    } catch { toast.error('Medicine not found'); }
  };

  // Click on medicine card → add 1 directly, flash the card
  const handleAddMedicine = (med) => {
    if (med.stockQuantity <= 0) { toast.error('Out of stock'); return; }
    addItem(med, 'PIECE', 1);
    setAddedFlash(prev => ({ ...prev, [med.id]: Date.now() }));
    setTimeout(() => setAddedFlash(prev => { const n = { ...prev }; delete n[med.id]; return n; }), 600);
    toast.success(`${med.name} added`, { icon: '💊', duration: 1200 });
  };

  const searchCustomers = useCallback(async (q) => {
    if (!q.trim()) { setCustomers([]); return; }
    try {
      const { data } = await api.get('/customers', { params: { search: q, limit: 6 } });
      setCustomers(data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(customerSearch), 280);
    return () => clearTimeout(t);
  }, [customerSearch, searchCustomers]);

  const change = parseFloat(paidAmount || 0) - totalAmount;

  const handleCheckout = async () => {
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    const paid = parseFloat(paidAmount);
    if (!paid || paid < 0) { toast.error('Enter paid amount'); paidRef.current?.focus(); return; }
    if (paid < totalAmount && paymentMethod === 'CASH') { toast.error('Insufficient payment'); return; }

    setProcessing(true);
    try {
      const { data } = await api.post('/sales', {
        customerId: customer?.id || null,
        items: items.map(i => ({
          medicineId: i.medicineId, quantity: i.quantity,
          sellingUnit: i.sellingUnit, sellingPrice: i.sellingPrice,
        })),
        paymentMethod, paidAmount: paid, discountAmount,
      });
      setLastReceipt(data.data);
      setShowReceipt(true);
      clearCart();
      setCustomer(null);
      setCustomerSearch('');
      setPaidAmount('');
      toast.success('Sale completed!');
      loadShelf(activeCategory, search);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally { setProcessing(false); }
  };

  const totalCatCount = categories.reduce((s, c) => s + (c._count?.medicines || 0), 0);

  return (
    <div className="pos-grid">

      {/* ══ LEFT — Shelf ══════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', height: '100%', overflow: 'hidden' }}>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <MdSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: 17, pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              className="input"
              placeholder="Search by name, generic name or barcode…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBarcodeSearch()}
              style={{ paddingLeft: 34 }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 2 }}>
                <MdClose style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
          <button onClick={handleBarcodeSearch} className="btn btn-secondary" title="Scan barcode (Enter)">
            <MdQrCodeScanner style={{ fontSize: 18 }} />
          </button>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '.4rem', overflowX: 'auto', flexShrink: 0, paddingBottom: 4, scrollbarWidth: 'thin' }}>
          <CategoryTab
            name="All" icon="💊" count={totalCatCount}
            color="#0f4c81" active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((cat, idx) => (
            <CategoryTab
              key={cat.id}
              name={cat.name} icon={cat.icon || null}
              count={cat._count?.medicines || 0}
              color={CAT_COLORS[idx % CAT_COLORS.length]}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>

        {/* Shelf info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0, paddingBottom: '.4rem', borderBottom: '1px solid var(--border)' }}>
          <GiMedicinePills style={{ color: 'var(--primary)', fontSize: 15 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
            {activeCategory ? (categories.find(c => c.id === activeCategory)?.name || 'Shelf') : 'All Medicines'}
          </span>
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: 'rgba(16,185,129,.12)', color: 'var(--primary)', fontWeight: 700 }}>
            {shelf.length} in stock
          </span>
          {search && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>· "{search}"</span>}
          <span style={{ fontSize: 10, color: 'var(--text-faint)', marginLeft: 'auto' }}>Click card to add</span>
        </div>

        {/* Medicine grid */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '.6rem', alignContent: 'start', paddingRight: 4,
        }}>
          {shelfLoading
            ? Array(12).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 162, borderRadius: 12 }} />)
            : shelf.length === 0
            ? (
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '.75rem' }}>
                  <GiPill style={{ fontSize: 48, color: 'var(--text-faint)', opacity: .25 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                    {search ? `No medicines match "${search}"` : 'No medicines in stock'}
                  </p>
                </div>
              )
            : shelf.map(med => (
                <MedicineCard
                  key={med.id}
                  med={med}
                  flashing={!!addedFlash[med.id]}
                  onSelect={() => handleAddMedicine(med)}
                />
              ))
          }
        </div>
      </div>

      {/* ══ RIGHT — Cart + Checkout ═══════════════════════════════════════════ */}
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
      }}>

        {/* Cart header */}
        <div style={{ padding: '.65rem .85rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <MdShoppingCart style={{ color: 'var(--primary)', fontSize: 17 }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Cart</span>
            {items.length > 0 && (
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>
                {items.length}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <button
              onClick={async () => {
                const ok = await confirm({ title: 'Clear Cart?', message: 'All items will be removed.', confirmText: 'Clear', type: 'cart' });
                if (ok) clearCart();
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: '2px 6px', borderRadius: 5 }}>
              Clear
            </button>
          )}
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '.5rem .6rem', display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          {items.length === 0
            ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', padding: '2.5rem 0', gap: '.5rem' }}>
                  <MdShoppingCart style={{ fontSize: 38, opacity: .12 }} />
                  <p style={{ fontSize: 12 }}>Click a medicine to add</p>
                </div>
              )
            : items.map(item => (
                <CartItem
                  key={`${item.medicineId}-${item.sellingUnit}`}
                  item={item}
                  onUpdateQty={updateQty}
                  onUpdatePrice={updatePrice}
                  onRemove={removeItem}
                />
              ))
          }
        </div>

        {/* Bottom — customer + summary + payment + checkout */}
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '.6rem .7rem', display: 'flex', flexDirection: 'column', gap: '.45rem' }}>

          {/* Customer picker */}
          {customer
            ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 8, padding: '.32rem .6rem' }}>
                  <MdPerson style={{ color: 'var(--primary)', fontSize: 14 }} />
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.firstName} {customer.lastName}</span>
                  <button onClick={() => { setCustomer(null); setCustomerSearch(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', display: 'flex', padding: 1 }}>
                    <MdClose style={{ fontSize: 12 }} />
                  </button>
                </div>
              )
            : (
                <div style={{ position: 'relative' }}>
                  <MdPerson style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: 13 }} />
                  <input className="input"
                    style={{ paddingLeft: 26, fontSize: 11, padding: '.33rem .33rem .33rem 26px' }}
                    placeholder="Customer (optional)…"
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); }}
                    onFocus={() => setShowCustomerDrop(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDrop(false), 200)}
                  />
                  {showCustomerDrop && customers.length > 0 && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, zIndex: 20, overflow: 'hidden', boxShadow: '0 -4px 14px rgba(0,0,0,.3)' }}>
                      {customers.map(c => (
                        <button key={c.id}
                          onClick={() => { setCustomer(c); setCustomerSearch(`${c.firstName || ''} ${c.lastName || ''}`); setShowCustomerDrop(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '.4rem', width: '100%', padding: '.4rem .6rem', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 11 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <MdPerson style={{ color: 'var(--primary)' }} />
                          {c.firstName} {c.lastName} — {c.phone}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
          }

          {/* Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Items ({items.length})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>Discount (ETB)</span>
              <input type="number" min="0" className="input"
                style={{ width: 70, padding: '2px 5px', fontSize: 11, textAlign: 'right' }}
                value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '.3rem', marginTop: '.05rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                style={{
                  padding: '3px 9px', borderRadius: 99,
                  border: `1px solid ${paymentMethod === pm.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: paymentMethod === pm.id ? 'rgba(16,185,129,.15)' : 'transparent',
                  color: paymentMethod === pm.id ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer',
                }}>
                {pm.label}
              </button>
            ))}
          </div>

          {/* Paid amount + quick amounts */}
          <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <input ref={paidRef} type="number" min="0" step="0.01" className="input"
              style={{ flex: 1, fontSize: 15, fontWeight: 700, textAlign: 'right', padding: '.4rem .6rem' }}
              placeholder={`Pay: ${totalAmount.toFixed(2)}`}
              value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[Math.ceil(totalAmount / 50) * 50, Math.ceil(totalAmount / 100) * 100]
                .filter((v, i, a) => a.indexOf(v) === i && v >= totalAmount && v > 0).slice(0, 2)
                .map(amt => (
                  <button key={amt} onClick={() => setPaidAmount(String(amt))}
                    style={{ padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {amt}
                  </button>
                ))}
            </div>
          </div>

          {parseFloat(paidAmount) > 0 && (
            <div style={{ padding: '.35rem .6rem', background: change >= 0 ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', borderRadius: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {change >= 0 ? 'Change' : 'Balance Due'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatCurrency(Math.abs(change))}
              </span>
            </div>
          )}

          {/* Checkout button */}
          <button onClick={handleCheckout} disabled={processing || items.length === 0}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '.65rem', borderRadius: 10 }}>
            {processing
              ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Processing…</>
              : <><MdCheck style={{ fontSize: 17 }} /> Complete Sale — {formatCurrency(totalAmount)}</>
            }
          </button>
        </div>
      </div>

      {/* ══ Receipt Modal ═════════════════════════════════════════════════════ */}
      {showReceipt && lastReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Sale Receipt</h3>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => window.print()} className="btn btn-secondary btn-sm"><MdPrint /> Print</button>
                <button onClick={() => setShowReceipt(false)} className="btn btn-ghost btn-icon btn-sm"><MdClose /></button>
              </div>
            </div>
            <div className="modal-body" id="receipt-content">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-head)' }}>Som Care Pharmacy</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Receipt #: {lastReceipt.invoiceNo}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(lastReceipt.createdAt).toLocaleString()}</div>
              </div>
              <hr className="divider" />
              {lastReceipt.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.medicine?.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.quantity} × {formatCurrency(item.sellingPrice)} ({item.sellingUnit})</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</div>
                </div>
              ))}
              <hr className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>{formatCurrency(lastReceipt.subtotal)}</span></div>
                {parseFloat(lastReceipt.discountAmount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Discount</span><span style={{ color: 'var(--danger)' }}>−{formatCurrency(lastReceipt.discountAmount)}</span></div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 4 }}><span>Total</span><span style={{ color: 'var(--primary)' }}>{formatCurrency(lastReceipt.totalAmount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Paid</span><span>{formatCurrency(lastReceipt.paidAmount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Change</span><span style={{ color: 'var(--success)' }}>{formatCurrency(lastReceipt.changeAmount)}</span></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 11, color: 'var(--text-muted)' }}>Thank you for your purchase!</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes card-pop { 0%{transform:scale(1)} 40%{transform:scale(.93)} 100%{transform:scale(1)} }
        @keyframes modal-in { from{opacity:0;transform:scale(.92) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ── Category tab ──────────────────────────────────────────────────────────────
function CategoryTab({ name, icon, count, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 99,
        border: `1.5px solid ${active ? color : 'var(--border)'}`,
        background: active ? color : 'var(--surface)',
        cursor: 'pointer', outline: 'none', transition: 'all .15s',
        boxShadow: active ? `0 2px 12px ${color}55` : 'none',
        transform: active ? 'translateY(-1px)' : 'none',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}15`; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; } }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{icon || '💊'}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#fff' : 'var(--text)', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: active ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.06)', color: active ? '#fff' : 'var(--text-faint)' }}>
        {count}
      </span>
    </button>
  );
}

// ── Medicine card — click adds directly to cart ───────────────────────────────
function MedicineCard({ med, onSelect, flashing }) {
  const [imgErr, setImgErr] = useState(false);
  const photo    = imgUrl(med.imageUrl);
  const hasPhoto = photo && !imgErr;
  const low      = med.stockQuantity > 0 && med.stockQuantity <= med.minimumStock;
  const inCart   = flashing;

  return (
    <button
      onClick={onSelect}
      title={`${med.name} — click to add`}
      style={{
        background: inCart ? 'rgba(16,185,129,.12)' : 'var(--surface)',
        border: `1px solid ${inCart ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 12, padding: 0,
        textAlign: 'left', cursor: 'pointer', outline: 'none',
        transition: 'border-color .15s, transform .12s, box-shadow .15s, background .15s',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: inCart ? 'card-pop .25s ease' : 'none',
      }}
      onMouseEnter={e => {
        if (!inCart) {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.transform   = 'translateY(-3px)';
          e.currentTarget.style.boxShadow   = '0 6px 20px rgba(16,185,129,.2)';
        }
      }}
      onMouseLeave={e => {
        if (!inCart) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.transform   = 'none';
          e.currentTarget.style.boxShadow   = 'none';
        }
      }}
    >
      {/* Photo / icon area */}
      <div style={{
        height: 82, flexShrink: 0, position: 'relative', overflow: 'hidden',
        background: hasPhoto ? '#000' : 'linear-gradient(135deg,rgba(16,185,129,.12),rgba(6,182,212,.08))',
      }}>
        {hasPhoto
          ? <img src={photo} alt={med.name} onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .92 }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GiPill style={{ color: 'var(--primary)', fontSize: 34, opacity: .45 }} />
            </div>
        }

        {/* Added flash overlay */}
        {inCart && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdCheck style={{ color: '#fff', fontSize: 28 }} />
          </div>
        )}

        <span className={`badge ${low ? 'badge-warning' : 'badge-success'}`}
          style={{ position: 'absolute', top: 5, right: 5, fontSize: 9, fontWeight: 800 }}>
          {med.stockQuantity}
        </span>
        {med.prescriptionRequired && (
          <span style={{ position: 'absolute', top: 5, left: 5, fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(245,158,11,.85)', color: '#fff', letterSpacing: .3 }}>
            Rx
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '.5rem .55rem .55rem', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 28, color: 'var(--text)' }}>
          {med.name}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: .2, marginTop: 1 }}>
          {med.form}{med.strength ? ` · ${med.strength}` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>
            {formatCurrency(med.retailPrice)}
          </span>
          <span style={{ fontSize: 14, color: inCart ? 'var(--primary)' : 'var(--text-faint)', fontWeight: 700 }}>
            {inCart ? '✓' : '+'}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Cart item row ─────────────────────────────────────────────────────────────
function CartItem({ item, onUpdateQty, onUpdatePrice, onRemove }) {
  const [editPrice, setEditPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(item.sellingPrice);

  return (
    <div style={{ background: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: 9, padding: '.45rem .5rem', display: 'flex', gap: '.45rem', alignItems: 'flex-start', flexShrink: 0 }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <GiPill style={{ color: 'var(--primary)', fontSize: 13 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', flexWrap: 'wrap' }}>
          {/* Qty controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={() => onUpdateQty(item.medicineId, item.sellingUnit, item.quantity - 1)}
              style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdRemove style={{ fontSize: 11 }} />
            </button>
            <input type="number" min="0.1" step="0.1" value={item.quantity}
              onChange={e => onUpdateQty(item.medicineId, item.sellingUnit, parseFloat(e.target.value) || 0)}
              style={{ width: 36, height: 18, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', textAlign: 'center', fontSize: 10, outline: 'none' }} />
            <button onClick={() => onUpdateQty(item.medicineId, item.sellingUnit, item.quantity + 1)}
              style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdAdd style={{ fontSize: 11 }} />
            </button>
          </div>
          {/* Editable price */}
          {editPrice
            ? <input type="number" autoFocus value={tempPrice} onChange={e => setTempPrice(e.target.value)}
                onBlur={() => { onUpdatePrice(item.medicineId, item.sellingUnit, tempPrice); setEditPrice(false); }}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                style={{ width: 60, height: 18, background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: 4, color: 'var(--text)', textAlign: 'center', fontSize: 10, outline: 'none' }} />
            : <button onClick={() => { setTempPrice(item.sellingPrice); setEditPrice(true); }}
                title="Click to edit price"
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                {formatCurrency(item.sellingPrice)}
              </button>
          }
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <button onClick={() => onRemove(item.medicineId, item.sellingUnit)}
          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 1, display: 'flex' }}>
          <MdDelete style={{ fontSize: 13 }} />
        </button>
        <div style={{ fontSize: 11, fontWeight: 700 }}>{formatCurrency(item.sellingPrice * item.quantity)}</div>
      </div>
    </div>
  );
}
