import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Mail, Lock, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '', otp_code: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  
  const { login, verifyPennyDrop } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.requires_otp) {
        setDevOtp(err.response.data.dev_otp);
        toast.error('Bank account verification required before login.');
        setStep(2);
      } else {
        toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyPennyDrop(form.email);
      toast.success('Penny Drop Verified! Welcome back 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bank Verification Failed');
      if (err.response?.status === 500 && err.response?.data?.error?.includes('SYSTEM ALERT')) {
         alert(err.response.data.error); 
      }
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setForm(f => ({ ...f, email: 'demo@budgetwise.com', password: 'Demo@1234' }));
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="auth-page">
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

        {step === 1 && (
          <>
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
                    onChange={set('email')}
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
                    onChange={set('password')}
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
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
                <ShieldCheck size={32} />
              </div>
              <h1 className="auth-title">Verify Bank Account</h1>
              <p className="auth-subtitle">We will perform a secure ₹1.00 Penny Drop to reinstate your account access.</p>
              
              <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: 8, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>[IMPS Validation Protocol]</span><br/>
                Initiating connection to the banking network via Cashfree BAV API...<br/>
              </div>
            </div>

            <form onSubmit={handleVerify}>
              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 24 }}>
                {loading ? <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%' }} /> : 'Initialize ₹1.00 Penny Drop'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
