import React from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2, Receipt } from 'lucide-react';
import { cn } from '../utils/cn';

export default function ExpenseList({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/30 border-dashed rounded-3xl p-12 text-center text-on-surface-variant">
        <div className="bg-surface-container-low w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8 text-outline-variant" />
        </div>
        <h4 className="text-xl font-manrope font-semibold text-on-surface mb-2">No expenses yet</h4>
        <p>Record your first expense to begin tracking your spending.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-ambient border border-surface-container-high overflow-hidden">
      <div className="p-6 md:p-8 border-b border-surface-container-high">
        <h3 className="text-xl font-manrope font-semibold text-on-surface">Recent Transactions</h3>
      </div>
      
      <div className="flex flex-col divide-y divide-surface-container-high/60">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-6 md:px-8 hover:bg-surface-bright transition-colors flex items-center justify-between group">
            
            <div className="flex items-center gap-4">
              <div className={cn("hidden sm:flex p-3 rounded-2xl", expense.type === 'Income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-on-surface text-lg">{expense.description}</p>
                <div className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                  <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium tracking-wide uppercase", expense.type === 'Income' ? "bg-emerald-100 text-emerald-700" : "bg-surface-container-highest")}>
                    {expense.type === 'Income' ? 'Income' : expense.category}
                  </span>
                  <span>•</span>
                  <span>{format(parseISO(expense.date), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className={cn("font-manrope font-bold text-lg", expense.type === 'Income' ? "text-emerald-500" : "text-rose-500")}>
                {expense.type === 'Income' ? '+' : '-'}₹{Number(expense.amount).toFixed(2)}
              </span>
              <button 
                onClick={() => onDelete(expense.id)}
                className="text-outline-variant hover:text-tertiary transition-colors p-2 rounded-xl hover:bg-tertiary-container/20 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete expense"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
