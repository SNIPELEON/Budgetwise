import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, Target, PiggyBank,
  Lightbulb, Settings, LogOut, TrendingUp, X, Menu
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/insights', icon: Lightbulb, label: 'AI Insights' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'BW';

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="btn btn-ghost btn-icon"
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 1100, display: 'none' }}
        id="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1099 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        position: 'fixed',
        left: 0, top: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1100,
        transition: 'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, var(--accent), #0066CC)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--accent-glow)',
            flexShrink: 0,
          }}>
            <TrendingUp size={20} color="#000" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Budget<span style={{ color: 'var(--accent)' }}>Wise</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: -2 }}>
              AI Finance
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 4,
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.92rem',
                transition: 'var(--transition)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                border: isActive ? '1px solid rgba(0,191,255,0.15)' : '1px solid transparent',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User profile */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--accent), #6366F1)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', color: '#000',
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', truncate: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleLogout}
            title="Logout"
            style={{ flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
