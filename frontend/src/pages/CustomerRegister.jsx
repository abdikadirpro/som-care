import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdHealthAndSafety, MdPerson, MdEmail, MdLock, MdPhone, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CustomerRegister() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('Please fill in all required fields'); return;
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      // Register then auto-login
      const { data: json } = await api.post('/auth/register', {
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: form.phone, password: form.password, role: 'CUSTOMER',
      });

      // Auto-login
      await login(form.email, form.password);
      toast.success(`Welcome, ${form.firstName}! 🎉`);
      navigate('/shop');
    } catch (err) {
      toast.error('Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1a,#0d1a0d)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '15%', left: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,.1) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(6,182,212,.07) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ background: 'rgba(17,24,39,.95)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, width: '100%', maxWidth: 460, padding: '2.25rem 2rem', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
            <MdHealthAndSafety style={{ color: '#fff', fontSize: 28 }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: '.25rem' }}>Create Account</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)' }}>Join Som Care Pharmacy and order online</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <div style={inputWrap}>
                <MdPerson style={iconStyle} />
                <input className="input" style={{ paddingLeft: 32 }} placeholder="Ahmed" value={form.firstName} onChange={set('firstName')} required />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input className="input" placeholder="Hassan" value={form.lastName} onChange={set('lastName')} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address *</label>
            <div style={inputWrap}>
              <MdEmail style={iconStyle} />
              <input type="email" className="input" style={{ paddingLeft: 32 }} placeholder="ahmed@example.com" value={form.email} onChange={set('email')} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <div style={inputWrap}>
              <MdPhone style={iconStyle} />
              <input className="input" style={{ paddingLeft: 32 }} placeholder="+252 61 000 0000" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Password *</label>
            <div style={inputWrap}>
              <MdLock style={iconStyle} />
              <input type={showPw ? 'text' : 'password'} className="input" style={{ paddingLeft: 32, paddingRight: 36 }} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.35)', display: 'flex' }}>
                {showPw ? <MdVisibilityOff style={{ fontSize: 16 }} /> : <MdVisibility style={{ fontSize: 16 }} />}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Confirm Password *</label>
            <div style={inputWrap}>
              <MdLock style={iconStyle} />
              <input type={showPw ? 'text' : 'password'} className="input" style={{ paddingLeft: 32 }} placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ padding: '.75rem', borderRadius: 12, background: '#10b981', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: loading ? 'default' : 'pointer', opacity: loading ? .75 : 1, boxShadow: '0 4px 16px rgba(16,185,129,.35)', marginTop: '.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
            {loading
              ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Creating…</>
              : 'Create Account'
            }
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.45)', marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>Login</Link>
        </p>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: '.75rem' }}>
          Are you staff?{' '}
          <Link to="/login" style={{ color: 'rgba(255,255,255,.35)', textDecoration: 'none' }}>Staff Login →</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.55)', display: 'block', marginBottom: '.35rem' };
const inputWrap  = { position: 'relative' };
const iconStyle  = { position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.3)', fontSize: 15 };
