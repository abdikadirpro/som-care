import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MdHealthAndSafety, MdLocalShipping, MdVerified, MdSupportAgent,
  MdArrowForward, MdMedication,
} from 'react-icons/md';
import { GiMedicinePills } from 'react-icons/gi';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';

const PAYMENT_METHODS = [
  { name: 'EVC Plus',   color: '#e53e3e', emoji: '🔴' },
  { name: 'Telebirr',  color: '#f6ad55', emoji: '🟠' },
  { name: 'Zaad',      color: '#68d391', emoji: '🟢' },
  { name: 'CBE Birr',  color: '#63b3ed', emoji: '🔵' },
  { name: 'Cash / COD',color: '#10b981', emoji: '💵' },
  { name: 'Bank',      color: '#b794f4', emoji: '🏦' },
];

const FEATURES = [
  { icon: MdMedication,     title: 'Wide Selection',   desc: '500+ medicines across all categories, always in stock.' },
  { icon: MdVerified,       title: 'Quality Assured',  desc: 'Every product is verified and sourced from certified suppliers.' },
  { icon: MdLocalShipping,  title: 'Fast Delivery',    desc: 'Same-day delivery within the city, next-day nationwide.' },
  { icon: MdSupportAgent,   title: '24/7 Support',     desc: 'Pharmacists available around the clock for your questions.' },
];

const STEPS = [
  { num: '01', title: 'Browse Shop',      desc: 'Search medicines by name or category.' },
  { num: '02', title: 'Add to Cart',      desc: 'Select the quantity you need.' },
  { num: '03', title: 'Checkout & Pay',   desc: 'Choose EVC, Telebirr, Zaad, or Cash.' },
  { num: '04', title: 'Get Delivered',    desc: 'Receive at your doorstep or pick up.' },
];

