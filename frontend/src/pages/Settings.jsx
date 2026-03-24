import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, DollarSign, Lock, Trash2, Save, Building, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', currency: user?.currency || 'USD', monthly_income: user?.monthly_income || '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        name: profile.name,
        currency: profile.currency,
        monthly_income: parseFloat(profile.monthly_income) || 0,
      });
      updateProfile(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally { setSaving(false); }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/auth/profile', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      toast.success('Password updated!');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password change failed');
    } finally { setSavingPw(false); }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Profile */}
        <div>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <User size={18} color="var(--accent)" />
                <span className="card-title">Profile Information</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, color: '#000',
                margin: '0 auto 8px', boxShadow: 'var(--accent-glow)',
              }}>{initials}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>

            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Monthly Income</label>
                  <div className="input-group">
                    <DollarSign size={16} className="input-icon" />
                    <input type="number" className="form-input" placeholder="0.00" step="0.01" min="0"
                      value={profile.monthly_income} onChange={e => setProfile(p => ({ ...p, monthly_income: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={profile.currency}
                    onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                    <option value="INR">INR ₹</option>
                    <option value="CAD">CAD $</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={saving} style={{ marginTop: 20 }}>
                {saving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
              </button>
            </form>
          </div>
        </div>

        {/* Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Lock size={18} color="var(--accent)" />
                <span className="card-title">Change Password</span>
              </div>
            </div>
            <form onSubmit={savePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" placeholder="Current password"
                  value={password.currentPassword} onChange={e => setPassword(p => ({ ...p, currentPassword: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" placeholder="Min 8 chars"
                  value={password.newPassword} onChange={e => setPassword(p => ({ ...p, newPassword: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" placeholder="Repeat new password"
                  value={password.confirmPassword} onChange={e => setPassword(p => ({ ...p, confirmPassword: e.target.value }))} required />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={savingPw}>
                {savingPw ? 'Updating...' : <><Lock size={16} /> Update Password</>}
              </button>
            </form>
          </div>

          {/* Connected Bank Account */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                <Building size={18} color="#10B981" />
                <span className="card-title">Connected Bank Account</span>
                {user?.is_verified === 1 && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '4px 8px', borderRadius: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={14} /> Verified
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Name</span>
                  <span style={{ fontWeight: 500 }}>{user?.bank_account_name || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Number</span>
                  <span style={{ fontWeight: 500, fontFamily: 'monospace', letterSpacing: 1 }}>
                    {user?.bank_account_number ? `•••• •••• ${user.bank_account_number.slice(-4)}` : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>IFSC Code</span>
                  <span style={{ fontWeight: 500, fontFamily: 'monospace', letterSpacing: 1 }}>{user?.ifsc_code || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--surface))' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Account Info</div>
            {[
              { label: 'Plan', value: '⭐ Free Plan' },
              { label: 'Member Since', value: new Date().getFullYear() },
              { label: 'Email', value: user?.email },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(0,191,255,0.1), rgba(99,102,241,0.1))',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-dim)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>🚀 Upgrade to Premium</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Advanced AI insights, unlimited budgets & detailed analytics for $9.99/mo
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
