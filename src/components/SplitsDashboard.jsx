import React, { useState, useEffect } from 'react';
import { fetchSplits, updateSplitPaidStatus } from '../services/api';
import { Users, CheckCircle2, Circle, Calendar, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export default function SplitsDashboard() {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    setLoading(true);
    try {
      const data = await fetchSplits();
      setSplits(data);
      // Helpful for verifying the structure of the incoming data
      setDebugInfo({ count: data.length, firstItem: data[0] || 'No data' });
      const data = await fetchSplits();
      console.log("Raw splits from DB:", JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError('Failed to load splits.');
      setDebugInfo({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaid = async (splitId, currentStatus) => {
    // Optimistic Update
    setSplits(prev => prev.map(s => s.id === splitId ? { ...s, is_paid: !currentStatus } : s));
    
    try {
      await updateSplitPaidStatus(splitId, !currentStatus);
    } catch (err) {
      // Rollback on failure
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

  const unpaidSplits = splits.filter(s => !s.is_paid);
  const paidSplits = splits.filter(s => s.is_paid);
  
  // Directly using friend_name and amount_owed as per the database schema
  const totalOwed = unpaidSplits.reduce((acc, curr) => {
    const amount = curr.amount_owed || 0;
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
        <div className="space-y-6">
          <div className="glass-effect p-12 rounded-[2rem] text-center border-dashed border-2 border-outline-variant/30">
            <Users className="w-16 h-16 text-on-surface-variant/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-on-surface">No splits found</h3>
            <p className="text-on-surface-variant mt-2">Try adding a new expense with the "Lending" category.</p>
          </div>
          
          {/* Debug Panel - Shows raw data if the list is unexpectedly empty */}
          <div className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl text-[10px] font-mono text-on-surface-variant overflow-auto max-h-40">
            <p className="font-bold mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> API State:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {unpaidSplits.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Pending Settlements ({unpaidSplits.length})
              </h3>
              <div className="grid gap-4">
                {unpaidSplits.map(split => (
                  <SplitCard key={split.id} split={split} onToggle={() => handleTogglePaid(split.id, split.is_paid)} />
                ))}
              </div>
            </section>
          )}

          {paidSplits.length > 0 && (
            <section className="opacity-80">
              <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Settled ({paidSplits.length})
              </h3>
              <div className="grid gap-4">
                {paidSplits.map(split => (
                  <SplitCard key={split.id} split={split} onToggle={() => handleTogglePaid(split.id, split.is_paid)} />
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
  // Using direct DB field names from the simplified API response
  const displayName = split.friend_name || 'Unknown Friend';
  const displayAmount = split.amount_owed || 0;
  
  const expenseDesc = split.expenses?.description || 'Shared Expense';
  const expenseDate = split.expenses?.date ? new Date(split.expenses.date).toLocaleDateString() : '';

  return (
    <div className={cn(
      "glass-effect p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:shadow-md",
      split.is_paid ? "bg-surface-container-lowest/50 border-emerald-100" : "bg-surface-container-lowest border-outline-variant/20"
    )}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button onClick={onToggle} className="shrink-0 transition-transform active:scale-95">
          {split.is_paid ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          ) : (
            <Circle className="w-8 h-8 text-outline-variant hover:text-emerald-500/50" />
          )}
        </button>
        
        <div className="truncate">
          <p className={cn("font-bold text-lg truncate", split.is_paid && "text-on-surface-variant line-through")}>
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
        <p className={cn("font-bold text-xl", split.is_paid ? "text-on-surface-variant" : "text-rose-600")}>
          ₹{parseFloat(displayAmount).toFixed(2)}
        </p>
      </div>
    </div>
  );
}