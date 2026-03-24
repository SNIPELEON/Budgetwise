import { useState, useEffect } from 'react';
import api from '../services/api';

const insightStyle = {
  success: { bg: 'var(--success-dim)', color: 'var(--success)', icon: '✅', label: 'Great Job' },
  warning: { bg: 'var(--warning-dim)', color: 'var(--warning)', icon: '⚠️', label: 'Warning' },
  danger: { bg: 'var(--danger-dim)', color: 'var(--danger)', icon: '🚨', label: 'Alert' },
  info: { bg: 'var(--info-dim)', color: 'var(--info)', icon: 'ℹ️', label: 'Info' },
  tip: { bg: 'var(--accent-dim)', color: 'var(--accent)', icon: '💡', label: 'Tip' },
};

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState('');

  useEffect(() => {
    api.get('/insights')
      .then(res => {
        setInsights(res.data.insights);
        setGeneratedAt(new Date(res.data.generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = {
    danger: insights.filter(i => i.type === 'danger'),
    warning: insights.filter(i => i.type === 'warning'),
    success: insights.filter(i => i.type === 'success'),
    info: insights.filter(i => i.type === 'info'),
    tip: insights.filter(i => i.type === 'tip'),
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">🤖 AI Financial Insights</h1>
        <p className="page-subtitle">
          Personalized recommendations based on your spending patterns
          {generatedAt && <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>· Updated at {generatedAt}</span>}
        </p>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom: 28, background: 'linear-gradient(135deg, var(--accent-dim), rgba(99,102,241,0.1))' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>🧠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>How the AI Engine Works</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              BudgetWise analyzes your transaction history, budget adherence, savings rate, and goal progress to generate
              personalized recommendations. Insights are refreshed every time you visit this page.
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
        </div>
      ) : insights.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <div className="empty-state-title">Not enough data yet</div>
            <div className="empty-state-desc">Add more transactions and set some budgets so the AI can generate insights for you.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grouped).map(([type, items]) => {
            if (!items.length) return null;
            const style = insightStyle[type];
            return (
              <div key={type}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: '1rem' }}>{style.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: style.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {style.label}
                  </span>
                  <span style={{ background: style.bg, color: style.color, borderRadius: 99, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {items.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(ins => (
                    <div key={ins.id} className="insight-card">
                      <div className="insight-icon" style={{ background: style.bg, color: style.color, fontSize: '1.2rem' }}>
                        {style.icon}
                      </div>
                      <div className="insight-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <div className="insight-title">{ins.title}</div>
                          <span className="chip">{ins.category}</span>
                        </div>
                        <div className="insight-desc">{ins.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
