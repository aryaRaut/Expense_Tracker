import React, { useState, useEffect } from 'react';
import {
  fetchAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  fetchAccountTransactionCount,
} from '../services/accounts';
import {
  Plus, Pencil, Trash2, Wallet, CreditCard, Banknote,
  PiggyBank, Smartphone, Building2, X, Check, AlertTriangle,
  ChevronDown, Loader2, IndianRupee
} from 'lucide-react';
import { cn } from '../utils/cn';

const ACCOUNT_TYPES = [
  { value: 'Savings',      label: 'Savings Account',  icon: 'piggy'    },
  { value: 'Salary',       label: 'Salary Account',   icon: 'building' },
  { value: 'Current',      label: 'Current Account',  icon: 'building' },
  { value: 'Credit Card',  label: 'Credit Card',      icon: 'card'     },
  { value: 'Cash',         label: 'Cash',             icon: 'cash'     },
  { value: 'UPI Wallet',   label: 'UPI Wallet',       icon: 'phone'    },
  { value: 'Fixed Deposit',label: 'Fixed Deposit',    icon: 'wallet'   },
];

const COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f43f5e',
  '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#64748b',
];

function AccountIcon({ type, color, size = 5 }) {
  const cls = `w-${size} h-${size}`;
  if (type === 'Credit Card') return <CreditCard className={cls} />;
  if (type === 'Cash')        return <Banknote className={cls} />;
  if (type === 'UPI Wallet')  return <Smartphone className={cls} />;
  if (type === 'Savings' || type === 'Fixed Deposit') return <PiggyBank className={cls} />;
  if (type === 'Salary' || type === 'Current') return <Building2 className={cls} />;
  return <Wallet className={cls} />;
}

