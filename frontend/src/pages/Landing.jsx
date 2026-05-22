import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MdHealthAndSafety, MdLocalShipping, MdVerified, MdSupportAgent,
  MdArrowForward, MdMedication, MdStar, MdShield, MdFlashOn,
  MdPhone, MdCheckCircle, MdLocationOn,
} from 'react-icons/md';
import { GiMedicinePills, GiPill, GiHealthPotion } from 'react-icons/gi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';

/* ─── Static data ─────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { label: 'Tablets',    emoji: '💊', color: '#10b981', bg: 'rgba(16,185,129,.12)'  },
  { label: 'Capsules',   emoji: '💉', color: '#06b6d4', bg: 'rgba(6,182,212,.12)'   },
  { label: 'Syrups',     emoji: '🧴', color: '#f59e0b', bg: 'rgba(245,158,11,.12)'  },
  { label: 'Creams',     emoji: '🧼', color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
  { label: 'Vitamins',   emoji: '⚡', color: '#f97316', bg: 'rgba(249,115,22,.12)'  },
  { label: 'Baby Care',  emoji: '👶', color: '#ec4899', bg: 'rgba(236,72,153,.12)'  },
];

const FEATURES = [
  {
    icon: MdMedication,
    title: 'Wide Selection',
    desc: '500+ medicines across all categories, always in stock.',
    accent: '#10b981',
  },
  {
    icon: MdVerified,
    title: 'Quality Assured',
    desc: 'Every product verified and sourced from certified suppliers.',
    accent: '#06b6d4',
  },
  {
    icon: MdLocalShipping,
    title: 'Fast Delivery',
    desc: 'Same-day delivery within the city, next-day nationwide.',
    accent: '#f59e0b',
  },
  {
    icon: MdSupportAgent,
    title: '24/7 Support',
    desc: 'Licensed pharmacists available around the clock.',
    accent: '#a78bfa',
  },
];

const PAYMENT_METHODS = [
  { name: 'EVC Plus',    desc: 'Hormuud Telecom',  color: '#e53e3e', icon: '🔴' },
  { name: 'Telebirr',   desc: 'Ethio Telecom',     color: '#f6ad55', icon: '🟠' },
  { name: 'Zaad',       desc: 'Telesom',            color: '#68d391', icon: '🟢' },
  { name: 'CBE Birr',   desc: 'Commercial Bank',    color: '#63b3ed', icon: '🔵' },
  { name: 'Cash / COD', desc: 'On delivery',        color: '#10b981', icon: '💵' },
  { name: 'Bank Transfer', desc: 'All major banks', color: '#b794f4', icon: '🏦' },
];

const STEPS = [
  { num: '01', icon: '🔍', title: 'Browse & Search',   desc: 'Find medicines by name, category, or condition.' },
  { num: '02', icon: '🛒', title: 'Add to Cart',        desc: 'Select quantities and check stock availability.' },
  { num: '03', icon: '💳', title: 'Checkout & Pay',     desc: 'Pay securely with EVC, Telebirr, Zaad, or Cash.' },
  { num: '04', icon: '🚚', title: 'Get Delivered',      desc: 'Receive at your doorstep or pick up in-store.' },
];

const TESTIMONIALS = [
  {
    name: 'Fatima Hassan',
    role: 'Regular Customer',
    avatar: 'FH',
    color: '#10b981',
    text: 'Som Care Pharmacy has been a lifesaver! Same-day delivery and the medicines are always genuine. I order every month without any issues.',
    stars: 5,
  },
  {
    name: 'Ahmed Warsame',
    role: 'Business Owner',
    avatar: 'AW',
    color: '#06b6d4',
    text: 'Best online pharmacy in Somalia. The staff is very knowledgeable and the pricing is fair. Highly recommend to everyone.',
    stars: 5,
  },
  {
    name: 'Halima Nuur',
    role: 'Mother of 3',
    avatar: 'HN',
    color: '#a78bfa',
    text: 'Ordering baby medicines online was always stressful until I found Som Care. Fast, reliable, and the pharmacist answered all my questions.',
    stars: 5,
  },
];

/* ─── Animated counter hook ───────────────────────────────────────────────── */
function useCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (target === 0) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [count, ref];
}

