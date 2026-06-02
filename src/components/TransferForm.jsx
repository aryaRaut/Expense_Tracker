import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowRight, MoveRight, Loader2, AlertCircle, FileText, Calendar } from 'lucide-react';
import { fetchAccounts } from '../services/accounts';
import { addTransfer } from '../services/transfers';
import { cn } from '../utils/cn';

function AccountDot({ color }) {
  return <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color || '#6366f1' }} />;
}

export default function TransferForm({ onSuccess, onCancel }) {
  const [accounts, setAccounts]           = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [isSaving, setIsSaving]           = useState(false);
  const [error, setError]                 = useState(null);

  const [form, setForm] = useState({
    from_account_id: '',
    to_account_id:   '',
    amount:          '',
    note:            '',
    date:            format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchAccounts().then((data) => {
      setAccounts(data);
      if (data.length >= 2) {
        setForm((p) => ({ ...p, from_account_id: data[0].id, to_account_id: data[1].id }));
      }
      setLoadingAccounts(false);
    });
  }, []);

  const handle = (field) => (e) => { setError(null); setForm((p) => ({ ...p, [field]: e.target.value })); };

  const fromAccount = accounts.find((a) => a.id === form.from_account_id);
  const toAccount   = accounts.find((a) => a.id === form.to_account_id);
  const sameAccount = form.from_account_id && form.from_account_id === form.to_account_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sameAccount) { setError('From and To accounts must be different.'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Please enter a valid amount.'); return; }
    setIsSaving(true);
    try {
      const transfer = await addTransfer(form);
      onSuccess?.(transfer);
    } catch (err) {
      setError(err.message || 'Failed to record transfer.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingAccounts) return (
    <div className="glass-effect p-8 rounded-2xl flex justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (accounts.length < 2) return (
    <div className="glass-effect p-8 rounded-2xl text-center space-y-3">
      <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
      <h3 className="font-manrope font-bold text-lg text-on-surface">Need at least 2 accounts</h3>
      <p className="text-sm text-on-surface-variant">Add another account in Settings.</p>
      <button onClick={onCancel} className="mt-2 px-6 py-3 rounded-2xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm touch-manipulation">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="glass-effect p-4 md:p-8 lg:p-10 rounded-2xl md:rounded-[2rem] space-y-5">

      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-manrope font-extrabold text-on-surface flex items-center gap-2">
          <MoveRight className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          Transfer Between Accounts
        </h2>
        <p className="text-xs md:text-sm text-on-surface-variant mt-1">
          Won't affect your net worth.
        </p>
      </div>

      {/* Live preview */}
      <div className={cn(
        'flex items-center justify-between gap-2 p-3.5 md:p-4 rounded-2xl border transition-all',
        sameAccount ? 'bg-rose-50/60 border-rose-200' : 'bg-surface-container-low border-outline-variant/20'
      )}>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">From</p>
          <div className="flex items-center gap-1.5">
            <AccountDot color={fromAccount?.color} />
            <p className="font-bold text-on-surface text-sm truncate">{fromAccount?.name || '—'}</p>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-0.5 ml-4">{fromAccount?.type}</p>
        </div>

        <div className={cn('flex flex-col items-center shrink-0 px-2', form.amount ? 'text-primary' : 'text-outline-variant')}>
          <ArrowRight className="w-5 h-5" />
          {form.amount && (
            <span className="text-[10px] font-bold text-primary mt-0.5">
              ₹{parseFloat(form.amount).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 text-right">
          <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">To</p>
          <div className="flex items-center gap-1.5 justify-end">
            <p className="font-bold text-on-surface text-sm truncate">{toAccount?.name || '—'}</p>
            <AccountDot color={toAccount?.color} />
          </div>
          <p className="text-[10px] text-on-surface-variant mt-0.5 mr-4">{toAccount?.type}</p>
        </div>
      </div>

      {sameAccount && (
        <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5 -mt-2">
          <AlertCircle className="w-3.5 h-3.5" /> From and To cannot be the same.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* From / To — stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'From Account', field: 'from_account_id' },
            { label: 'To Account',   field: 'to_account_id'   },
          ].map(({ label, field }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</label>
              <select
                value={form[field]}
                onChange={handle(field)}
                required
                className="w-full bg-white/40 backdrop-blur-md border border-black/50 text-on-surface rounded-2xl py-3.5 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm transition-all touch-manipulation"
              >
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">₹</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              inputMode="decimal"
              value={form.amount}
              onChange={handle('amount')}
              placeholder="0.00"
              className="w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-base transition-all appearance-none touch-manipulation"
            />
          </div>
        </div>

        {/* Date + Note — stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
              <input
                type="date"
                required
                value={form.date}
                onChange={handle('date')}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm transition-all [&::-webkit-calendar-picker-indicator]:opacity-40"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Note <span className="normal-case font-normal">(optional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
              <input
                type="text"
                value={form.note}
                onChange={handle('note')}
                placeholder="e.g. Monthly savings…"
                className="w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-all touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || sameAccount}
            className="flex-1 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md touch-manipulation"
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><MoveRight className="w-4 h-4" /> Record Transfer</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}