// ─── Add / Edit Form ────────────────────────────────────────────────────────
function AccountForm({ initial, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState({
    name:             initial?.name             || '',
    type:             initial?.type             || 'Savings',
    starting_balance: initial?.starting_balance ?? '',
    color:            initial?.color            || '#6366f1',
  });

  const handle = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.5rem] p-6 space-y-5 animate-in slide-in-from-top-3 fade-in duration-300"
    >
      <h3 className="font-manrope font-bold text-lg text-on-surface">
        {initial ? 'Edit Account' : 'Add New Account'}
      </h3>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Account Name
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={handle('name')}
          placeholder="e.g. HDFC Savings, GPay Wallet…"
          className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm transition-all"
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Account Type
        </label>
        <div className="relative">
          <select
            value={form.type}
            onChange={handle('type')}
            className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl py-3 px-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm transition-all"
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
        </div>
      </div>

      {/* Starting Balance */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          {initial ? 'Starting Balance' : 'Current Balance'}
        </label>
        <div className="relative">
          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
          <input
            type="number"
            step="0.01"
            value={form.starting_balance}
            onChange={handle('starting_balance')}
            placeholder="0.00"
            className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm transition-all appearance-none"
          />
        </div>
        {form.type === 'Credit Card' && (
          <p className="text-xs text-on-surface-variant ml-1">
            💡 Enter as negative (e.g. -8500) if you currently owe money.
          </p>
        )}
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Account Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm((p) => ({ ...p, color: c }))}
              className={cn(
                'w-8 h-8 rounded-full transition-all duration-200 border-2',
                form.color === c
                  ? 'scale-125 border-on-surface shadow-md'
                  : 'border-transparent hover:scale-110'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: form.color }}
        >
          <AccountIcon type={form.type} size={5} />
        </div>
        <div>
          <p className="font-semibold text-sm text-on-surface">
            {form.name || 'Account Name'}
          </p>
          <p className="text-xs text-on-surface-variant">{form.type}</p>
        </div>
        <span className="ml-auto font-bold text-sm text-on-surface">
          ₹{parseFloat(form.starting_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Check className="w-4 h-4" /> {initial ? 'Save Changes' : 'Add Account'}</>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
function DeleteModal({ account, allAccounts, txCount, onConfirm, onCancel, isDeleting }) {
  const others = allAccounts.filter((a) => a.id !== account.id);
  const [moveToId, setMoveToId] = useState(others[0]?.id || '');

  return (
    <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="font-manrope font-bold text-lg text-on-surface">
              Delete "{account.name}"?
            </h3>
            <p className="text-sm text-on-surface-variant mt-1">
              This account has{' '}
              <span className="font-bold text-on-surface">{txCount} transaction{txCount !== 1 ? 's' : ''}</span>{' '}
              linked to it.
            </p>
          </div>
        </div>

        {txCount > 0 && others.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Move transactions to
            </label>
            <div className="relative">
              <select
                value={moveToId}
                onChange={(e) => setMoveToId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl py-3 px-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm"
              >
                {others.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
        )}

        {txCount > 0 && others.length === 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 font-medium">
            ⚠️ No other accounts exist. Transactions will be unlinked but not deleted.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-outline-variant/30 text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(moveToId || null)}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Trash2 className="w-4 h-4" /> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AccountSettings({ onAccountsChanged }) {
  const [accounts, setAccounts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [deleteTxCount, setDeleteTxCount] = useState(0);
  const [isSaving, setIsSaving]           = useState(false);
  const [isDeleting, setIsDeleting]       = useState(false);
  const [notification, setNotification]   = useState(null);

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    setLoading(true);
    const data = await fetchAccounts();
    setAccounts(data);
    setLoading(false);
  };

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAdd = async (form) => {
    setIsSaving(true);
    try {
      const newAcc = await addAccount(form);
      const updated = [...accounts, newAcc];
      setAccounts(updated);
      setShowForm(false);
      notify('Account added successfully!');
      onAccountsChanged?.(updated);
    } catch {
      notify('Failed to add account.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setIsSaving(true);
    try {
      const updated = await updateAccount(editingAccount.id, form);
      const newList = accounts.map((a) => (a.id === updated.id ? updated : a));
      setAccounts(newList);
      setEditingAccount(null);
      notify('Account updated!');
      onAccountsChanged?.(newList);
    } catch {
      notify('Failed to update account.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (account) => {
    const count = await fetchAccountTransactionCount(account.id);
    setDeleteTxCount(count);
    setDeletingAccount(account);
  };

  const handleDeleteConfirm = async (moveToId) => {
    setIsDeleting(true);
    try {
      await deleteAccount(deletingAccount.id, moveToId);
      const newList = accounts.filter((a) => a.id !== deletingAccount.id);
      setAccounts(newList);
      setDeletingAccount(null);
      notify('Account deleted.');
      onAccountsChanged?.(newList);
    } catch {
      notify('Failed to delete account.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalBalance = accounts.reduce(
    (sum, a) => sum + parseFloat(a.starting_balance || 0), 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Notification */}
      {notification && (
        <div className={cn(
          'fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl font-semibold text-sm shadow-lg animate-in fade-in slide-in-from-top-3',
          notification.type === 'error'
            ? 'bg-rose-600 text-white'
            : 'bg-emerald-600 text-white'
        )}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-manrope font-extrabold text-on-surface flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            My Bank Accounts
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage all your accounts in one place.
          </p>
        </div>
        {!showForm && !editingAccount && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        )}
      </div>

      {/* Total balance pill */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/20 rounded-2xl px-5 py-3 w-fit">
          <IndianRupee className="w-4 h-4 text-primary" />
          <span className="text-sm text-on-surface-variant font-medium">Total across all accounts:</span>
          <span className="font-manrope font-bold text-primary text-lg">
            ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <AccountForm
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
          isSaving={isSaving}
        />
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : accounts.length === 0 && !showForm ? (
        <div className="border-2 border-dashed border-outline-variant/30 rounded-[2rem] p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8 text-outline-variant" />
          </div>
          <h3 className="font-manrope font-bold text-xl text-on-surface">No accounts yet</h3>
          <p className="text-on-surface-variant text-sm">
            Add your first bank account, wallet, or cash to get started.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {accounts.map((account) => (
            <div key={account.id}>
              {/* Edit form inline */}
              {editingAccount?.id === account.id ? (
                <AccountForm
                  initial={account}
                  onSave={handleEdit}
                  onCancel={() => setEditingAccount(null)}
                  isSaving={isSaving}
                />
              ) : (
                <div className="glass-effect-dark rounded-[1.5rem] p-5 flex items-center gap-4 group hover:-translate-y-0.5 transition-all duration-200">
                  {/* Color + Icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: account.color }}
                  >
                    <AccountIcon type={account.type} size={5} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface truncate">{account.name}</p>
                    <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-lg">
                      {account.type}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className="text-right shrink-0">
                    <p className={cn(
                      'font-manrope font-bold text-xl',
                      parseFloat(account.starting_balance) < 0
                        ? 'text-rose-500'
                        : 'text-on-surface'
                    )}>
                      {parseFloat(account.starting_balance) < 0 ? '-' : ''}
                      ₹{Math.abs(parseFloat(account.starting_balance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-on-surface-variant">starting balance</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="p-2 rounded-xl hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                      aria-label="Edit account"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(account)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-on-surface-variant hover:text-rose-500 transition-colors"
                      aria-label="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deletingAccount && (
        <DeleteModal
          account={deletingAccount}
          allAccounts={accounts}
          txCount={deleteTxCount}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingAccount(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}