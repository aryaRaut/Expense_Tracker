import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Save, Loader2, Sparkles, HandCoins, ChevronDown } from 'lucide-react';
import { fetchAccounts } from '../services/accounts';
import { cn } from '../utils/cn';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'College',
  'Party',
  'Lending/Friends',
  'Other'
];

export default function EditTransactionModal({ expense, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({
    type:        expense.type        || 'Expense',
    amount:      expense.amount      || '',
    description: expense.description || '',
    category:    expense.category    || 'Other',
    date:        expense.date        ? expense.date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
    account_id:  expense.account_id  || '',
  });

  const [accounts, setAccounts]   = useState([]);
  const [aiGuessed, setAiGuessed] = useState(false);

  useEffect(() => {
    fetchAccounts().then(setAccounts);
  }, []);

  // AI category detection
  useEffect(() => {
    const desc = form.description.toLowerCase();
    let guessed = null;
    if (desc.match(/uber|lyft|taxi|gas|train|bus/))                          guessed = 'Transportation';
    else if (desc.match(/coffee|burger|tea|lunch|dinner|pizza|starbucks|groceries/)) guessed = 'Food & Dining';
    else if (desc.match(/rent|mortgage|ikea|furniture/))                     guessed = 'Housing';
    else if (desc.match(/electric|water|internet|verizon|wifi/))             guessed = 'Utilities';
    else if (desc.match(/movie|netflix|spotify|concert|game/))               guessed = 'Entertainment';
    else if (desc.match(/doctor|pharmacy|cvs|medicine|gym/))                 guessed = 'Health';

    if (guessed && guessed !== form.category) {
      setForm((p) => ({ ...p, category: guessed }));
      setAiGuessed(true);
      setTimeout(() => setAiGuessed(false), 2000);
    }
  }, [form.description]);

  const handle = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...expense, ...form, amount: parseFloat(form.amount) });
  };

  const selectedAccount = accounts.find((a) => a.id === form.account_id);

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-outline-variant/10 sticky top-0 bg-surface-container-lowest rounded-t-[2rem] z-10">
          <div>
            <h2 className="text-xl font-manrope font-extrabold text-on-surface">Edit Transaction</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Make changes and save</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Type toggle */}
          <div className="flex gap-3">
            {['Expense', 'Income'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((p) => ({ ...p, type: t }))}
                className={cn(
                  'flex-1 py-3 text-center rounded-2xl font-manrope font-bold text-sm transition-all border-2',
                  form.type === t
                    ? t === 'Expense'
                      ? 'bg-[#FEE2E2] border-red-200 text-red-600'
                      : 'bg-[#DCFCE7] border-green-200 text-green-600'
                    : 'bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface-container-highest'
                )}
              >
                {t === 'Expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          {/* Account */}
          {accounts.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Account
              </label>
              <div className="flex gap-2 flex-wrap">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, account_id: acc.id }))}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                      form.account_id === acc.id
                        ? 'scale-105 shadow-sm ring-2 ring-offset-1'
                        : 'opacity-60 hover:opacity-90'
                    )}
                    style={{
                      backgroundColor: acc.color + '18',
                      color: acc.color,
                      borderColor: acc.color + '55',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color }} />
                    {acc.name}
                  </button>
                ))}
              </div>
              {selectedAccount && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border mt-1"
                  style={{
                    backgroundColor: selectedAccount.color + '12',
                    borderColor: selectedAccount.color + '33',
                    color: selectedAccount.color,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedAccount.color }} />
                  {selectedAccount.name}
                  <span className="ml-auto opacity-70">{selectedAccount.type}</span>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={handle('amount')}
                className={cn(
                  'w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl py-3 pl-8 pr-4 focus:outline-none focus:ring-2 transition-all font-medium text-sm appearance-none',
                  form.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
                )}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Description
              </label>
              {aiGuessed && (
                <span className="text-xs font-semibold text-primary animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Updated Category
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={form.description}
              onChange={handle('description')}
              className={cn(
                'w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 transition-all font-medium text-sm',
                form.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
              )}
              placeholder="What was this for?"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Category
              {form.category === 'Lending/Friends' && <HandCoins className="w-3.5 h-3.5 text-primary" />}
            </label>
            <div className="relative">
              <select
                value={form.category}
                onChange={handle('category')}
                className={cn(
                  'w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl py-3 px-4 pr-10 appearance-none focus:outline-none focus:ring-2 transition-all font-medium text-sm',
                  form.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200',
                  aiGuessed && 'ring-2 ring-primary/30'
                )}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Date
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={handle('date')}
              max={format(new Date(), 'yyyy-MM-dd')}
              className={cn(
                'w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 transition-all font-medium text-sm [&::-webkit-calendar-picker-indicator]:opacity-40',
                form.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                'flex-1 py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md',
                form.type === 'Expense'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
              )}
            >
              {isSaving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Save className="w-4 h-4" /> Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}