import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Pencil, Trash2, X, Check } from 'lucide-react';

function TransactionModal({ onClose, onSave, initial, categories }) {
  const [form, setForm] = useState(initial || {
    amount: '', type: 'expense', category_id: '', description: '', date: new Date().toISOString().slice(0, 10)
  });
  const [saving, setSaving] = useState(false);

  const filteredCats = categories.filter(c => c.type === form.type);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?.id) {
        await api.put(`/transactions/${initial.id}`, form);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', form);
        toast.success('Transaction added');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{initial?.id ? 'Edit' : 'Add'} Transaction</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSave}>
          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="toggle">
              <button type="button" className={form.type === 'expense' ? 'active' : ''} onClick={() => setForm(f => ({ ...f, type: 'expense', category_id: '' }))}>Expense</button>
              <button type="button" className={form.type === 'income' ? 'active' : ''} onClick={() => setForm(f => ({ ...f, type: 'income', category_id: '' }))}>Income</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input type="number" className="form-input" placeholder="0.00" step="0.01" min="0.01"
              value={form.amount} onChange={set('amount')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category_id} onChange={set('category_id')}>
              <option value="">Select category</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input type="text" className="form-input" placeholder="What was this for?"
              value={form.description} onChange={set('description')} maxLength={255} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={set('date')} required />
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

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ search: '', type: '', category_id: '', start_date: '', end_date: '' });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTx = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch (e) { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    api.get('/transactions/categories').then(r => setCategories(r.data.categories));
  }, []);

  useEffect(() => { fetchTx(1); }, [fetchTx]);

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      fetchTx();
    } catch { toast.error('Failed to delete'); }
  }

  const setFilter = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{pagination.total} total records</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true); }}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div className="filter-row">
          <div className="input-group" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="input-icon" />
            <input type="text" className="form-input" placeholder="Search transactions..."
              value={filters.search} onChange={setFilter('search')} />
          </div>
          <select className="form-select" style={{ flex: '0 0 140px' }} value={filters.type} onChange={setFilter('type')}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="form-select" style={{ flex: '0 0 180px' }} value={filters.category_id} onChange={setFilter('category_id')}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <input type="date" className="form-input" style={{ flex: '0 0 150px' }} value={filters.start_date} onChange={setFilter('start_date')} placeholder="From" />
          <input type="date" className="form-input" style={{ flex: '0 0 150px' }} value={filters.end_date} onChange={setFilter('end_date')} placeholder="To" />
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ search: '', type: '', category_id: '', start_date: '', end_date: '' })}>
            <X size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 18, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💸</div>
                      <div className="empty-state-title">No transactions found</div>
                      <div className="empty-state-desc">Add your first transaction to get started</div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.description || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="cat-dot" style={{ background: tx.category_color || '#666' }} />
                        <span>{tx.category_icon} {tx.category_name || 'Uncategorized'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={tx.type === 'income' ? 'amount-income' : 'amount-expense'}>
                        {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditItem(tx); setShowModal(true); }}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(tx.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            {[...Array(pagination.pages)].map((_, i) => (
              <button key={i} className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => fetchTx(i + 1)}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal
          categories={categories}
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={() => { setShowModal(false); setEditItem(null); fetchTx(); }}
        />
      )}
    </div>
  );
}
