import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, User, Mail, Lock, Eye, EyeOff, DollarSign, Building, Hash, ShieldCheck, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    name: '', email: '', password: '', monthly_income: '', currency: 'USD',
    bank_account_name: '', bank_account_number: '', ifsc_code: '', otp_code: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
      setStep(2);
    } else if (step === 2) {
      if (!/^\d{8,18}$/.test(form.bank_account_number)) return toast.error('Account number must be 8-18 digits');
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code)) return toast.error('Invalid IFSC Code (e.g., HDFC0001234)');
      submitRegistration();
    }
  };

  async function submitRegistration() {
    setLoading(true);
    try {
      const res = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        currency: form.currency,
        monthly_income: parseFloat(form.monthly_income) || 0,
        bank_account_name: form.bank_account_name,
        bank_account_number: form.bank_account_number,
        ifsc_code: form.ifsc_code.toUpperCase(),
      });
      
      if (res.requires_otp) {
        setDevOtp(res.dev_otp);
        toast.success(res.message);
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(form.email, form.otp_code);
      toast.success('Bank verified! Welcome to BudgetWise 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
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

        {step === 1 && (
          <>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Step 1 of 2: Personal Details</p>
            <form onSubmit={handleNext}>
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

              <button className="btn btn-primary btn-full btn-lg" type="submit" style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Continue to Bank Setup <ArrowRight size={18} />
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="auth-title">Link Bank Account</h1>
            <p className="auth-subtitle">Step 2 of 2: Secure Verification</p>
            <form onSubmit={handleNext}>
              <div className="form-group">
                <label className="form-label">Name on Account</label>
                <div className="input-group">
                  <User size={16} className="input-icon" />
                  <input type="text" className="form-input" placeholder="Official Name"
                    value={form.bank_account_name} onChange={set('bank_account_name')} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Account Number</label>
                <div className="input-group">
                  <Hash size={16} className="input-icon" />
                  <input type="text" className="form-input" placeholder="105820491823"
                    value={form.bank_account_number} onChange={set('bank_account_number')} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <div className="input-group">
                  <Building size={16} className="input-icon" />
                  <input type="text" className="form-input" placeholder="HDFC0001234"
                    value={form.ifsc_code} onChange={set('ifsc_code')} required style={{ textTransform: 'uppercase' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-card" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%' }} /> : <>Verify Account <ShieldCheck size={18} /></>}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
                <ShieldCheck size={32} />
              </div>
              <h1 className="auth-title">Verify Bank OTP</h1>
              <p className="auth-subtitle">We sent a 6-digit secure code to your registered bank mobile number.</p>
              
              {/* DEV ONLY SIMULATOR */}
              <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: 8, fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>[Simulated SMS Message]</span><br/>
                Your BudgetWise bank verification code is: <strong style={{ color: 'var(--accent)', letterSpacing: '2px' }}>{devOtp}</strong><br/>
                Do not share this code with anyone.
              </div>
            </div>

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Enter 6-Digit Code</label>
                <div className="input-group" style={{ maxWidth: 200, margin: '0 auto' }}>
                  <KeyRound size={16} className="input-icon" />
                  <input type="text" className="form-input" placeholder="000000"
                    value={form.otp_code} onChange={set('otp_code')} required maxLength={6} style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }} />
                </div>
              </div>

              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 24 }}>
                {loading ? <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%' }} /> : 'Confirm & Access Dashboard'}
              </button>
            </form>
          </>
        )}

        {step === 1 && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
