import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { Wallet, TrendingDown, TrendingUp, Target, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

function KpiCard({ label, value, icon: Icon, iconBg, change, changeType, prefix = '$' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-glow" style={{ background: iconBg }} />
      <div className="kpi-icon" style={{ background: `${iconBg}22` }}>
        <Icon size={20} color={iconBg} />
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : value}</div>
      {change !== undefined && (
        <div className={`kpi-change ${changeType === 'up_good' || changeType === 'neutral' ? 'text-success' : changeType === 'up_bad' ? 'text-danger' : 'text-accent'}`}>
          <span>{change}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>this month</span>
        </div>
      )}
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtMonth(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m)-1]} ${y}`;
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px',
        boxShadow: 'var(--shadow-md)', fontSize: '0.85rem'
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: <strong>${p.value?.toLocaleString()}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function PieTooltip({ active, payload }) {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.85rem' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.icon} {d.name}</div>
        <div style={{ color: 'var(--accent)' }}>${d.total?.toLocaleString()}</div>
        <div style={{ color: 'var(--text-muted)' }}>{d.percentage}%</div>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, trendsRes, catRes, txRes, insRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/monthly-trends'),
          api.get('/analytics/spending-by-category'),
          api.get('/analytics/recent-transactions?limit=5'),
          api.get('/insights'),
        ]);
        setSummary(sumRes.data);
        setTrends(trendsRes.data.trends.map(t => ({
          ...t, month: fmtMonth(t.month),
          income: parseFloat(t.income), expenses: parseFloat(t.expenses)
        })));
        setCategories(catRes.data.categories);
        setRecentTx(txRes.data.transactions);
        setInsights(insRes.data.insights.slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return (
    <div className="page-wrapper">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
      </div>
    </div>
  );

  const insightTypeStyle = {
    success: { bg: 'var(--success-dim)', color: 'var(--success)' },
    warning: { bg: 'var(--warning-dim)', color: 'var(--warning)' },
    danger: { bg: 'var(--danger-dim)', color: 'var(--danger)' },
    info: { bg: 'var(--info-dim)', color: 'var(--info)' },
    tip: { bg: 'var(--accent-dim)', color: 'var(--accent)' },
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <KpiCard label="Total Balance" value={summary?.balance || 0} icon={Wallet} iconBg="#00BFFF" />
        <KpiCard label="Monthly Spending" value={summary?.total_expenses || 0} icon={TrendingDown} iconBg="#EF4444" />
        <KpiCard label="Savings Rate" value={summary?.savings_rate || 0} prefix="" icon={TrendingUp} iconBg="#10B981" change={`${summary?.savings_rate || 0}%`} changeType="up_good" />
        <KpiCard label="Active Goals" value={summary?.active_goals || 0} prefix="" icon={Target} iconBg="#6366F1" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 24 }}>
        {/* Line Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Income vs. Expenses</div>
              <div className="card-subtitle">Last 6 months overview</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00BFFF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00BFFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#8E9BB8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8E9BB8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#00BFFF" strokeWidth={2} fill="url(#incGrad)" />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} fill="url(#expGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Spending Breakdown</div>
              <div className="card-subtitle">By category this month</div>
            </div>
          </div>
          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categories} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                    {categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {categories.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="cat-dot" style={{ background: c.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{c.icon} {c.name}</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${c.total?.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No expense data yet</div>
              <div className="empty-state-desc">Add transactions to see your breakdown</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Transactions + AI Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Transactions</div>
              <div className="card-subtitle">Latest financial activity</div>
            </div>
            <a href="/transactions" className="btn btn-ghost btn-sm">View all</a>
          </div>
          {recentTx.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentTx.map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px',
                  borderRadius: 'var(--radius-md)', transition: 'var(--transition)',
                  cursor: 'default',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 'var(--radius-md)',
                    background: tx.type === 'income' ? 'var(--success-dim)' : 'var(--danger-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                    flexShrink: 0,
                  }}>
                    {tx.category_icon || (tx.type === 'income' ? '💰' : '💸')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || tx.category_name || 'Transaction'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {tx.category_name} · {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className={tx.type === 'income' ? 'amount-income' : 'amount-expense'}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">No transactions yet</div>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🤖 AI Insights</div>
              <div className="card-subtitle">Personalized recommendations</div>
            </div>
            <a href="/insights" className="btn btn-ghost btn-sm">See all</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.map(ins => {
              const style = insightTypeStyle[ins.type] || insightTypeStyle.tip;
              return (
                <div key={ins.id} className="insight-card" style={{ padding: '14px 16px' }}>
                  <div className="insight-icon" style={{ background: style.bg, color: style.color }}>
                    {ins.type === 'success' ? '✅' : ins.type === 'warning' ? '⚠️' : ins.type === 'danger' ? '🚨' : '💡'}
                  </div>
                  <div className="insight-content">
                    <div className="insight-title" style={{ fontSize: '0.85rem' }}>{ins.title}</div>
                    <div className="insight-desc" style={{ fontSize: '0.78rem', marginTop: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {ins.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
