import React, { useState, useEffect } from 'react';
import { fetchSplits, updateSplitPaidStatus } from '../services/api';
import { Users, CheckCircle2, Circle, Calendar, FileText } from 'lucide-react';
import { cn } from '../utils/cn';

export default function SplitsDashboard() {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    setLoading(true);
    try {
      const data = await fetchSplits();
      setSplits(data);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError('Failed to load splits.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (splitId, currentStatus) => {
    // Optimistic UI update
    setSplits(prev => prev.map(s => s.id === splitId ? { ...s, is_paid: !currentStatus } : s));
    
    try {
      await updateSplitPaidStatus(splitId, !currentStatus);
    } catch (err) {
      // Revert on failure
      setSplits(prev => prev.map(s => s.id === splitId ? { ...s, is_paid: currentStatus } : s));
      console.error("Toggle Status Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>{error}</p>
        <button onClick={loadSplits} className="mt-4 text-primary font-semibold hover:underline">Try Again</button>
      </div>
    );
  }

  const unpaidSplits = splits.filter(s => !s.is_paid);
  const paidSplits = splits.filter(s => s.is_paid);

  // Logic to handle both possible database column names for the total calculation
  const totalOwed = unpaidSplits.reduce((acc, curr) => {
    const amount = curr.amount_owed || curr.amount || 0;
    return acc + parseFloat(amount);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-manrope font-extrabold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Splits & Lending
          </h2>
          <p className="text-on-surface-variant mt-2">Track who owes you money and manage settlements.</p>
        </div>
        <div className="bg-surface-container-low px-6 py-4 rounded-2xl shadow-sm border border-outline-variant/10 text-right">
          <p className="text-sm text-on-surface-variant font-medium uppercase tracking-wide">Total Pending</p>
          <p className="text-2xl font-bold text-primary">₹{totalOwed.toFixed(2)}</p>
        </div>
      </header>

      {splits.length === 0 ? (
        <div className="glass-effect p-12 rounded-[2rem] text-center border-dashed border-2 border-outline-variant/30">
          <Users className="w-16 h-16 text-on-surface-variant/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-on-surface">No splits found</h3>
          <p className="text-on-surface-variant mt-2">When you split expenses with friends, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Unpaid Section */}
          {unpaidSplits.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Pending Settlements ({unpaidSplits.length})
              </h3>
              <div className="grid gap-4">
                {unpaidSplits.map(split => (
                  <SplitCard 
                    key={split.id} 
                    split={split} 
                    onToggle={() => handleTogglePaid(split.id, split.is_paid)} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* Paid Section */}
          {paidSplits.length > 0 && (
            <section className="opacity-80">
              <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Settled ({paidSplits.length})
              </h3>
              <div className="grid gap-4">
                {paidSplits.map(split => (
                  <SplitCard 
                    key={split.id} 
                    split={split} 
                    onToggle={() => handleTogglePaid(split.id, split.is_paid)} 
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SplitCard({ split, onToggle }) {
  // Map database names to UI variables
  const displayName = split.friend_name || split.name || 'Unknown Friend';
  const displayAmount = split.amount_owed || split.amount || 0;
  
  const expenseDesc = split.expenses?.description || 'Shared Expense';
  const expenseDate = split.expenses?.date ? new Date(split.expenses.date).toLocaleDateString() : '';

  return (
    <div className={cn(
      "glass-effect p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:shadow-md",
      split.is_paid ? "bg-surface-container-lowest/50 border-emerald-100" : "bg-surface-container-lowest border-outline-variant/20"
    )}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          onClick={onToggle}
          className="shrink-0 transition-transform active:scale-95"
          aria-label={split.is_paid ? "Mark as unpaid" : "Mark as paid"}
        >
          {split.is_paid ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-500 hover:text-emerald-600 transition-colors" />
          ) : (
            <Circle className="w-8 h-8 text-outline-variant hover:text-emerald-500/50 transition-colors" />
          )}
        </button>
        
        <div className="truncate">
          <p className={cn(
            "font-bold text-lg truncate",
            split.is_paid ? "text-on-surface-variant line-through" : "text-on-surface"
          )}>
            {displayName}
          </p>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium mt-1">
            <span className="flex items-center gap-1 truncate">
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate">{expenseDesc}</span>
            </span>
            {expenseDate && (
              <span className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3" />
                {expenseDate}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={cn(
          "font-bold text-xl",
          split.is_paid ? "text-on-surface-variant" : "text-rose-600"
        )}>
          ₹{parseFloat(displayAmount).toFixed(2)}
        </p>
      </div>
    </div>
  );
}