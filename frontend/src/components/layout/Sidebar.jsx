import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  MdDashboard, MdPointOfSale, MdMedication, MdInventory2,
  MdShoppingCart, MdLocalShipping, MdBarChart, MdListAlt,
  MdSettings, MdSupervisedUserCircle, MdLogout, MdHealthAndSafety,
  MdAdminPanelSettings,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ADMIN       = ['SUPER_ADMIN', 'ADMIN'];
const POS_ROLES   = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST', 'CASHIER'];
const STOCK_ROLES = ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'];

// null roles = everyone; a label with no `to` = section header divider
const navItems = [
  // ── Staff section ────────────────────────────────────────────
  { to: '/dashboard', icon: MdDashboard,           label: 'Dashboard',   roles: null },
  { to: '/pos',       icon: MdPointOfSale,          label: 'POS',         roles: POS_ROLES },
  { to: '/stock',     icon: MdListAlt,              label: 'Stock View',  roles: STOCK_ROLES },
  // ── Admin section ────────────────────────────────────────────
  { divider: true,    label: 'Management',          roles: ADMIN },
  { to: '/medicines', icon: MdMedication,           label: 'Medicines',   roles: ADMIN },
  { to: '/suppliers', icon: MdLocalShipping,        label: 'Suppliers',   roles: ADMIN },
  { to: '/inventory', icon: MdInventory2,           label: 'Inventory',   roles: ADMIN },
  { to: '/sales',     icon: MdShoppingCart,         label: 'Sales',       roles: ADMIN },
  { to: '/analytics', icon: MdBarChart,             label: 'Reports',     roles: ADMIN },
  { to: '/users',     icon: MdSupervisedUserCircle, label: 'Users',       roles: ADMIN },
  { to: '/settings',  icon: MdSettings,             label: 'Settings',    roles: ADMIN },
];

const ROLE_BADGE = {
  SUPER_ADMIN: { bg: '#ef4444', label: 'Super Admin' },
  ADMIN:       { bg: '#f59e0b', label: 'Admin' },
  PHARMACIST:  { bg: '#10b981', label: 'Pharmacist' },
  CASHIER:     { bg: '#06b6d4', label: 'Cashier' },
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const role    = user?.role;
  const badge   = ROLE_BADGE[role] || { bg: '#6b7280', label: role };
  const visible = navItems.filter(i => !i.roles || i.roles.includes(role));

  return (
    <>
      {/* Mobile overlay — closes sidebar when clicking outside */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 39,
            display: typeof window !== 'undefined' && window.innerWidth < 768 ? 'block' : 'none',
          }}
        />
      )}

      <aside style={{
        position: 'fixed',
        top: 0, left: 0,
        width: 'var(--sidebar-w)',
        height: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>

        {/* ── Logo ── */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MdHealthAndSafety style={{ color: '#fff', fontSize: 22 }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Som Care</div>
            <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Pharmacy ERP</div>
          </div>
        </div>

        {/* ── User card ── */}
        <div style={{ padding: '.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${badge.bg},${badge.bg}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: .5, color: '#fff', background: badge.bg, borderRadius: 4, padding: '1px 6px', marginTop: 2 }}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '.75rem .75rem', overflowY: 'auto' }}>
          {visible.map((item, idx) => {
            if (item.divider) {
              return (
                <div key={idx} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: 1.5, textTransform: 'uppercase', padding: '.75rem .5rem .35rem', marginTop: '.25rem' }}>
                  {item.label}
                </div>
              );
            }

            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 768) onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.65rem .75rem', borderRadius: 10, marginBottom: 2,
                  fontSize: 13, fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all .15s',
                  boxShadow: isActive ? '0 2px 8px rgba(16,185,129,.35)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(16,185,129,.08)'; e.currentTarget.style.color = 'var(--primary)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                <item.icon style={{ fontSize: 18, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div style={{ padding: '.75rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '.75rem', width: '100%', padding: '.6rem .75rem', borderRadius: 10, background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <MdLogout style={{ fontSize: 18 }} />
            <span>Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
}
