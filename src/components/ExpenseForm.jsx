import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sparkles, Plus } from 'lucide-react';
import { cn } from '../utils/cn';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'College',
  'Party',
  'Other'
];

export default function ExpenseForm({ onAdd, isLoading, initialTransactionType = 'Expense' }) {
  const [formData, setFormData] = useState({
    type: initialTransactionType,
    amount: '',
    description: '',
    category: 'Other',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, type: initialTransactionType }));
  }, [initialTransactionType]);

  const [aiGuessed, setAiGuessed] = useState(false);

  // Simulate AI Category detection
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
      setFormData(prev => ({ ...prev, category: guessed }));
      setAiGuessed(true);
      setTimeout(() => setAiGuessed(false), 2000);
    }
  }, [formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.date) return;
    
    await onAdd(formData);
    
    // Reset form after successful submission
    setFormData({
      type: formData.type,
      amount: '',
      description: '',
      category: 'Other',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="glass-effect p-8 md:p-10 rounded-[2rem]">
      {/* Segregated Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, type: 'Expense' }))}
          className={cn(
            "flex-1 py-4 text-center rounded-2xl font-manrope font-bold text-lg transition-all border-2",
            formData.type === 'Expense' 
              ? "bg-[#FEE2E2] border-red-200 text-red-600 shadow-[0_0_20px_rgba(254,226,226,0.5)]" 
              : "bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface-container-highest"
          )}
        >
          Record Expense
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, type: 'Income' }))}
          className={cn(
            "flex-1 py-4 text-center rounded-2xl font-manrope font-bold text-lg transition-all border-2",
            formData.type === 'Income' 
              ? "bg-[#DCFCE7] border-green-200 text-green-600 shadow-[0_0_20px_rgba(220,252,231,0.5)]" 
              : "bg-surface-container-low border-transparent text-on-surface-variant hover:bg-surface-container-highest"
          )}
        >
          Record Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
        {/* Amount */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium">Amount</label>
            <span className="text-xs text-on-surface-variant font-medium">
              {formData.type === 'Expense' ? "How much did you spend?" : "How much did you earn?"}
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold">₹</span>
            <input 
              type="number" 
              name="amount"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={handleChange}
              className={cn(
                "w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 pl-8 pr-4 focus:outline-none focus:ring-2 transition-shadow appearance-none font-medium shadow-sm",
                formData.type === 'Expense' ? "focus:ring-red-200" : "focus:ring-green-200"
              )}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">Description</label>
          <div className="mb-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Suggestion Guide</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.type === 'Expense' 
                ? ["Groceries at DMart", "Office lunch", "Uber ride"] 
                : ["Salary credit", "Freelance design milestone", "Interest payout"]
              ).map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, description: suggestion }))}
                  className="text-[10px] bg-surface-container-low hover:bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-full transition-colors border border-outline-variant/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          <input 
            type="text" 
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            className={cn(
                "w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 transition-shadow font-medium shadow-sm",
                formData.type === 'Expense' ? "focus:ring-red-200" : "focus:ring-green-200"
            )}
            placeholder="What was this for?"
          />
        </div>

        {/* Category (AI Augmented) */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium">Category</label>
            {aiGuessed && (
                <span className="text-xs font-semibold text-primary animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Selected
                </span>
            )}
          </div>
          <div className="relative">
            <select 
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={cn(
                "w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 px-4 appearance-none focus:outline-none focus:ring-2 transition-all font-medium shadow-sm",
                formData.type === 'Expense' ? "focus:ring-red-200" : "focus:ring-green-200",
                aiGuessed && (formData.type === 'Expense' ? "ring-2 ring-red-200 bg-red-50/50" : "ring-2 ring-green-200 bg-green-50/50")
              )}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">Date</label>
          <input 
            type="date" 
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            max={format(new Date(), 'yyyy-MM-dd')}
            className={cn(
              "w-full bg-white/40 backdrop-blur-md border border-white/50 text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 transition-shadow font-medium shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-50",
              formData.type === 'Expense' ? "focus:ring-red-200" : "focus:ring-green-200"
            )}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className={cn(
            "mt-4 w-full text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center",
            formData.type === 'Expense' 
              ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-[0_8px_20px_rgba(225,29,72,0.3)] hover:shadow-[0_12px_25px_rgba(225,29,72,0.4)]"
              : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)]"
          )}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            formData.type === 'Expense' ? 'Add Expense' : 'Add Income'
          )}
        </button>
      </form>
    </div>
  );
}
