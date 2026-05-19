import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sparkles, HandCoins, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { fetchAccounts } from '../services/accounts';

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

const ACCOUNT_TYPE_COLORS = {
  'Savings':      'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Salary':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Current':      'bg-sky-50 text-sky-700 border-sky-200',
  'Credit Card':  'bg-rose-50 text-rose-700 border-rose-200',
  'Cash':         'bg-amber-50 text-amber-700 border-amber-200',
  'UPI Wallet':   'bg-purple-50 text-purple-700 border-purple-200',
  'Fixed Deposit':'bg-teal-50 text-teal-700 border-teal-200',
};

export default function ExpenseForm({
  onAdd,
  isLoading,
  initialTransactionType = 'Expense',
  onProceedToSplit
}) {
  const [formData, setFormData] = useState({
    type: initialTransactionType,
    amount: '',
    description: '',
    category: 'Other',
    date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
  });

  const [isSplitting, setIsSplitting]   = useState(false);
  const [aiGuessed, setAiGuessed]        = useState(false);
  const [accounts, setAccounts]          = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [noAccounts, setNoAccounts]      = useState(false);

  // Load accounts on mount
  useEffect(() => {
    fetchAccounts().then((data) => {
      setAccounts(data);
      if (data.length > 0) {
        setFormData((p) => ({ ...p, account_id: data[0].id }));
      } else {
        setNoAccounts(true);
      }
      setLoadingAccounts(false);
    });
  }, []);

  // Sync type from parent
  useEffect(() => {
    setFormData((prev) => ({ ...prev, type: initialTransactionType }));
    if (initialTransactionType !== 'Expense') setIsSplitting(false);
  }, [initialTransactionType]);

  // Auto-set split toggle when Lending/Friends selected
  useEffect(() => {
    if (formData.category === 'Lending/Friends') setIsSplitting(true);
  }, [formData.category]);

  // AI category detection
  useEffect(() => {
    const desc = formData.description.toLowerCase();
    let guessed = null;
    if (desc.match(/uber|lyft|taxi|gas|train|bus/))                    guessed = 'Transportation';
    else if (desc.match(/coffee|burger|tea|lunch|dinner|pizza|starbucks|groceries/)) guessed = 'Food & Dining';
    else if (desc.match(/rent|mortgage|ikea|furniture/))               guessed = 'Housing';
    else if (desc.match(/electric|water|internet|verizon|wifi/))       guessed = 'Utilities';
    else if (desc.match(/movie|netflix|spotify|concert|game/))         guessed = 'Entertainment';
    else if (desc.match(/doctor|pharmacy|cvs|medicine|gym/))           guessed = 'Health';

    if (guessed && guessed !== formData.category) {
      setFormData((prev) => ({ ...prev, category: guessed }));
      setAiGuessed(true);
      setTimeout(() => setAiGuessed(false), 2000);
    }
  }, [formData.description]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.date) return;

    if (isSplitting && formData.type === 'Expense') {
      onProceedToSplit(formData);
      return;
    }

    await onAdd(formData);

    setFormData({
      type: formData.type,
      amount: '',
      description: '',
      category: 'Other',
      date: format(new Date(), 'yyyy-MM-dd'),
      account_id: formData.account_id, // keep selected account
    });
    setIsSplitting(false);
  };

  const selectedAccount = accounts.find((a) => a.id === formData.account_id);

  return (
    <div className="glass-effect p-8 md:p-10 rounded-[2rem]">

      {/* Type Tabs */}
      <div className="flex gap-4 mb-8">
        {['Expense', 'Income'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFormData((p) => ({ ...p, type: t }))}
            className={cn(
              'flex-1 py-4 text-center rounded-2xl font-manrope font-bold text-lg transition-all border-2',
              formData.type === t
                ? t === 'Expense'
                  ? 'bg-[#FEE2E2] border-red-200 text-red-600 shadow-[0_0_20px_rgba(254,226,226,0.5)]'
                  : 'bg-[#DCFCE7] border-green-200 text-green-600 shadow-[0_0_20px_rgba(220,252,231,0.5)]'
                : 'bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface-container-highest'
            )}
          >
            {t === 'Expense' ? 'Record Expense' : 'Record Income'}
          </button>
        ))}
      </div>

      {/* No accounts warning */}
      {noAccounts && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-medium animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            No accounts found. Please{' '}
            <span className="font-bold underline">add an account in Settings</span>{' '}
            before recording transactions.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">

        {/* ── Account Selector ── */}
        <div>
          <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">
            Account
          </label>

          {loadingAccounts ? (
            <div className="flex items-center gap-2 py-3 px-4 bg-surface-container-low rounded-2xl">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-on-surface-variant">Loading accounts…</span>
            </div>
          ) : (
            <>
              {/* Account pills — quick pick */}
              {accounts.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, account_id: acc.id }))}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                        formData.account_id === acc.id
                          ? 'scale-105 shadow-sm ring-2 ring-offset-1'
                          : 'opacity-60 hover:opacity-90'
                      )}
                      style={{
                        backgroundColor: acc.color + '18',
                        color: acc.color,
                        borderColor: acc.color + '55',
                        ...(formData.account_id === acc.id ? { ringColor: acc.color } : {})
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: acc.color }}
                      />
                      {acc.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Fallback dropdown for many accounts */}
              {accounts.length > 4 && (
                <div className="relative">
                  <select
                    name="account_id"
                    value={formData.account_id}
                    onChange={handleChange}
                    className={cn(
                      'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 px-4 pr-10 appearance-none focus:outline-none focus:ring-2 transition-all font-medium text-sm',
                      formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
                    )}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} — {a.type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                </div>
              )}

              {/* Selected account info strip */}
              {selectedAccount && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border mt-2"
                  style={{
                    backgroundColor: selectedAccount.color + '12',
                    borderColor: selectedAccount.color + '33',
                    color: selectedAccount.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedAccount.color }}
                  />
                  {selectedAccount.name}
                  <span className="ml-auto opacity-70">{selectedAccount.type}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Amount ── */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium">
              Amount
            </label>
            <span className="text-xs text-on-surface-variant font-medium">
              {formData.type === 'Expense' ? 'How much did you spend?' : 'How much did you earn?'}
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">₹</span>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={handleChange}
              className={cn(
                'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 pl-8 pr-4 focus:outline-none focus:ring-2 transition-shadow appearance-none font-medium shadow-sm',
                formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
              )}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* ── Description ── */}
        <div>
          <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">
            Description
          </label>
          <div className="mb-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Suggestion Guide</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.type === 'Expense'
                ? ['Groceries at DMart', 'Office lunch', 'Uber ride']
                : ['Salary credit', 'Freelance design milestone', 'Interest payout']
              ).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, description: suggestion }))}
                  className="text-[10px] bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-full transition-colors border border-outline-variant/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            className={cn(
              'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 transition-shadow font-medium shadow-sm',
              formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
            )}
            placeholder="What was this for?"
          />
        </div>

        {/* ── Category ── */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="flex items-center text-label-sm uppercase tracking-wide text-on-surface-variant font-medium">
              Category
              {formData.category === 'Lending/Friends' && (
                <HandCoins className="w-4 h-4 text-primary ml-2" />
              )}
            </label>
            {aiGuessed && (
              <span className="text-xs font-semibold text-primary animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Selected
              </span>
            )}
          </div>
          <div className="relative">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={cn(
                'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 px-4 appearance-none focus:outline-none focus:ring-2 transition-all font-medium shadow-sm',
                formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200',
                aiGuessed && (formData.type === 'Expense'
                  ? 'ring-2 ring-red-200 bg-red-50/50'
                  : 'ring-2 ring-green-200 bg-green-50/50')
              )}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          </div>
        </div>

        {/* ── Date ── */}
        <div>
          <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">
            Date
          </label>
          <input
            type="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            max={format(new Date(), 'yyyy-MM-dd')}
            className={cn(
              'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 transition-shadow font-medium shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-50',
              formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
            )}
          />
        </div>

        {/* ── Split Toggle (Expense only) ── */}
        {formData.type === 'Expense' && (
          <div className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl mt-2">
            <div className="flex flex-col">
              <span className="font-semibold text-on-surface">Split this Expense</span>
              <span className="text-xs text-on-surface-variant font-medium">Divide the cost with others</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isSplitting}
              onClick={() => setIsSplitting(!isSplitting)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                isSplitting ? 'bg-primary' : 'bg-outline-variant/30'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  isSplitting ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isLoading || noAccounts || loadingAccounts}
          className={cn(
            'mt-4 w-full text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center',
            formData.type === 'Expense'
              ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-[0_8px_20px_rgba(225,29,72,0.3)] hover:shadow-[0_12px_25px_rgba(225,29,72,0.4)]'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)]'
          )}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : formData.type === 'Expense'
            ? (isSplitting ? 'Continue to Split' : 'Add Expense')
            : 'Add Income'
          }
        </button>
      </form>
    </div>
  );
}