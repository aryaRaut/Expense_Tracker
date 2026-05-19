import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { MoveRight, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { fetchTransfers, deleteTransfer } from '../services/transfers';
import { cn } from '../utils/cn';

function AccountPill({ account }) {
  if (!account) return <span className="text-on-surface-variant italic text-xs">Deleted account</span>;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold"
      style={{
        backgroundColor: account.color + '22',
        color: account.color,
        border: `1px solid ${account.color}44`
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: account.color }} />
      {account.name}
    </span>
  );
}

export default function TransferList({ refreshTrigger }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => {
    load();
  }, [refreshTrigger]);

  const load = async () => {
    setLoading(true);
    const data = await fetchTransfers();
    setTransfers(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteTransfer(id);
      setTransfers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Delete transfer error:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="border-2 border-dashed border-outline-variant/30 rounded-3xl p-10 text-center text-on-surface-variant">
        <MoveRight className="w-10 h-10 mx-auto mb-3 text-outline-variant" />
        <p className="font-semibold text-on-surface">No transfers yet</p>
        <p className="text-sm mt-1">Transfers between your accounts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transfers.map((transfer) => (
        <div
          key={transfer.id}
          className="glass-effect-dark rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:-translate-y-0.5 transition-all duration-200"
        >
          {/* Left: accounts flow */}
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
            {/* Transfer icon */}
            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
              <MoveRight className="w-5 h-5 text-primary" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <AccountPill account={transfer.from_account} />
              <ArrowRight className="w-4 h-4 text-on-surface-variant shrink-0" />
              <AccountPill account={transfer.to_account} />
            </div>

            {/* Note + Date */}
            <div className="w-full sm:w-auto flex items-center gap-2 mt-1 sm:mt-0 ml-0 sm:ml-2">
              {transfer.note && (
                <span className="text-xs text-on-surface-variant font-medium truncate max-w-[160px]">
                  "{transfer.note}"
                </span>
              )}
              <span className="text-xs text-on-surface-variant shrink-0">
                • {format(parseISO(transfer.date), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>

          {/* Right: amount + delete */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="font-manrope font-bold text-lg text-primary">
                ₹{parseFloat(transfer.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-on-surface-variant font-medium">transfer</p>
            </div>
            <button
              onClick={() => handleDelete(transfer.id)}
              disabled={deleting === transfer.id}
              className="p-2 rounded-xl text-outline-variant hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
              aria-label="Delete transfer"
            >
              {deleting === transfer.id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}