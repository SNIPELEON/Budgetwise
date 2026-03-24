import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setForm({ email: 'demo@budgetwise.com', password: 'Demo@1234' });
  }

  return (
    <div className="auth-page">
      {/* Background decorations */}
      <div className="auth-bg-decoration">
        <div className="auth-bg-circle" style={{ width: 600, height: 600, background: 'var(--accent)', top: -200, right: -200 }} />
        <div className="auth-bg-circle" style={{ width: 400, height: 400, background: '#6366F1', bottom: -100, left: -100 }} />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <TrendingUp size={26} color="#000" />
          </div>
          <span className="auth-logo-text">BudgetWise</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your financial command center</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-group">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block' }} /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider mt-4">or</div>

        <button
          className="btn btn-secondary btn-full"
          onClick={fillDemo}
          type="button"
          style={{ marginBottom: 20 }}
        >
          🚀 Use Demo Account
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
