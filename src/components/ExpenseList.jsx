import React, { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Trash2, Receipt, SearchX, Pencil } from 'lucide-react';
import { cn } from '../utils/cn';
import SearchBar from './SearchBar';
import EditTransactionModal from './EditTransactionModal';

export default function ExpenseList({ expenses, onDelete, onEdit }) {
  const [searchParams, setSearchParams] = useState({
    description: '',
    startDate:   '',
    endDate:     '',
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSaving, setIsSaving]            = useState(null); // store id being saved

  const handleSearch = (params) => setSearchParams(params);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const descMatch = searchParams.description.trim() === ''
        ? true
        : expense.description?.toLowerCase().includes(searchParams.description.trim().toLowerCase());

      let dateMatch = true;
      if (searchParams.startDate || searchParams.endDate) {
        const expDate = startOfDay(parseISO(expense.date));
        if (searchParams.startDate && searchParams.endDate) {
          dateMatch = isWithinInterval(expDate, {
            start: startOfDay(parseISO(searchParams.startDate)),
            end:   endOfDay(parseISO(searchParams.endDate)),
          });
        } else if (searchParams.startDate) {
          dateMatch = expDate >= startOfDay(parseISO(searchParams.startDate));
        } else {
          dateMatch = expDate <= endOfDay(parseISO(searchParams.endDate));
        }
      }
      return descMatch && dateMatch;
    });
  }, [expenses, searchParams]);

  const hasActiveSearch = searchParams.description || searchParams.startDate || searchParams.endDate;

  const handleSaveEdit = async (updatedExpense) => {
    setIsSaving(updatedExpense.id);
    try {
      await onEdit(updatedExpense);
      setEditingExpense(null);
    } finally {
      setIsSaving(null);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl md:text-2xl font-manrope font-bold text-on-surface px-1">
          Recent Transactions
        </h3>
        <div className="bg-surface-container-lowest border border-outline-variant/30 border-dashed rounded-2xl md:rounded-3xl p-8 md:p-12 text-center text-on-surface-variant">
          <div className="bg-surface-container-low w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-7 h-7 text-outline-variant" />
          </div>
          <h4 className="text-lg font-manrope font-semibold text-on-surface mb-1">No expenses yet</h4>
          <p className="text-sm">Record your first expense to begin tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl md:text-2xl font-manrope font-bold text-on-surface">
          Recent Transactions
        </h3>
        {hasActiveSearch && (
          <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-xl">
            {filteredExpenses.length}/{expenses.length}
          </span>
        )}
      </div>

      {/* Search */}
      <SearchBar onSearch={handleSearch} />

      {/* Empty search */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/30 border-dashed rounded-2xl p-8 text-center text-on-surface-variant">
          <SearchX className="w-10 h-10 mx-auto mb-3 text-outline-variant" />
          <h4 className="text-base font-manrope font-semibold text-on-surface mb-1">No results found</h4>
          <p className="text-sm">
            {searchParams.description
              ? <>No match for <span className="font-semibold text-primary">"{searchParams.description}"</span></>
              : 'No transactions in selected date range.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="glass-effect-dark rounded-2xl md:rounded-3xl transition-all duration-200 overflow-hidden"
            >
              {/* Main row */}
              <div className="flex items-center gap-3 p-4 md:p-6">

                {/* Type indicator dot — mobile */}
                <div className={cn(
                  'w-1 self-stretch rounded-full shrink-0 md:hidden',
                  expense.type === 'Income' ? 'bg-emerald-400' : 'bg-rose-400'
                )} />

                {/* Icon — desktop only */}
                <div className={cn(
                  'hidden md:flex p-3 rounded-2xl shrink-0',
                  expense.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                )}>
                  <Receipt className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm md:text-base leading-tight truncate">
                    {searchParams.description.trim()
                      ? highlightMatch(expense.description, searchParams.description.trim())
                      : expense.description
                    }
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
                      expense.type === 'Income'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    )}>
                      {expense.type === 'Income' ? 'Income' : expense.category}
                    </span>
                    <span className="text-on-surface-variant/40 text-xs">•</span>
                    <span className="text-xs text-on-surface-variant">
                      {format(parseISO(expense.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Amount + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    'font-manrope font-bold text-sm md:text-base',
                    expense.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'
                  )}>
                    {expense.type === 'Income' ? '+' : '-'}₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>

                  {/* Actions — always visible on mobile, hover on desktop */}
                  <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="p-1.5 md:p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors touch-manipulation"
                      aria-label="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="p-1.5 md:p-2 rounded-xl text-on-surface-variant hover:text-rose-500 hover:bg-rose-50 transition-colors touch-manipulation"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <EditTransactionModal
          expense={editingExpense}
          onSave={handleSaveEdit}
          onClose={() => setEditingExpense(null)}
          isSaving={isSaving === editingExpense.id}
        />
      )}
    </div>
  );
}

function highlightMatch(text, query) {
  if (!text || !query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-primary/15 text-primary rounded px-0.5 font-bold not-italic">{part}</mark>
          : part
      )}
    </>
  );
}