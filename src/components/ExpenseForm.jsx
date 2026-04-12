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

export default function ExpenseForm({ onAdd, isLoading }) {
  const [formData, setFormData] = useState({
    type: 'Expense',
    amount: '',
    description: '',
    category: 'Other',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [aiGuessed, setAiGuessed] = useState(false);
  const [aiGuessedType, setAiGuessedType] = useState(false);

  // Simulate AI Category and Type detection
  useEffect(() => {
    const desc = formData.description.toLowerCase();
    
    // Type detection
    let guessedType = null;
    if (desc.match(/salary|bonus|refund/)) {
      guessedType = 'Income';
    } else if (desc.trim().length > 2) {
      // Default to expense if not matched and has some length
      guessedType = 'Expense';
    }

    if (guessedType && guessedType !== formData.type) {
      setFormData(prev => ({ ...prev, type: guessedType }));
      setAiGuessedType(true);
      setTimeout(() => setAiGuessedType(false), 2000);
    }

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
      type: 'Expense',
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
    <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-surface-container-high">
      <h3 className="text-xl font-manrope font-semibold text-on-surface flex items-center gap-2 mb-6">
        <Plus className="w-5 h-5 text-primary" />
        Record Expense
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6 flex flex-col">
        {/* Type Toggle */}
        <div className="flex gap-4 p-1 bg-surface-container-low rounded-2xl relative">
          {aiGuessedType && (
            <span className="absolute -top-3 right-2 text-[10px] font-bold text-primary animate-pulse flex items-center gap-1 bg-surface-container-lowest px-2 py-0.5 rounded-md border border-primary/20">
              <Sparkles className="w-3 h-3" /> AI Suggested
            </span>
          )}
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'Expense' }))}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all",
              formData.type === 'Expense' ? "bg-surface text-on-surface shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-outline-variant/10" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'Income' }))}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all",
              formData.type === 'Income' ? "bg-surface text-on-surface shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-outline-variant/10" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            Income
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">Amount</label>
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
              className="w-full bg-surface-container-low text-on-surface rounded-2xl py-3 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none font-medium"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">Description</label>
          <input 
            type="text" 
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-surface-container-low text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow font-medium"
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
                "w-full bg-surface-container-low text-on-surface rounded-2xl py-3 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium",
                aiGuessed && "ring-2 ring-primary/50 bg-primary/5"
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
            className="w-full bg-surface-container-low text-on-surface rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow font-medium [&::-webkit-calendar-picker-indicator]:opacity-50"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="mt-4 w-full bg-gradient-to-br from-primary to-primary-container hover:from-primary/90 hover:to-primary text-white font-semibold py-4 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Save Expense'
          )}
        </button>
      </form>
    </div>
  );
}
