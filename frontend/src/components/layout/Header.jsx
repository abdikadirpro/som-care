import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdMenu, MdNotifications, MdSearch, MdWarning } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const pageTitles = {
  '/': 'Dashboard', '/pos': 'POS System', '/medicines': 'Medicines',
  '/inventory': 'Inventory', '/sales': 'Sales', '/customers': 'Customers',
  '/suppliers': 'Suppliers', '/prescriptions': 'Prescriptions',
  '/expenses': 'Expenses', '/analytics': 'Analytics', '/users': 'Users', '/settings': 'Settings',
};

export default function Header({ onMenuToggle, sidebarOpen }) {
  const { user } = useAuth();
  const location = useLocation();
  const [alerts, setAlerts] = useState({ lowStock: 0, expiring: 0, prescriptions: 0 });
  const title = pageTitles[location.pathname] || 'Som Care';

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [inv, presc] = await Promise.all([
          api.get('/inventory/summary'),
          api.get('/prescriptions?status=PENDING&limit=1'),
        ]);
        setAlerts({
          lowStock: inv.data?.data?.lowStock || 0,
          expiring: inv.data?.data?.expiringSoon || 0,
          prescriptions: presc.data?.pagination?.total || 0,
        });
      } catch {}
    };
    fetchAlerts();
    const t = setInterval(fetchAlerts, 60000);
    return () => clearInterval(t);
  }, []);

  const totalAlerts = alerts.lowStock + alerts.expiring + alerts.prescriptions;

  return (
    <header style={{
      position: 'fixed', top: 0, right: 0,
      left: sidebarOpen ? 'var(--sidebar-w)' : '0',
      height: 'var(--header-h)',
      background: 'rgba(17,24,39,0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.5rem', zIndex: 30,
      transition: 'left 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onMenuToggle}
          className="btn btn-ghost btn-icon"
          style={{ fontSize: 20 }}
        >
          <MdMenu />
        </button>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</h1>
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        {/* Alerts */}
        {totalAlerts > 0 && (
          <div className="header-alerts" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {alerts.lowStock > 0 && (
              <Link to="/inventory" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: 'rgba(245,158,11,.15)', color: 'var(--warning)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                <MdWarning /> {alerts.lowStock} Low Stock
              </Link>
            )}
            {alerts.expiring > 0 && (
              <Link to="/medicines?expiring=true" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: 'rgba(239,68,68,.15)', color: 'var(--danger)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                <MdWarning /> {alerts.expiring} Expiring
              </Link>
            )}
          </div>
        )}

        {/* User Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <div className="header-user-text" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{user?.firstName}</span>
            <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 500 }}>{user?.role?.replace('_',' ')}</span>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </div>
    </header>
  );
}
