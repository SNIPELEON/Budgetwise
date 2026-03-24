import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, User, Mail, Lock, Eye, EyeOff, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', monthly_income: '', currency: 'USD' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters with an uppercase letter and number.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        currency: form.currency,
        monthly_income: parseFloat(form.monthly_income) || 0,
      });
      toast.success('Account created! Welcome to BudgetWise 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-bg-decoration">
        <div className="auth-bg-circle" style={{ width: 500, height: 500, background: 'var(--accent)', top: -150, left: -100 }} />
        <div className="auth-bg-circle" style={{ width: 350, height: 350, background: '#10B981', bottom: -80, right: -80 }} />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <TrendingUp size={26} color="#000" />
          </div>
          <span className="auth-logo-text">BudgetWise</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start your journey to financial freedom</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-group">
              <User size={16} className="input-icon" />
              <input type="text" className="form-input" placeholder="Alex Johnson"
                value={form.name} onChange={set('name')} required maxLength={100} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-group">
              <Mail size={16} className="input-icon" />
              <input type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={form.password}
                onChange={set('password')}
                required
                style={{ paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Monthly Income</label>
              <div className="input-group">
                <DollarSign size={16} className="input-icon" />
                <input type="number" className="form-input" placeholder="5000"
                  value={form.monthly_income} onChange={set('monthly_income')} min="0" step="0.01" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={set('currency')}>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="GBP">GBP £</option>
                <option value="INR">INR ₹</option>
                <option value="CAD">CAD $</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}
            style={{ marginTop: 24 }}>
            {loading ? <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block' }} /> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
