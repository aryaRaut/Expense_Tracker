import React, { useState } from 'react';
import { Search, Calendar, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '../utils/cn';

export default function SearchBar({ onSearch }) {
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = description || startDate || endDate;

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    onSearch({ description: val, startDate, endDate });
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    onSearch({ description, startDate: val, endDate });
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    setEndDate(val);
    onSearch({ description, startDate, endDate: val });
  };

  const handleClearAll = () => {
    setDescription('');
    setStartDate('');
    setEndDate('');
    onSearch({ description: '', startDate: '', endDate: '' });
  };

  const handleClearDescription = () => {
    setDescription('');
    onSearch({ description: '', startDate, endDate });
  };

  return (
    <div className="glass-effect-dark rounded-[1.5rem] p-5 border border-outline-variant/20 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-on-surface uppercase tracking-wide">Search Transactions</span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="text-xs font-semibold text-tertiary hover:text-tertiary/80 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all",
              showFilters
                ? "bg-primary text-white"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-highest"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Date Filter
            {(startDate || endDate) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Description Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
        <input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Search by description — e.g. 'Groceries', 'Salary'..."
          className="w-full bg-white/50 backdrop-blur-sm border border-white/60 text-on-surface rounded-2xl py-3 pl-11 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm placeholder:text-on-surface-variant/50 shadow-sm"
        />
        {description && (
          <button
            onClick={handleClearDescription}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Date Range — collapsible */}
      {showFilters && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            <Calendar className="w-3.5 h-3.5" />
            Date Range
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface-variant ml-1">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  max={endDate || undefined}
                  className="w-full bg-white/50 backdrop-blur-sm border border-white/60 text-on-surface rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-40"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface-variant ml-1">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  min={startDate || undefined}
                  className="w-full bg-white/50 backdrop-blur-sm border border-white/60 text-on-surface rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm shadow-sm [&::-webkit-calendar-picker-indicator]:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* Active date range badge */}
          {startDate && endDate && (
            <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Showing transactions from <span className="font-bold">{startDate}</span> to <span className="font-bold">{endDate}</span>
            </div>
          )}
          {startDate && !endDate && (
            <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Showing transactions from <span className="font-bold">{startDate}</span> onwards
            </div>
          )}
          {!startDate && endDate && (
            <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              Showing transactions up to <span className="font-bold">{endDate}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}