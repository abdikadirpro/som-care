import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  MdHealthAndSafety, MdShoppingCart, MdMenu, MdClose,
  MdPerson, MdLogout, MdReceiptLong, MdDashboard,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useShopCart } from '../../context/ShopCartContext';
import toast from 'react-hot-toast';

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'CASHIER'];

export default function ShopLayout() {
  const { user, logout } = useAuth();
  const { count } = useShopCart();
  const navigate   = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Close user dropdown when clicking outside (works on touch too)
  useEffect(() => {
    if (!dropOpen) return;
    const handle = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('touchstart', handle); };
  }, [dropOpen]);

  const isCustomer = user?.role === 'CUSTOMER';
  const isStaff    = STAFF_ROLES.includes(user?.role);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(17,24,39,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        padding: '0 1.5rem',
        height: 62,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.55rem', textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdHealthAndSafety style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.1 }}>Som Care</div>
            <div style={{ fontSize: 9, color: '#10b981', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Pharmacy</div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', display: 'flex' }} className="desktop-nav">
          {[
            { to: '/', label: 'Home', end: true },
            { to: '/shop', label: 'Shop' },
          ].map(link => (
            <NavLink key={link.to} to={link.to} end={link.end}
              style={({ isActive }) => ({
                padding: '.4rem .85rem', borderRadius: 8,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                color: isActive ? '#10b981' : 'rgba(255,255,255,.7)',
                background: isActive ? 'rgba(16,185,129,.1)' : 'transparent',
                transition: 'all .15s',
              })}
            >
              {link.label}
            </NavLink>
          ))}
          {isCustomer && (
            <NavLink to="/my-orders"
              style={({ isActive }) => ({
                padding: '.4rem .85rem', borderRadius: 8,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                color: isActive ? '#10b981' : 'rgba(255,255,255,.7)',
                background: isActive ? 'rgba(16,185,129,.1)' : 'transparent',
              })}
            >
              My Orders
            </NavLink>
          )}
          {isStaff && (
            <NavLink to="/pos"
              style={({ isActive }) => ({
                padding: '.4rem .85rem', borderRadius: 8,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                color: '#10b981', background: 'rgba(16,185,129,.08)',
              })}
            >
              <MdDashboard style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Dashboard
            </NavLink>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          {/* Cart */}
          {(isCustomer || !user) && (
            <Link to="/shop" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 9, background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.8)', textDecoration: 'none' }}>
              <MdShoppingCart style={{ fontSize: 20 }} />
              {count > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, background: '#10b981', color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 800, padding: '0 4px', lineHeight: '14px', minWidth: 14, textAlign: 'center' }}>
                  {count}
                </span>
              )}
            </Link>
          )}

          {user ? (
            /* User avatar dropdown */
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.35rem .65rem', borderRadius: 9, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer', color: '#fff' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.firstName}
                </span>
              </button>

              {dropOpen && (
                <div
                  style={{
                    position: 'absolute', top: '110%', right: 0,
                    background: '#1f2937', border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 10, minWidth: 180, zIndex: 60,
                    boxShadow: '0 8px 32px rgba(0,0,0,.4)', overflow: 'hidden',
                    padding: '.35rem',
                  }}
                >
                  <div style={{ padding: '.5rem .75rem', fontSize: 11, color: 'rgba(255,255,255,.4)' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  {isCustomer && (
                    <Link to="/my-orders" onClick={() => setDropOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.45rem .75rem', borderRadius: 7, fontSize: 13, color: '#fff', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <MdReceiptLong style={{ fontSize: 16 }} /> My Orders
                    </Link>
                  )}
                  {isStaff && (
                    <Link to="/" onClick={() => setDropOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.45rem .75rem', borderRadius: 7, fontSize: 13, color: '#10b981', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <MdDashboard style={{ fontSize: 16 }} /> Staff Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '.5rem', width: '100%', padding: '.45rem .75rem', borderRadius: 7, fontSize: 13, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <MdLogout style={{ fontSize: 16 }} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="desktop-nav" style={{ display: 'flex', gap: '.4rem' }}>
              <Link to="/login"
                style={{ padding: '.38rem .85rem', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.8)', textDecoration: 'none', border: '1px solid rgba(255,255,255,.12)', background: 'transparent' }}>
                Login
              </Link>
              <Link to="/register"
                style={{ padding: '.38rem .85rem', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#10b981', boxShadow: '0 2px 10px rgba(16,185,129,.35)' }}>
                Register
              </Link>
            </div>
          )}

          {/* Mobile burger — visibility controlled by CSS, not inline style */}
          <button
            onClick={() => setMenuOpen(p => !p)}
            className="mobile-burger"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
          >
            {menuOpen ? <MdClose style={{ fontSize: 22 }} /> : <MdMenu style={{ fontSize: 22 }} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile nav drawer ──────────────────────────────────────────── */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 62, left: 0, right: 0,
          background: 'rgba(13,21,38,0.98)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          zIndex: 49, padding: '.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {[
            { to: '/', label: 'Home', end: true },
            { to: '/shop', label: 'Shop' },
          ].map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '.65rem .85rem', borderRadius: 9, fontSize: 14, fontWeight: 600,
                textDecoration: 'none', display: 'block',
                color: isActive ? '#10b981' : 'rgba(255,255,255,.8)',
                background: isActive ? 'rgba(16,185,129,.1)' : 'transparent',
              })}>{link.label}</NavLink>
          ))}
          {isCustomer && (
            <NavLink to="/my-orders" onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '.65rem .85rem', borderRadius: 9, fontSize: 14, fontWeight: 600,
                textDecoration: 'none', display: 'block',
                color: isActive ? '#10b981' : 'rgba(255,255,255,.8)',
                background: isActive ? 'rgba(16,185,129,.1)' : 'transparent',
              })}>My Orders</NavLink>
          )}
          {isStaff && (
            <NavLink to="/pos" onClick={() => setMenuOpen(false)}
              style={{ padding: '.65rem .85rem', borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'block', color: '#10b981', background: 'rgba(16,185,129,.08)' }}>
              Dashboard
            </NavLink>
          )}
          {!user && (
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.25rem' }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, padding: '.6rem', borderRadius: 9, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.8)', border: '1px solid rgba(255,255,255,.12)', textDecoration: 'none' }}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={{ flex: 1, padding: '.6rem', borderRadius: 9, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none', background: '#10b981' }}>Register</Link>
            </div>
          )}
        </div>
      )}

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0d1117', borderTop: '1px solid rgba(255,255,255,.06)', padding: '2rem 1.5rem', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdHealthAndSafety style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <span style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>Som Care Pharmacy</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.7 }}>Your trusted online pharmacy. Quality medicines delivered to your door.</p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.6rem' }}>Shop</div>
            {['Home', 'Shop', 'My Orders'].map(l => (
              <div key={l} style={{ marginBottom: '.35rem' }}>
                <Link to={l === 'Home' ? '/' : l === 'Shop' ? '/shop' : '/my-orders'}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>
                  {l}
                </Link>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.6rem' }}>Payment Methods</div>
            {['EVC Plus', 'Telebirr', 'Zaad', 'CBE Birr', 'Cash on Delivery'].map(m => (
              <div key={m} style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: '.3rem' }}>{m}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '.6rem' }}>Contact</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.9 }}>
              📍 Mogadishu, Somalia<br />
              📞 +252 61 000 0000<br />
              ✉️ info@somcare.so
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: '1.5rem auto 0', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,.05)', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.25)' }}>
          © {new Date().getFullYear()} Som Care Pharmacy. All rights reserved.
        </div>
      </footer>

      <style>{`
        .mobile-burger { display: none; }
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-burger { display: flex; }
        }
      `}</style>
    </div>
  );
}