/* ─── Landing page ─────────────────────────────────────────────────────────── */
export default function Landing() {
  const [medicines, setMedicines] = useState([]);
  const [totalMeds, setTotalMeds] = useState(0);
  const [catCount,  setCatCount]  = useState(0);
  const [medCount,  medRef]       = useCounter(totalMeds);
  const [custCount, custRef]      = useCounter(1250);

  useEffect(() => {
    api.get('/shop/medicines?limit=8').then(r => setMedicines(r.data.data || [])).catch(() => {});
    Promise.all([
      api.get('/shop/medicines?limit=1'),
      api.get('/shop/categories'),
    ]).then(([m, c]) => {
      setTotalMeds(m.data.pagination?.total || 0);
      setCatCount((c.data.data || []).length);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ color: '#fff', fontFamily: 'var(--font-body,DM Sans,sans-serif)' }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16,185,129,.18) 0%, transparent 70%), linear-gradient(180deg,#080e18 0%,#0a1020 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: '5rem 1.5rem 4rem',
      }}>
        {/* Grid pattern background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(16,185,129,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '8%', left: '3%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '0%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div className="hero-grid" style={{ maxWidth: 1140, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* ── Left copy ── */}
          <div>
            {/* Trust pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.22)', borderRadius: 99, padding: '.3rem .85rem', fontSize: 11.5, fontWeight: 700, color: '#10b981', marginBottom: '1.5rem', letterSpacing: .3 }}>
              <MdShield style={{ fontSize: 13 }} />
              Licensed Pharmacy · Somalia's #1 Online Pharmacy
            </div>

            <h1 style={{ fontSize: 'clamp(2.4rem,5vw,3.8rem)', fontWeight: 900, lineHeight: 1.08, marginBottom: '1.25rem', fontFamily: 'var(--font-head,IBM Plex Sans,sans-serif)', letterSpacing: -.5 }}>
              Medicine Delivered{' '}
              <span style={{ display: 'block', background: 'linear-gradient(90deg,#10b981 0%,#06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                To Your Door
              </span>
            </h1>

            <p style={{ fontSize: 16.5, color: 'rgba(255,255,255,.55)', lineHeight: 1.8, marginBottom: '2rem', maxWidth: 480 }}>
              Order genuine medicines online from Somalia's most trusted pharmacy. Fast delivery, fair prices, and real pharmacists on call — 24/7.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.25rem' }}>
              <Link to="/shop" className="hero-cta-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.9rem 2rem', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 28px rgba(16,185,129,.45)', transition: 'all .2s' }}>
                <MdFlashOn style={{ fontSize: 18 }} />
                Shop Now
              </Link>
              <Link to="/register"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.9rem 1.75rem', borderRadius: 12, background: 'rgba(255,255,255,.06)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.11)', transition: 'all .2s' }}>
                Create Free Account
              </Link>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { icon: MdVerified,       text: 'Verified Medicines' },
                { icon: MdLocalShipping,  text: 'Same-Day Delivery' },
                { icon: MdSupportAgent,   text: '24/7 Pharmacist' },
              ].map(b => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: 12, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>
                  <b.icon style={{ fontSize: 15, color: '#10b981' }} />
                  {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right visual ── */}
          <div className="hero-visual" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 380, height: 380 }}>
              {/* Central circle */}
              <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(16,185,129,.12),rgba(6,182,212,.08))', border: '1px solid rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <MdHealthAndSafety style={{ fontSize: 72, color: '#10b981', opacity: .85 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.5)', marginTop: '.25rem', letterSpacing: 1, textTransform: 'uppercase' }}>Som Care</div>
                </div>
              </div>
              {/* Orbit ring */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed rgba(16,185,129,.12)' }} />

              {/* Floating stat cards */}
              {[
                { label: `${totalMeds || '500'}+`,  sub: 'Medicines',         icon: '💊', top: '-2%', left: '-12%',  bg: 'linear-gradient(135deg,#0d2918,#091420)', border: 'rgba(16,185,129,.2)'  },
                { label: '1,000+',                   sub: 'Happy Customers',   icon: '😊', top: '35%', right: '-18%', bg: 'linear-gradient(135deg,#0d1830,#0a0d1f)', border: 'rgba(6,182,212,.2)'   },
                { label: 'Same Day',                 sub: 'Delivery',          icon: '🚚', bottom: '2%', left: '-8%', bg: 'linear-gradient(135deg,#1a130a,#0d1830)', border: 'rgba(245,158,11,.2)'  },
              ].map(card => (
                <div key={card.sub} className="float-card" style={{
                  position: 'absolute', top: card.top, bottom: card.bottom, left: card.left, right: card.right,
                  background: card.bg, border: `1px solid ${card.border}`, borderRadius: 14,
                  padding: '.65rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem',
                  whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.4)', backdropFilter: 'blur(8px)',
                }}>
                  <span style={{ fontSize: 22 }}>{card.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{card.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', fontWeight: 600 }}>{card.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS BAR ═════════════════════════════════════════════════════════ */}
      <section style={{ background: 'rgba(16,185,129,.04)', borderTop: '1px solid rgba(16,185,129,.08)', borderBottom: '1px solid rgba(16,185,129,.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '1rem', textAlign: 'center' }}>
          {[
            { ref: medRef,  value: medCount,  label: 'Medicines',        suffix: '+', color: '#10b981' },
            { ref: null,    value: catCount,  label: 'Categories',       suffix: '+', color: '#06b6d4' },
            { ref: custRef, value: custCount, label: 'Happy Customers',  suffix: '+', color: '#a78bfa' },
            { ref: null,    value: '24/7',    label: 'Pharmacist Online', suffix: '',  color: '#f59e0b' },
            { ref: null,    value: 'Fast',    label: 'Delivery',          suffix: '',  color: '#f97316' },
          ].map(s => (
            <div key={s.label} ref={s.ref}>
              <div style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 900, color: s.color, lineHeight: 1 }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}{s.suffix}
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.42)', fontWeight: 600, marginTop: '.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CATEGORIES ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.4rem' }}>Browse By Type</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900 }}>Shop By Category</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: '.5rem' }}>Find exactly what you need by medicine type</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '1rem' }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.label} to="/shop"
                style={{ textDecoration: 'none', background: cat.bg, border: `1px solid ${cat.color}22`, borderRadius: 16, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem', transition: 'all .2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${cat.color}22`; e.currentTarget.style.borderColor = `${cat.color}44`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = `${cat.color}22`; }}>
                <span style={{ fontSize: 32 }}>{cat.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '1rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.4rem' }}>Why Choose Us</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900 }}>The Smarter Way to Get Medicines</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.25rem' }}>
            {FEATURES.map(f => (
              <div key={f.title}
                style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 18, padding: '1.75rem', transition: 'all .25s', cursor: 'default', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.accent}33`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px ${f.accent}18`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                {/* Glow top-left */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${f.accent}18 0%, transparent 70%)`, transform: 'translate(-30%,-30%)', pointerEvents: 'none' }} />
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.accent}18`, border: `1px solid ${f.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem', position: 'relative' }}>
                  <f.icon style={{ fontSize: 26, color: f.accent }} />
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: '.5rem', color: '#fff' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MEDICINE SHOWCASE ═════════════════════════════════════════════════ */}
      <section style={{ padding: '1rem 1.5rem 5rem', background: 'linear-gradient(180deg,transparent 0%, rgba(16,185,129,.03) 50%, transparent 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="showcase-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.25rem' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.4rem' }}>Our Products</div>
              <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 900, marginBottom: '.3rem' }}>Featured Medicines</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', margin: 0 }}>High-quality, in-stock medicines ready for delivery</p>
            </div>
            <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: 13, fontWeight: 700, color: '#10b981', textDecoration: 'none', whiteSpace: 'nowrap', padding: '.55rem 1.1rem', borderRadius: 10, border: '1px solid rgba(16,185,129,.25)', background: 'rgba(16,185,129,.07)', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,.07)'; }}>
              View All <MdArrowForward style={{ fontSize: 16 }} />
            </Link>
          </div>

          {medicines.length === 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem' }}>
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 300, borderRadius: 18 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem' }}>
              {medicines.map((med, i) => <MedicineCard key={med.id} med={med} idx={i} />)}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.75rem 2rem', borderRadius: 12, border: '1px solid rgba(16,185,129,.25)', color: '#10b981', fontWeight: 700, fontSize: 14, textDecoration: 'none', background: 'rgba(16,185,129,.07)' }}>
              Browse All Medicines <MdArrowForward style={{ fontSize: 16 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ HOW TO ORDER ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg,#060c14,#0a1020)', padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.4rem' }}>Simple Process</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900 }}>Order in 4 Easy Steps</h2>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem', position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', top: 36, left: '12%', right: '12%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(16,185,129,.2),rgba(16,185,129,.2),transparent)', zIndex: 0 }} />
            {STEPS.map(step => (
              <div key={step.num} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(16,185,129,.18),rgba(6,182,212,.12))', border: '2px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: 28 }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: '.3rem' }}>Step {step.num}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: '.4rem' }}>{step.title}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.42)', lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/shop"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', padding: '.9rem 2.25rem', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 24px rgba(16,185,129,.4)' }}>
              Start Shopping <MdArrowForward style={{ fontSize: 18 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.4rem' }}>Social Proof</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900 }}>What Our Customers Say</h2>
          </div>
          <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 18, padding: '1.5rem' }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: '1rem' }}>
                  {Array(t.stars).fill(0).map((_, i) => (
                    <MdStar key={i} style={{ color: '#f59e0b', fontSize: 16 }} />
                  ))}
                </div>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: '1.25rem', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${t.color}22`, border: `2px solid ${t.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: t.color, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PAYMENT METHODS ═══════════════════════════════════════════════════ */}
      <section style={{ padding: '1rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '.4rem' }}>Flexible Payments</div>
            <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Pay Your Way</h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, marginTop: '.5rem' }}>Secure payment with your preferred method</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '.875rem' }}>
            {PAYMENT_METHODS.map(pm => (
              <div key={pm.name} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', textAlign: 'center', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${pm.color}33`; e.currentTarget.style.background = `${pm.color}08`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}>
                <span style={{ fontSize: 26 }}>{pm.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{pm.name}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>{pm.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTACT STRIP ═════════════════════════════════════════════════════ */}
      <section style={{ background: 'rgba(16,185,129,.04)', borderTop: '1px solid rgba(16,185,129,.08)', borderBottom: '1px solid rgba(16,185,129,.08)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          {[
            { icon: MdPhone,       text: '+252 61 000 0000',   label: 'Call Us'        },
            { icon: FaWhatsapp,    text: '+252 61 000 0000',   label: 'WhatsApp'       },
            { icon: MdLocationOn,  text: 'Mogadishu, Somalia', label: 'Main Store'     },
            { icon: MdCheckCircle, text: 'Open 24/7',          label: 'Always Open'    },
          ].map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <c.icon style={{ fontSize: 18, color: '#10b981' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA BANNER ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '4rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', background: 'linear-gradient(135deg,rgba(16,185,129,.13),rgba(6,182,212,.08))', border: '1px solid rgba(16,185,129,.18)', borderRadius: 24, padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 40, marginBottom: '.75rem' }}>💊</div>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.1rem)', fontWeight: 900, marginBottom: '.75rem' }}>Your Health Starts Here</h2>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.55)', marginBottom: '2rem', maxWidth: 520, margin: '0 auto 2rem' }}>
              Join thousands of Somali families who trust Som Care for their medicine needs. Free account, fast delivery, genuine products.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register"
                style={{ padding: '.9rem 2.25rem', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 24px rgba(16,185,129,.4)' }}>
                Create Free Account
              </Link>
              <Link to="/shop"
                style={{ padding: '.9rem 2rem', borderRadius: 12, background: 'rgba(255,255,255,.07)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.12)' }}>
                Browse Shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#060c14', borderTop: '1px solid rgba(255,255,255,.05)', padding: '2.5rem 1.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdHealthAndSafety style={{ color: '#fff', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Som Care</div>
                  <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Pharmacy</div>
                </div>
              </div>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.35)', lineHeight: 1.75, maxWidth: 240 }}>
                Somalia's most trusted online pharmacy. Genuine medicines, fast delivery, expert pharmacists.
              </p>
            </div>
            {/* Shop */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Shop</div>
              {['All Medicines', 'Tablets', 'Syrups', 'Vitamins', 'Baby Care'].map(l => (
                <Link key={l} to="/shop" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: '.5rem', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}>
                  {l}
                </Link>
              ))}
            </div>
            {/* Account */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Account</div>
              {[['Register', '/register'], ['Login', '/login'], ['My Orders', '/my-orders']].map(([l, href]) => (
                <Link key={l} to={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: '.5rem', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}>
                  {l}
                </Link>
              ))}
            </div>
            {/* Support */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Support</div>
              {['24/7 Pharmacist', 'Delivery Info', 'Returns Policy', 'Contact Us'].map(l => (
                <div key={l} style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: '.5rem' }}>{l}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)' }}>© 2025 Som Care Pharmacy. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '.85rem' }}>
              {['Privacy Policy', 'Terms of Service'].map(l => (
                <span key={l} style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ══ MOBILE STICKY CTA ══════════════════════════════════════════════════ */}
      <div className="mobile-sticky-cta" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, padding: '.75rem 1rem', background: 'rgba(8,14,24,.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(16,185,129,.15)', zIndex: 50, gap: '.75rem' }}>
        <Link to="/shop" style={{ flex: 1, padding: '.8rem', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
          Shop Now
        </Link>
        <Link to="/register" style={{ flex: 1, padding: '.8rem', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
          Register Free
        </Link>
      </div>

      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-10px)} }
        @keyframes floatB { 0%,100%{transform:translateY(-5px)} 50%{transform:translateY(5px)} }
        @keyframes floatC { 0%,100%{transform:translateY(4px)}  50%{transform:translateY(-6px)} }
        .float-card:nth-child(1) { animation: floatA 4s ease-in-out infinite; }
        .float-card:nth-child(2) { animation: floatB 5s ease-in-out infinite; }
        .float-card:nth-child(3) { animation: floatC 4.5s ease-in-out infinite; }

        .hero-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 36px rgba(16,185,129,.55) !important; }

        @media (max-width: 900px) {
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .footer-grid       { grid-template-columns: 1fr 1fr !important; }
          .steps-grid        { grid-template-columns: repeat(2,1fr) !important; }
          .steps-grid > div:nth-child(1)::after,
          .steps-grid > div:nth-child(2)::after { display: none; }
        }
        @media (max-width: 768px) {
          .hero-grid         { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .hero-visual       { display: none !important; }
          .showcase-header   { flex-direction: column !important; align-items: flex-start !important; gap: .75rem !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .steps-grid        { grid-template-columns: repeat(2,1fr) !important; }
          .mobile-sticky-cta { display: flex !important; }
          footer             { padding-bottom: 5.5rem !important; }
        }
        @media (max-width: 540px) {
          .footer-grid  { grid-template-columns: 1fr !important; }
          .steps-grid   { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Card gradients ──────────────────────────────────────────────────────── */
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
        background: 'rgba(255,255,255,.028)',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all .22s',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(16,185,129,.4)';
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(16,185,129,.14)';
        const btn = e.currentTarget.querySelector('.shop-btn');
        if (btn) { btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
        const btn = e.currentTarget.querySelector('.shop-btn');
        if (btn) { btn.style.opacity = '0'; btn.style.transform = 'translateY(6px)'; }
      }}
    >
      {/* ── Image ── */}
      <div style={{ position: 'relative', width: '100%', height: 175, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {med.imageUrl && !imgError ? (
          <img
            src={med.imageUrl}
            alt={med.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <>
            <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', border: '1px solid rgba(16,185,129,.1)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ position: 'absolute', width: 88, height: 88, borderRadius: '50%', border: '1px solid rgba(16,185,129,.16)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,.14)', border: '2px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GiMedicinePills style={{ color: '#10b981', fontSize: 28 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,.3)', letterSpacing: 1 }}>{initials}</span>
            </div>
          </>
        )}
        {med.featured && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'linear-gradient(90deg,#f59e0b,#f97316)', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: .8, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99, boxShadow: '0 2px 8px rgba(245,158,11,.5)' }}>
            ★ Featured
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', color: '#10b981', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 99 }}>
          {med.stockQuantity > 0 ? `${med.stockQuantity} left` : 'Out of stock'}
        </div>
      </div>

      {/* ── Info ── */}
      <div style={{ padding: '.95rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
        {med.category && (
          <span style={{ fontSize: 9, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: .8 }}>
            {med.category.name}
          </span>
        )}
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {med.name}
        </div>
        {(med.form || med.strength) && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', lineHeight: 1.4 }}>
            {[med.form, med.strength].filter(Boolean).join(' · ')}
          </div>
        )}
        <div style={{ marginTop: 'auto', paddingTop: '.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{formatCurrency(med.retailPrice)}</div>
        </div>
        <div className="shop-btn" style={{ marginTop: '.3rem', padding: '.48rem', borderRadius: 9, background: 'rgba(16,185,129,.13)', border: '1px solid rgba(16,185,129,.22)', color: '#10b981', fontWeight: 700, fontSize: 11, textAlign: 'center', opacity: 0, transform: 'translateY(6px)', transition: 'all .2s' }}>
          Shop Now →
        </div>
      </div>
    </Link>
  );
}
