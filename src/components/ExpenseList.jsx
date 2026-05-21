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
  const [isSaving, setIsSaving]            = useState(false);

  const handleSearch = (params) => setSearchParams(params);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Description filter
      const descMatch = searchParams.description.trim() === ''
        ? true
        : expense.description?.toLowerCase().includes(searchParams.description.trim().toLowerCase());

      // Date range filter
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
        } else if (searchParams.endDate) {
          dateMatch = expDate <= endOfDay(parseISO(searchParams.endDate));
        }
      }
      return descMatch && dateMatch;
    });
  }, [expenses, searchParams]);

  const hasActiveSearch = searchParams.description || searchParams.startDate || searchParams.endDate;

  const handleSaveEdit = async (updatedExpense) => {
    setIsSaving(true);
    try {
      await onEdit(updatedExpense);
      setEditingExpense(null);
    } finally {
      setIsSaving(false);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="px-2 md:px-4">
          <h3 className="text-2xl font-manrope font-bold text-on-surface">Recent Transactions</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 border-dashed rounded-3xl p-12 text-center text-on-surface-variant">
          <div className="bg-surface-container-low w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-outline-variant" />
          </div>
          <h4 className="text-xl font-manrope font-semibold text-on-surface mb-2">No expenses yet</h4>
          <p>Record your first expense to begin tracking your spending.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="px-2 md:px-4 flex items-center justify-between">
        <h3 className="text-2xl font-manrope font-bold text-on-surface">Recent Transactions</h3>
        {hasActiveSearch && (
          <span className="text-sm font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-xl">
            {filteredExpenses.length} of {expenses.length} shown
          </span>
        )}
      </div>

      {/* Search */}
      <SearchBar onSearch={handleSearch} />

      {/* Empty search result */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/30 border-dashed rounded-3xl p-12 text-center text-on-surface-variant animate-in fade-in duration-300">
          <div className="bg-surface-container-low w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8 text-outline-variant" />
          </div>
          <h4 className="text-xl font-manrope font-semibold text-on-surface mb-2">No results found</h4>
          <p className="text-sm">
            {searchParams.description && (
              <>No transactions matching <span className="font-semibold text-primary">"{searchParams.description}"</span></>
            )}
            {searchParams.description && (searchParams.startDate || searchParams.endDate) && ' in the selected date range.'}
            {!searchParams.description && (searchParams.startDate || searchParams.endDate) && 'No transactions in the selected date range.'}
          </p>
        </div>
      ) : (

        // Transaction rows
        <div className="grid grid-cols-1 gap-4">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="glass-effect-dark p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 flex flex-col sm:flex-row sm:items-center justify-between group gap-4"
            >
              {/* Left */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  'hidden sm:flex p-3 rounded-2xl',
                  expense.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                )}>
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-lg">
                    {searchParams.description.trim()
                      ? highlightMatch(expense.description, searchParams.description.trim())
                      : expense.description
                    }
                  </p>
                  <div className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-medium tracking-wide uppercase',
                      expense.type === 'Income'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-surface-container-highest'
                    )}>
                      {expense.type === 'Income' ? 'Income' : expense.category}
                    </span>
                    <span>•</span>
                    <span>{format(parseISO(expense.date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-4">
                <span className={cn(
                  'font-manrope font-bold text-lg',
                  expense.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {expense.type === 'Income' ? '+' : '-'}₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>

                {/* Action buttons — visible on hover */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                  {/* Edit */}
                  <button
                    onClick={() => setEditingExpense(expense)}
                    className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Edit transaction"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="p-2 rounded-xl text-on-surface-variant hover:text-tertiary hover:bg-tertiary-container/20 transition-colors"
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

// Highlight matching text in description
function highlightMatch(text, query) {
  if (!text || !query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/15 text-primary rounded px-0.5 font-bold not-italic">
            {part}
          </mark>
        ) : part
      )}
    </>
  );
}