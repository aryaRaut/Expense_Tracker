import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sparkles, HandCoins, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { fetchAccounts } from '../services/accounts';

const CATEGORIES = [
  'Food & Dining', 'Transportation', 'Housing', 'Utilities',
  'Entertainment', 'Health', 'College', 'Party', 'Lending/Friends', 'Other'
];

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

  const [isSplitting, setIsSplitting] = useState(false);
  const [aiGuessed, setAiGuessed] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [noAccounts, setNoAccounts] = useState(false);

  useEffect(() => {
    fetchAccounts().then((data) => {
      setAccounts(data);
      if (data.length > 0) setFormData((p) => ({ ...p, account_id: data[0].id }));
      else setNoAccounts(true);
      setLoadingAccounts(false);
    });
  }, []);

  useEffect(() => {
    setFormData((p) => ({ ...p, type: initialTransactionType }));
    if (initialTransactionType !== 'Expense') setIsSplitting(false);
  }, [initialTransactionType]);

  useEffect(() => {
    if (formData.category === 'Lending/Friends') setIsSplitting(true);
  }, [formData.category]);

  useEffect(() => {
    const desc = formData.description.toLowerCase();
    let guessed = null;
    if (desc.match(/uber|lyft|taxi|gas|train|bus/)) guessed = 'Transportation';
    else if (desc.match(/coffee|burger|tea|lunch|dinner|pizza|starbucks|groceries/)) guessed = 'Food & Dining';
    else if (desc.match(/rent|mortgage|ikea|furniture/)) guessed = 'Housing';
    else if (desc.match(/electric|water|internet|verizon|wifi/)) guessed = 'Utilities';
    else if (desc.match(/movie|netflix|spotify|concert|game/)) guessed = 'Entertainment';
    else if (desc.match(/doctor|pharmacy|cvs|medicine|gym/)) guessed = 'Health';
    if (guessed && guessed !== formData.category) {
      setFormData((p) => ({ ...p, category: guessed }));
      setAiGuessed(true);
      setTimeout(() => setAiGuessed(false), 2000);
    }
  }, [formData.description]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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
      account_id: formData.account_id,
    });
    setIsSplitting(false);
  };

  const selectedAccount = accounts.find((a) => a.id === formData.account_id);

  return (
    <div className="glass-effect p-4 md:p-8 lg:p-10 rounded-2xl md:rounded-[2rem]">

      {/* Type Tabs */}
      <div className="flex gap-2 md:gap-4 mb-6 md:mb-8">
        {['Expense', 'Income'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFormData((p) => ({ ...p, type: t }))}
            className={cn(
              'flex-1 py-3 md:py-4 text-center rounded-xl md:rounded-2xl font-manrope font-bold text-sm md:text-lg transition-all border-2 touch-manipulation',
              formData.type === t
                ? t === 'Expense'
                  ? 'bg-[#FEE2E2] border-red-200 text-red-600 shadow-[0_0_20px_rgba(254,226,226,0.5)]'
                  : 'bg-[#DCFCE7] border-green-200 text-green-600 shadow-[0_0_20px_rgba(220,252,231,0.5)]'
                : 'bg-surface-container-low border-transparent text-on-surface-variant'
            )}
          >
            {t === 'Expense' ? 'Expense' : 'Income'}
          </button>
        ))}
      </div>

      {/* No accounts warning */}
      {noAccounts && (
        <div className="mb-5 flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Add an account in Settings before recording transactions.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">

        {/* Account selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
            Account
          </label>
          {loadingAccounts ? (
            <div className="flex items-center gap-2 py-3 px-4 bg-surface-container-low rounded-2xl">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-on-surface-variant">Loading…</span>
            </div>
          ) : (
            <>
              {/* Pill buttons — scrollable row on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none -mx-1 px-1">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, account_id: acc.id }))}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 touch-manipulation',
                      formData.account_id === acc.id
                        ? 'scale-105 shadow-md ring-2 ring-offset-2 opacity-100'
                        : 'opacity-60 hover:opacity-90'
                    )}
                    style={{
                      backgroundColor: acc.color + '18',
                      color: acc.color,
                      borderColor: acc.color + '55',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                    {acc.name}
                  </button>
                ))}
              </div>

              {/* Selected account strip */}
              {selectedAccount && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border mt-2"
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
            </>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-base">₹</span>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={handleChange}
              inputMode="decimal"
              className={cn(
                'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3.5 pl-9 pr-4 focus:outline-none focus:ring-2 transition-all font-medium shadow-sm text-base appearance-none',
                formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
              )}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Description
            </label>
            {aiGuessed && (
              <span className="text-xs font-semibold text-primary animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Selected
              </span>
            )}
          </div>

          {/* Quick suggestions — horizontal scroll on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none -mx-1 px-1">
            {(formData.type === 'Expense'
              ? ['Groceries', 'Uber ride', 'Office lunch', 'Rent']
              : ['Salary', 'Freelance', 'Interest']
            ).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, description: s }))}
                className="text-[11px] bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant px-2.5 py-1.5 rounded-full transition-colors border border-outline-variant/10 shrink-0 touch-manipulation"
              >
                {s}
              </button>
            ))}
          </div>

          <input
            type="text"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            className={cn(
              'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 transition-all font-medium shadow-sm text-base',
              formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
            )}
            placeholder="What was this for?"
          />
        </div>

        {/* Category */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
            Category
            {formData.category === 'Lending/Friends' && <HandCoins className="w-3.5 h-3.5 text-primary" />}
          </label>
          <div className="relative">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={cn(
                'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3.5 px-4 pr-10 appearance-none focus:outline-none focus:ring-2 transition-all font-medium shadow-sm text-base',
                formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200',
                aiGuessed && 'ring-2 ring-primary/30'
              )}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">
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
              'w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3.5 px-4 focus:outline-none focus:ring-2 transition-all font-medium shadow-sm text-base [&::-webkit-calendar-picker-indicator]:opacity-50',
              formData.type === 'Expense' ? 'focus:ring-red-200' : 'focus:ring-green-200'
            )}
          />
        </div>

        {/* Split toggle — expense only */}
        {formData.type === 'Expense' && (
          <div className="flex items-center justify-between p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl">
            <div>
              <p className="font-semibold text-on-surface text-sm">Split this Expense</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Divide the cost with others</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isSplitting}
              onClick={() => setIsSplitting(!isSplitting)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none touch-manipulation',
                isSplitting ? 'bg-primary' : 'bg-outline-variant/30'
              )}
            >
              <span className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                isSplitting ? 'translate-x-5' : 'translate-x-0'
              )} />
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || noAccounts || loadingAccounts}
          className={cn(
            'w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center text-base touch-manipulation',
            formData.type === 'Expense'
              ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-[0_8px_20px_rgba(225,29,72,0.3)]'
              : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-[0_8px_20px_rgba(16,185,129,0.3)]'
          )}
        >
          {isLoading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : formData.type === 'Expense'
              ? (isSplitting ? 'Continue to Split' : 'Add Expense')
              : 'Add Income'
          }
        </button>
      </form>
    </div>
  );
}