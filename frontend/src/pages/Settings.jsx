import { useState, useEffect } from 'react';
import { MdSettings, MdSave } from 'react-icons/md';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({ pharmacy_name: '', currency: 'ETB', tax_percent: '15', low_stock_alert: '5', support_phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/settings').catch(() => ({ data: null }));
      } catch {}
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    toast.success('Settings saved (demo mode)');
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div><h1 className="page-title">Settings</h1><p className="page-subtitle">System configuration</p></div>
      </div>

      <div style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '.75rem' }}>Pharmacy Information</div>
          <div className="input-group">
            <label className="input-label">Pharmacy Name</label>
            <input className="input" value={settings.pharmacy_name} onChange={e => setSettings(p => ({ ...p, pharmacy_name: e.target.value }))} placeholder="Som Care Pharmacy" />
          </div>
          <div className="input-group">
            <label className="input-label">Support Phone</label>
            <input className="input" value={settings.support_phone} onChange={e => setSettings(p => ({ ...p, support_phone: e.target.value }))} placeholder="+251900000000" />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '.75rem' }}>Financial Settings</div>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Currency</label>
              <select className="input" value={settings.currency} onChange={e => setSettings(p => ({ ...p, currency: e.target.value }))}>
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Default Tax (%)</label>
              <input className="input" type="number" min="0" max="100" step="0.01" value={settings.tax_percent} onChange={e => setSettings(p => ({ ...p, tax_percent: e.target.value }))} />
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '.75rem' }}>Inventory Alerts</div>
          <div className="input-group">
            <label className="input-label">Low Stock Alert Threshold</label>
            <input className="input" type="number" min="1" value={settings.low_stock_alert} onChange={e => setSettings(p => ({ ...p, low_stock_alert: e.target.value }))} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            <MdSave /> Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
