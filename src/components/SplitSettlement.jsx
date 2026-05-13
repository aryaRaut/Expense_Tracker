import React, { useState, useEffect } from 'react';
import { Users, User, CheckCircle2, Circle, ArrowLeft, Save } from 'lucide-react';
import { cn } from '../utils/cn';

export default function SplitSettlement({ expenseData, onFinalize, onCancel, isLoading }) {
  const [step, setStep] = useState(1);
  const [numPeople, setNumPeople] = useState('');
  const [members, setMembers] = useState([]);

  const totalAmount = parseFloat(expenseData.amount) || 0;

  // Phase 1: Setup
  const handleGenerateRows = (e) => {
    e.preventDefault();
    const count = parseInt(numPeople);
    if (!count || count <= 0) return;

    const evenSplit = (totalAmount / count).toFixed(2);
    
    // Adjust last person's amount to avoid rounding errors
    const initialMembers = Array.from({ length: count }).map((_, i) => {
      let amount = parseFloat(evenSplit);
      if (i === count - 1) {
        amount = totalAmount - (parseFloat(evenSplit) * (count - 1));
      }
      return {
        id: Date.now() + i,
        name: `Person ${i + 1}`,
        amount: amount.toFixed(2),
        paid: false
      };
    });

    setMembers(initialMembers);
    setStep(2);
  };

  // Phase 2: Customization
  const handleMemberChange = (id, field, value) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handlePaidToggle = (id) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, paid: !m.paid } : m));
  };

  const currentTotal = members.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
  const remainingBalance = totalAmount - currentTotal;
  const isBalanced = Math.abs(remainingBalance) < 0.01;

  const handleFinalize = () => {
    if (!isBalanced) return;
    
    const finalizedExpense = {
      ...expenseData,
      split_details: members.map(m => ({
        name: m.name,
        amount: parseFloat(m.amount),
        paid: m.paid
      }))
    };
    
    onFinalize(finalizedExpense);
  };

  return (
    <div className="glass-effect p-8 md:p-10 rounded-[2rem] max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={step === 2 ? () => setStep(1) : onCancel}
          className="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-manrope font-extrabold text-on-surface flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Split Settlement
          </h2>
          <p className="text-sm text-on-surface-variant font-medium">
            Total Expense: <span className="text-primary font-bold">₹{totalAmount.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleGenerateRows} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div>
            <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">
              How many people are splitting this?
            </label>
            <input
              type="number"
              min="2"
              max="20"
              required
              value={numPeople}
              onChange={(e) => setNumPeople(e.target.value)}
              className="w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-4 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none font-semibold shadow-sm"
              placeholder="e.g. 3"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex justify-center items-center"
          >
            Continue to Split
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {members.map((member, index) => (
              <div key={member.id} className="flex items-center gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm transition-all hover:shadow-md">
                <button 
                  type="button"
                  onClick={() => handlePaidToggle(member.id)}
                  className="shrink-0 transition-colors"
                >
                  {member.paid ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-outline-variant hover:text-emerald-500/50" />
                  )}
                </button>
                
                <div className="flex-1 flex gap-2">
                  <div className="flex-1 relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface text-sm rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      placeholder="Name"
                    />
                  </div>
                  <div className="w-24 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-sm">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={member.amount}
                      onChange={(e) => handleMemberChange(member.id, 'amount', e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface text-sm rounded-xl py-2 pl-6 pr-2 focus:outline-none focus:ring-1 focus:ring-primary/50 font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={cn(
            "p-4 rounded-2xl border transition-colors flex items-center justify-between",
            isBalanced 
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-700" 
              : "bg-red-50/50 border-red-200 text-red-700"
          )}>
            <span className="font-semibold text-sm">Remaining Balance:</span>
            <span className="font-bold text-lg">₹{Math.abs(remainingBalance).toFixed(2)} {remainingBalance < 0 && '(Over)'}</span>
          </div>

          <button 
            onClick={handleFinalize}
            disabled={!isBalanced || isLoading}
            className="w-full bg-gradient-to-br from-primary to-primary-container hover:from-primary/90 hover:to-primary text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Finalize Split
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
