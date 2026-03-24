import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Check, Pencil, Trash2 } from 'lucide-react';

function BudgetModal({ onClose, onSave, categories, month }) {
  const [form, setForm] = useState({ category_id: '', amount: '', month });
  const [saving, setSaving] = useState(false);
  const expenseCats = categories.filter(c => c.type === 'expense');

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/budgets', form);
      toast.success('Budget set!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Set Budget</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} required>
              <option value="">Select category</option>
              {expenseCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Budget Amount</label>
            <input type="number" className="form-input" placeholder="500.00" step="0.01" min="0.01"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Month</label>
            <input type="month" className="form-input" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} required />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><Check size={16} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchBudgets() {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/budgets', { params: { month } }),
        api.get('/transactions/categories'),
      ]);
      setBudgets(bRes.data.budgets);
      setCategories(cRes.data.categories);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchBudgets(); }, [month]);

  async function handleDelete(id) {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget deleted');
      fetchBudgets();
    } catch { toast.error('Delete failed'); }
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);
  const overallPct = totalBudgeted > 0 ? Math.min(100, (totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Monthly spending limits by category</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="month" className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Set Budget
          </button>
        </div>
      </div>

      {/* Overview card */}
      {budgets.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Overall Budget Usage</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>
                ${totalSpent.toFixed(0)} <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 400 }}>/ ${totalBudgeted.toFixed(0)}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: overallPct > 90 ? 'var(--danger)' : overallPct > 75 ? 'var(--warning)' : 'var(--success)' }}>
                {overallPct.toFixed(0)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>utilized</div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{
              width: `${overallPct}%`,
              background: overallPct > 90 ? 'var(--danger)' : overallPct > 75 ? 'var(--warning)' : 'var(--accent)'
            }} />
          </div>
        </div>
      )}

      {/* Budget cards grid */}
      {loading ? (
        <div className="grid grid-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">No budgets for this month</div>
            <div className="empty-state-desc">Set spending limits to track your budget usage</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Set first budget
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {budgets.map(b => {
            const pct = b.amount > 0 ? Math.min(100, (b.spent / b.amount) * 100) : 0;
            const color = pct > 90 ? 'var(--danger)' : pct > 75 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={b.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${b.category_color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                      {b.category_icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.category_name}</div>
                      {b.over_budget && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Over budget</span>}
                    </div>
                  </div>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(b.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color }}>${(b.spent || 0).toFixed(0)}</strong> spent
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>${b.amount.toFixed(0)} limit</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  ${Math.max(0, b.amount - (b.spent || 0)).toFixed(0)} remaining
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          categories={categories} month={month}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchBudgets(); }}
        />
      )}
    </div>
  );
}
