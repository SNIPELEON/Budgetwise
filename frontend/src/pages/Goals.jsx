import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Check, Trash2, PlusCircle, Pencil } from 'lucide-react';

const GOAL_ICONS = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '💍', '📚', '🏖️', '💰', '📈', '🛡️', '🎓', '🎮', '🏋️'];

function GoalModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || {
    title: '', target_amount: '', current_amount: '', deadline: '', icon: '🎯'
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?.id) {
        await api.put(`/goals/${initial.id}`, form);
        toast.success('Goal updated!');
      } else {
        await api.post('/goals', form);
        toast.success('Goal created! 🎯');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{initial?.id ? 'Edit' : 'New'} Goal</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GOAL_ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  style={{
                    width: 38, height: 38, border: `2px solid ${form.icon === ic ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, background: form.icon === ic ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                    cursor: 'pointer', fontSize: '1.1rem', transition: 'var(--transition)',
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Goal Title</label>
            <input type="text" className="form-input" placeholder="e.g. Emergency Fund, Vacation..."
              value={form.title} onChange={set('title')} required maxLength={150} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Target Amount</label>
              <input type="number" className="form-input" placeholder="10000" step="0.01" min="0.01"
                value={form.target_amount} onChange={set('target_amount')} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Current Savings</label>
              <input type="number" className="form-input" placeholder="0" step="0.01" min="0"
                value={form.current_amount} onChange={set('current_amount')} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Target Date</label>
            <input type="date" className="form-input" value={form.deadline} onChange={set('deadline')} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : <><Check size={16} /> {initial?.id ? 'Update' : 'Create'} Goal</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DepositModal({ goal, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const remaining = goal.target_amount - goal.current_amount;

  async function handleDeposit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/goals/${goal.id}/deposit`, { amount: parseFloat(amount) });
      toast.success(`Added $${amount} to "${goal.title}" 💰`);
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deposit failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title">{goal.icon} Add to Goal</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{goal.title}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 4 }}>
            ${goal.current_amount.toFixed(0)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ ${goal.target_amount.toFixed(0)}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: 2 }}>${remaining.toFixed(0)} remaining</div>
        </div>
        <form onSubmit={handleDeposit}>
          <div className="form-group">
            <label className="form-label">Deposit Amount</label>
            <input type="number" className="form-input" placeholder="100.00" step="0.01" min="0.01" max={remaining}
              value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding...' : '💰 Add Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// TOP-LEVEL component — NOT inside Goals() to prevent React remounting issues
function GoalCard({ g, onEdit, onDelete, onDeposit }) {
  const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
  const isCompleted = g.status === 'completed';
  const daysLeft = g.deadline
    ? Math.ceil((new Date(g.deadline) - Date.now()) / 86400000)
    : null;

  return (
    <div className="goal-card" style={{ opacity: isCompleted ? 0.85 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44,
            background: isCompleted ? 'var(--success-dim)' : 'var(--accent-dim)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
          }}>{g.icon}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{g.title}</div>
            {isCompleted ? (
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✓ Completed</span>
            ) : daysLeft !== null ? (
              <div style={{ fontSize: '0.75rem', color: daysLeft < 30 ? 'var(--warning)' : 'var(--text-muted)', marginTop: 2 }}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Past deadline'}
              </div>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(g)}><Pencil size={13} /></button>
          <button className="btn btn-danger btn-icon btn-sm" onClick={() => onDelete(g.id)}><Trash2 size={13} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
        <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
            <circle cx="40" cy="40" r="32" fill="none"
              stroke={isCompleted ? 'var(--success)' : 'var(--accent)'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.78rem', fontWeight: 700,
            color: isCompleted ? 'var(--success)' : 'var(--accent)'
          }}>{pct.toFixed(0)}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>${g.current_amount.toLocaleString()}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>of ${g.target_amount.toLocaleString()} target</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            ${(g.target_amount - g.current_amount).toLocaleString()} remaining
          </div>
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: 14 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: isCompleted ? 'var(--success)' : 'var(--accent)' }} />
      </div>

      {!isCompleted && (
        <button className="btn btn-primary btn-full btn-sm" onClick={() => onDeposit(g)}>
          <PlusCircle size={14} /> Add Funds
        </button>
      )}
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [depositGoal, setDepositGoal] = useState(null);

  async function fetchGoals() {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      setGoals(res.data.goals);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchGoals(); }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      fetchGoals();
    } catch { toast.error('Failed'); }
  }

  function handleEdit(g) { setEditItem(g); setShowModal(true); }

  const active = goals.filter(g => g.status === 'active');
  const completed = goals.filter(g => g.status === 'completed');
  const totalTarget = active.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = active.reduce((s, g) => s + g.current_amount, 0);

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">Track your financial milestones</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={16} /> New Goal
        </button>
      </div>

      {active.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Active Goals', value: active.length },
            { label: 'Total Saved', value: `$${totalSaved.toLocaleString()}` },
            { label: 'Completion Rate', value: `${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%` },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 240, borderRadius: 16 }} />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">No goals yet</div>
            <div className="empty-state-desc">Create your first savings goal to start tracking</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Create Goal
            </button>
          </div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                Active ({active.length})
              </div>
              <div className="grid grid-3" style={{ marginBottom: 24 }}>
                {active.map(g => (
                  <GoalCard key={g.id} g={g} onEdit={handleEdit} onDelete={handleDelete} onDeposit={setDepositGoal} />
                ))}
              </div>
            </>
          )}
          {completed.length > 0 && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                Completed ({completed.length})
              </div>
              <div className="grid grid-3">
                {completed.map(g => (
                  <GoalCard key={g.id} g={g} onEdit={handleEdit} onDelete={handleDelete} onDeposit={setDepositGoal} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {showModal && (
        <GoalModal initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={() => { setShowModal(false); setEditItem(null); fetchGoals(); }} />
      )}
      {depositGoal && (
        <DepositModal goal={depositGoal}
          onClose={() => setDepositGoal(null)}
          onSave={() => { setDepositGoal(null); fetchGoals(); }} />
      )}
    </div>
  );
}
