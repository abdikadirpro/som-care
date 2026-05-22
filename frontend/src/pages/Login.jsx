import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdHealthAndSafety, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const loggedUser = await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(loggedUser.role === 'CUSTOMER' ? '/shop' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,.06) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="slide-up">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#10b981,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .875rem' }}>
            <MdHealthAndSafety style={{ fontSize: 34, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-head)', marginBottom: 4 }}>Som Care Pharmacy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sign in to your account</p>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <MdEmail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: 17, pointerEvents: 'none' }} />
                <input
                  className="input"
                  type="email"
                  placeholder="admin@somcare.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={{ paddingLeft: 38 }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <MdLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: 17, pointerEvents: 'none' }} />
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingLeft: 38, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4, fontSize: 17, display: 'flex', alignItems: 'center' }}>
                  {showPw ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '.25rem', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {loading ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16,185,129,.05)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>Demo Credentials</div>
            {[
              { role: 'Super Admin', email: 'admin@somcare.com', pw: 'Admin@123' },
              { role: 'Cashier', email: 'cashier@somcare.com', pw: 'Cashier@123' },
            ].map(d => (
              <div key={d.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.role}: </span>
                  <span style={{ fontSize: 11, color: 'var(--text)' }}>{d.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ email: d.email, password: d.pw })}
                  style={{ fontSize: 10, background: 'rgba(16,185,129,.15)', color: 'var(--primary)', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
          {/* Register link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: '1.25rem' }}>
            New customer?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