export default function Landing() {
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats]         = useState({ medicines: 0, categories: 0 });

  useEffect(() => {
    api.get('/shop/medicines?limit=16').then(r => setMedicines(r.data.data || [])).catch(() => {});
    Promise.all([
      api.get('/shop/medicines?limit=1'),
      api.get('/shop/categories'),
    ]).then(([m, c]) => {
      setStats({ medicines: m.data.pagination?.total || 0, categories: (c.data.data || []).length });
    }).catch(() => {});
  }, []);

  return (
    <div style={{ color: '#fff', fontFamily: 'var(--font-body,DM Sans,sans-serif)' }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '92vh',
        background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1f0d 50%, #0a101f 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '4rem 1.5rem',
      }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          {/* Left text */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 99, padding: '.3rem .9rem', fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: '1.5rem' }}>
              <MdHealthAndSafety style={{ fontSize: 14 }} />
              Trusted Pharmacy — Online & In-Store
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.25rem', fontFamily: 'var(--font-head,IBM Plex Sans,sans-serif)' }}>
              Your Health,{' '}
              <span style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Our Priority
              </span>
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: '2rem', maxWidth: 460 }}>
              Order medicines online from Som Care Pharmacy. Fast delivery across Somalia. Pay with EVC Plus, Telebirr, Zaad, or cash on delivery.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/shop"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.8rem 1.75rem', borderRadius: 12, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(16,185,129,.4)', transition: 'all .15s' }}>
                Shop Now <MdArrowForward style={{ fontSize: 18 }} />
              </Link>
              <Link to="/register"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.8rem 1.75rem', borderRadius: 12, background: 'rgba(255,255,255,.07)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.12)' }}>
                Create Account
              </Link>
            </div>
          </div>

          {/* Right visual */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 320, height: 320 }}>
              {/* Central circle */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,.15), rgba(6,182,212,.1))', border: '1px solid rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GiMedicinePills style={{ fontSize: 120, color: '#10b981', opacity: .9 }} />
              </div>
              {/* Floating cards */}
              {[
                { label: '500+ Medicines', icon: '💊', top: '5%', right: '-10%', bg: '#1a2e1a' },
                { label: 'Same Day Delivery', icon: '🚚', bottom: '10%', left: '-15%', bg: '#1a2033' },
                { label: '24/7 Support', icon: '💬', top: '35%', right: '-20%', bg: '#1f1a33' },
              ].map(card => (
                <div key={card.label} style={{ position: 'absolute', top: card.top, bottom: card.bottom, left: card.left, right: card.right, background: card.bg, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '.5rem .85rem', display: 'flex', alignItems: 'center', gap: '.45rem', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,.3)', animation: `float${card.label.replace(/\W/g,'')} 3s ease-in-out infinite` }}>
                  <span style={{ fontSize: 18 }}>{card.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.9)' }}>{card.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ═════════════════════════════════════════════════════ */}
      <section style={{ background: 'rgba(16,185,129,.05)', borderTop: '1px solid rgba(16,185,129,.1)', borderBottom: '1px solid rgba(16,185,129,.1)', padding: '1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', textAlign: 'center' }}>
          {[
            { value: `${stats.medicines}+`, label: 'Medicines' },
            { value: `${stats.categories}+`, label: 'Categories' },
            { value: '1,000+',  label: 'Happy Customers' },
            { value: '24/7',    label: 'Support' },
            { value: 'Fast',    label: 'Delivery' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color: '#10b981' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.5rem' }}>Why Choose Us</div>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900 }}>The Smarter Way to Get Your Medicines</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.25rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: '1.5rem', transition: 'border-color .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <f.icon style={{ fontSize: 24, color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: '.4rem' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ MEDICINE SHOWCASE ═════════════════════════════════════════════ */}
      <section style={{ padding: '1rem 1.5rem 5rem', background: 'linear-gradient(180deg,transparent,rgba(16,185,129,.03),transparent)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.4rem' }}>Our Products</div>
              <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 900, marginBottom: '.35rem' }}>Featured Medicines</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', margin: 0 }}>High-quality, in-stock medicines ready for delivery</p>
            </div>
            <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: 13, fontWeight: 700, color: '#10b981', textDecoration: 'none', whiteSpace: 'nowrap', padding: '.55rem 1.1rem', borderRadius: 10, border: '1px solid rgba(16,185,129,.3)', background: 'rgba(16,185,129,.07)' }}>
              View All <MdArrowForward style={{ fontSize: 16 }} />
            </Link>
          </div>

          {medicines.length === 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem' }}>
              {Array(8).fill(0).map((_, i) => (
                <div key={i} style={{ height: 280, borderRadius: 16, background: 'rgba(255,255,255,.03)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem' }}>
              {medicines.map((med, i) => (
                <MedicineCard key={med.id} med={med} idx={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ HOW TO ORDER ══════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg,#0a1a0a,#0a0f1a)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.5rem' }}>Simple Process</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900 }}>How to Order Online</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem', position: 'relative' }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(16,185,129,.2),rgba(6,182,212,.15))', border: '2px solid rgba(16,185,129,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: 20, fontWeight: 900, color: '#10b981' }}>
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: 32, left: 'calc(50% + 40px)', right: 'calc(-50% + 40px)', height: 2, background: 'rgba(16,185,129,.2)', display: 'none' }} className="step-line" />
                )}
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: '.4rem' }}>{step.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/shop"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.85rem 2rem', borderRadius: 12, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(16,185,129,.35)' }}>
              Start Shopping <MdArrowForward style={{ fontSize: 18 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ PAYMENT METHODS ═══════════════════════════════════════════════ */}
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.5rem' }}>Flexible Payments</div>
          <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900, marginBottom: '2rem' }}>Pay Your Way</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            {PAYMENT_METHODS.map(pm => (
              <div key={pm.name} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.7rem 1.25rem', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12 }}>
                <span style={{ fontSize: 22 }}>{pm.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{pm.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════════════════ */}
      <section style={{ padding: '2rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(6,182,212,.1))', border: '1px solid rgba(16,185,129,.2)', borderRadius: 20, padding: '2.5rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 900, marginBottom: '.75rem' }}>Ready to order?</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', marginBottom: '1.5rem' }}>Create a free account and start ordering medicines online today.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register"
              style={{ padding: '.8rem 2rem', borderRadius: 12, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 20px rgba(16,185,129,.35)' }}>
              Create Free Account
            </Link>
            <Link to="/shop"
              style={{ padding: '.8rem 2rem', borderRadius: 12, background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,.12)' }}>
              Browse Shop
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes floatcard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: .4; }
          50% { opacity: .8; }
        }
        @media (max-width: 640px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* Pastel gradient palettes for image-less medicines */
const CARD_GRADIENTS = [
  'linear-gradient(135deg,#0d2e1a,#0a1f2e)',
  'linear-gradient(135deg,#1a0d2e,#0d1a2e)',
  'linear-gradient(135deg,#2e1a0d,#1a2e0d)',
  'linear-gradient(135deg,#0d1a2e,#1a0d2e)',
  'linear-gradient(135deg,#1a2e0d,#2e1a0d)',
  'linear-gradient(135deg,#0d2e2e,#0a1f1f)',
];

function MedicineCard({ med, idx = 0 }) {
  const [imgError, setImgError] = useState(false);
  const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
  const initials = med.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <Link
      to="/shop"
      style={{
        textDecoration: 'none',
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all .2s',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(16,185,129,.4)';
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,.15)';
        e.currentTarget.querySelector('.shop-btn').style.opacity = '1';
        e.currentTarget.querySelector('.shop-btn').style.transform = 'translateY(0)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.querySelector('.shop-btn').style.opacity = '0';
        e.currentTarget.querySelector('.shop-btn').style.transform = 'translateY(6px)';
      }}
    >
      {/* ── Image area ── */}
      <div style={{ position: 'relative', width: '100%', height: 170, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {med.imageUrl && !imgError ? (
          <img
            src={med.imageUrl}
            alt={med.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <>
            {/* Decorative rings */}
            <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', border: '1px solid rgba(16,185,129,.12)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', border: '1px solid rgba(16,185,129,.18)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '2px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GiMedicinePills style={{ color: '#10b981', fontSize: 28 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,.35)', letterSpacing: 1 }}>{initials}</span>
            </div>
          </>
        )}

        {/* Featured badge */}
        {med.featured && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'linear-gradient(90deg,#f59e0b,#f97316)', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99, boxShadow: '0 2px 8px rgba(245,158,11,.5)' }}>
            ★ Featured
          </div>
        )}

        {/* Stock badge */}
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', color: '#10b981', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 99 }}>
          {med.stockQuantity} left
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ padding: '.9rem .95rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
        {med.category && (
          <span style={{ fontSize: 9, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: .8 }}>
            {med.category.name}
          </span>
        )}

        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {med.name}
        </div>

        {(med.form || med.strength) && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.38)', lineHeight: 1.4 }}>
            {[med.form, med.strength].filter(Boolean).join(' · ')}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>
            {formatCurrency(med.retailPrice)}
          </div>
        </div>

        {/* Shop button — appears on hover */}
        <div
          className="shop-btn"
          style={{ marginTop: '.3rem', padding: '.45rem', borderRadius: 9, background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.25)', color: '#10b981', fontWeight: 700, fontSize: 11, textAlign: 'center', opacity: 0, transform: 'translateY(6px)', transition: 'all .2s' }}
        >
          Shop Now →
        </div>
      </div>
    </Link>
  );
}
