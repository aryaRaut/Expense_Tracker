import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { format, parseISO, subDays, isSameMonth } from 'date-fns';
import {
  TrendingUp, Wallet, TrendingDown, AlertTriangle,
  Sun, CloudSun, CloudLightning, Receipt
} from 'lucide-react';
import { cn } from '../utils/cn';
import AccountsBreakdown from './AccountsBreakdown';

const COLORS = ['#3525cd', '#006c49', '#4f46e5', '#6cf8bb', '#1b1b24'];

export default function Dashboard({
  expenses        = [],
  accounts        = [],
  selectedAccount = null,
  netWorthUpdated = false,
  onSelectAccount,
}) {
  const { totalExpenses, totalIncome, monthlyIncome, monthlyExpense, txCount } = useMemo(() => {
    let tExp = 0, tInc = 0, mInc = 0, mExp = 0;
    const now = new Date();
    expenses.forEach(e => {
      const amt = Number(e.amount);
      const isCurrentMonth = isSameMonth(parseISO(e.date), now);
      if (e.type === 'Income') {
        tInc += amt;
        if (isCurrentMonth) mInc += amt;
      } else {
        tExp += amt;
        if (isCurrentMonth) mExp += amt;
      }
    });
    return { totalExpenses: tExp, totalIncome: tInc, monthlyIncome: mInc, monthlyExpense: mExp, txCount: expenses.length };
  }, [expenses]);

  const netWorth = useMemo(() => {
    if (selectedAccount) {
      return parseFloat(selectedAccount.starting_balance || 0) + totalIncome - totalExpenses;
    }
    return accounts.reduce((sum, acc) => {
      const accExp = expenses.filter(e => e.account_id === acc.id);
      const inc = accExp.filter(e => e.type === 'Income').reduce((s, e) => s + Number(e.amount), 0);
      const exp = accExp.filter(e => e.type !== 'Income').reduce((s, e) => s + Number(e.amount), 0);
      return sum + parseFloat(acc.starting_balance || 0) + inc - exp;
    }, 0);
  }, [selectedAccount, accounts, expenses, totalIncome, totalExpenses]);

  const monthlyPL = monthlyIncome - monthlyExpense;
  const isDeficit = monthlyPL < 0;

  const weatherState = useMemo(() => {
    if (expenses.length === 0) return {
      icon: <CloudSun className="w-8 h-8 md:w-12 md:h-12 text-blue-400 animate-pulse" />,
      msg: 'Start by recording some transactions.',
      theme: 'bg-blue-400/10 border-blue-400/20 text-blue-900'
    };
    if (monthlyPL < 0) return {
      icon: <CloudLightning className="w-8 h-8 md:w-12 md:h-12 text-rose-500 animate-pulse" />,
      msg: 'Expenses exceeding income. Watch your spending.',
      theme: 'bg-rose-500/10 border-rose-500/20 text-rose-900'
    };
    if (monthlyExpense <= monthlyIncome * 0.5) return {
      icon: <Sun className="w-8 h-8 md:w-12 md:h-12 text-amber-500 animate-pulse" />,
      msg: 'You are building wealth this month.',
      theme: 'bg-amber-400/15 border-amber-400/30 text-amber-900'
    };
    return {
      icon: <CloudSun className="w-8 h-8 md:w-12 md:h-12 text-blue-400 animate-pulse" />,
      msg: 'Your spending is steady and on track.',
      theme: 'bg-blue-400/10 border-blue-400/20 text-blue-900'
    };
  }, [monthlyPL, monthlyExpense, monthlyIncome, expenses.length]);

  const categoryData = useMemo(() => {
    const acc = {};
    expenses.filter(e => e.type !== 'Income').forEach(e => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'MMM dd')).reverse();
    const data = last7Days.map(date => ({ date, amount: 0 }));
    expenses.filter(e => e.type !== 'Income').forEach(e => {
      const eDate = format(parseISO(e.date), 'MMM dd');
      const idx = data.findIndex(d => d.date === eDate);
      if (idx !== -1) data[idx].amount += Number(e.amount);
    });
    return data;
  }, [expenses]);

  const netWorthLabel = selectedAccount ? `${selectedAccount.name}` : 'Net Worth';

  return (
    <div className="space-y-4 md:space-y-8">

      {/* Weather Banner — compact on mobile */}
      <div className={cn(
        'rounded-2xl md:rounded-[2rem] p-4 md:p-6 border shadow-ambient flex items-center gap-3 md:gap-6 animate-in fade-in duration-700',
        weatherState.theme
      )}>
        <div className="shrink-0">{weatherState.icon}</div>
        <div>
          <h3 className="text-base md:text-xl font-manrope font-bold opacity-90">Financial Forecast</h3>
          <p className="text-sm md:text-base font-medium opacity-80 mt-0.5">{weatherState.msg}</p>
        </div>
      </div>

      {/* Cards — 2 col on mobile, 4 col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">

        {/* Net Worth — full width on mobile */}
        <div className={cn(
          'col-span-2 bg-gradient-to-br from-indigo-800 to-violet-900 p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-ambient text-white relative overflow-hidden group transition-all duration-700',
          netWorthUpdated ? 'ring-4 ring-indigo-400 scale-[1.02]' : ''
        )}>
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white opacity-5 rounded-full blur-3xl -mx-10 -my-10 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1 md:mb-2 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            {netWorthLabel}
          </p>
          <h3 className="text-2xl md:text-4xl lg:text-5xl font-manrope font-bold break-all">
            {netWorth < 0 ? '-' : ''}₹{Math.abs(netWorth).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          {selectedAccount && (
            <p className="text-indigo-300 text-xs font-medium mt-1 opacity-80">
              Base ₹{parseFloat(selectedAccount.starting_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Monthly P&L */}
        <div className={cn(
          'glass-effect-dark p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-ambient flex flex-col justify-center',
          isDeficit ? 'border-rose-400 bg-rose-500/5' : ''
        )}>
          <div className={cn(
            'w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 md:mb-3',
            isDeficit ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
          )}>
            {isDeficit ? <TrendingDown className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />}
          </div>
          <p className="text-on-surface-variant font-medium text-[10px] md:text-xs uppercase tracking-wide mb-1 flex items-center gap-1">
            Monthly P&L {isDeficit && <AlertTriangle className="w-3 h-3 text-rose-500" />}
          </p>
          <p className={cn('text-lg md:text-2xl font-manrope font-bold break-all', isDeficit ? 'text-rose-600' : 'text-emerald-600')}>
            {isDeficit ? '-' : '+'}₹{Math.abs(monthlyPL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className={cn('text-[10px] md:text-xs font-semibold mt-0.5', isDeficit ? 'text-rose-500' : 'text-emerald-500')}>
            {isDeficit ? 'DEFICIT' : 'SURPLUS'}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-primary to-primary-container p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-ambient text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -mx-10 -my-10 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-primary-fixed-dim text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1 md:mb-2">
            Total Expenses
          </p>
          <h3 className="text-lg md:text-2xl lg:text-3xl font-manrope font-bold break-all">
            ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Transactions */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-sky-500 to-cyan-600 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-ambient text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -mx-10 -my-10 group-hover:scale-110 transition-transform duration-500" />
          <p className="text-sky-100 text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1 md:mb-2 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Transactions
          </p>
          <h3 className="text-2xl md:text-3xl font-manrope font-bold">{txCount}</h3>
          <p className="text-sky-200 text-[10px] md:text-xs font-medium mt-0.5">total recorded</p>
        </div>
      </div>

      {/* Charts — stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 glass-effect-dark p-4 md:p-6 rounded-2xl md:rounded-3xl">
          <h4 className="text-base md:text-lg font-manrope font-semibold mb-4 md:mb-6 text-on-surface">
            Weekly Spending
          </h4>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ left: -20, right: 0 }}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#777587', fontSize: 10 }}
                  tickFormatter={(v) => v.split(' ')[1]} // show only day number on mobile
                />
                <YAxis hide />
                <RechartsTooltip
                  cursor={{ fill: '#f5f2ff' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-effect-dark p-4 md:p-6 rounded-2xl md:rounded-3xl">
          <h4 className="text-base md:text-lg font-manrope font-semibold mb-4 md:mb-6 text-on-surface">
            By Category
          </h4>
          {categoryData.length > 0 ? (
            <div className="h-48 md:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 md:h-64 flex items-center justify-center text-on-surface-variant opacity-70 text-sm">
              No data yet.
            </div>
          )}
        </div>
      </div>

      {/* Accounts Breakdown */}
      {!selectedAccount && accounts.length > 0 && (
        <AccountsBreakdown
          accounts={accounts}
          expenses={expenses}
          onSelectAccount={onSelectAccount}
        />
      )}
    </div>
  );
}