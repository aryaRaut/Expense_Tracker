import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { format, parseISO, subDays, isSameMonth } from 'date-fns';
import { TrendingUp, Wallet, ArrowDownRight, TrendingDown, AlertTriangle, Sun, CloudSun, CloudLightning } from 'lucide-react';
import { cn } from '../utils/cn';

const COLORS = ['#3525cd', '#006c49', '#4f46e5', '#6cf8bb', '#1b1b24'];

export default function Dashboard({ expenses, startingBalance = 0, netWorthUpdated = false }) {
  const { totalExpenses, totalIncome, monthlyIncome, monthlyExpense } = useMemo(() => {
    let tExp = 0;
    let tInc = 0;
    let mInc = 0;
    let mExp = 0;
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
    return { totalExpenses: tExp, totalIncome: tInc, monthlyIncome: mInc, monthlyExpense: mExp };
  }, [expenses]);

  const netWorth = startingBalance + totalIncome - totalExpenses;
  const monthlyPL = monthlyIncome - monthlyExpense;
  const isDeficit = monthlyPL < 0;

  const weatherState = useMemo(() => {
    if (expenses.length === 0) {
      return { icon: <CloudSun className="w-12 h-12 text-blue-400 animate-pulse" />, msg: 'Fair Weather: Start by recording some transactions.', theme: 'bg-blue-400/10 border-blue-400/20 text-blue-900' };
    }
    if (monthlyPL < 0) {
      return { icon: <CloudLightning className="w-12 h-12 text-rose-500 animate-pulse" />, msg: 'High Pressure: Expenses are exceeding income. Watch your spending.', theme: 'bg-rose-500/10 border-rose-500/20 text-rose-900' };
    } else if (monthlyPL >= 0 && monthlyExpense <= monthlyIncome * 0.5) {
      return { icon: <Sun className="w-12 h-12 text-amber-500 animate-pulse" />, msg: 'Clear Skies: You are building wealth this month.', theme: 'bg-amber-400/15 border-amber-400/30 text-amber-900' };
    } else {
      return { icon: <CloudSun className="w-12 h-12 text-blue-400 animate-pulse" />, msg: 'Fair Weather: Your spending is steady and on track.', theme: 'bg-blue-400/10 border-blue-400/20 text-blue-900' };
    }
  }, [monthlyPL, monthlyExpense, monthlyIncome, expenses.length]);

  const categoryData = useMemo(() => {
    const acc = {};
    expenses.filter(e => e.type !== 'Income').forEach(e => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const trendData = useMemo(() => {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = subDays(new Date(), i);
      return format(d, 'MMM dd');
    }).reverse();

    const data = last7Days.map(date => ({ date, amount: 0 }));
    
    expenses.filter(e => e.type !== 'Income').forEach(e => {
      const eDate = format(parseISO(e.date), 'MMM dd');
      const idx = data.findIndex(d => d.date === eDate);
      if (idx !== -1) {
        data[idx].amount += Number(e.amount);
      }
    });
    return data;
  }, [expenses]);

  return (
    <div className="space-y-8">
      {/* Financial Weather Banner */}
      <div className={cn("rounded-[2rem] p-6 backdrop-blur-[10px] border shadow-ambient flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-700", weatherState.theme)}>
         <div className="shrink-0 drop-shadow-md">
            {weatherState.icon}
         </div>
         <div>
            <h3 className="text-xl font-manrope font-bold mb-1 opacity-90">Financial Forecast</h3>
            <p className="font-medium opacity-80">{weatherState.msg}</p>
         </div>
      </div>

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card A: Net Worth */}
        <div className={cn(
          "bg-gradient-to-br from-indigo-800 to-violet-900 p-8 rounded-3xl shadow-ambient text-white relative overflow-hidden group transition-all duration-700",
          netWorthUpdated ? "ring-4 ring-indigo-400 scale-[1.02] shadow-[0_0_40px_rgba(79,70,229,0.6)]" : ""
        )}>
          <div className={cn("absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mx-10 -my-10 transition-transform duration-500", netWorthUpdated ? "scale-150" : "group-hover:scale-110")}></div>
          <p className="text-indigo-200 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Net Worth
          </p>
          <h3 className="text-4xl lg:text-5xl font-manrope font-bold">₹{netWorth.toFixed(2)}</h3>
        </div>
        
        {/* Card B: Monthly P&L */}
        <div className={cn(
            "glass-effect-dark p-8 rounded-3xl shadow-ambient transition-colors flex flex-col justify-center",
            isDeficit ? "border-rose-400 bg-rose-500/5 hover:bg-rose-500/10" : "border-surface-container-high hover:bg-surface-bright"
          )}>
          <div className="flex items-center gap-4">
            <div className={cn("p-4 rounded-2xl", isDeficit ? "bg-rose-200 text-rose-700" : "bg-emerald-200 text-emerald-700")}>
               {isDeficit ? <TrendingDown className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
            </div>
            <div>
               <p className="text-on-surface-variant font-medium text-sm mb-1 uppercase tracking-wide flex items-center gap-1">
                 Monthly P&L {isDeficit && <AlertTriangle className="w-4 h-4 text-rose-500" />}
               </p>
               <div className="flex items-baseline gap-2">
                 <span className={cn("text-3xl font-manrope font-bold", isDeficit ? "text-rose-600" : "text-emerald-600")}>
                   {isDeficit ? '-' : '+'}₹{Math.abs(monthlyPL).toFixed(2)}
                 </span>
               </div>
               <p className={cn("text-xs font-semibold mt-1", isDeficit ? "text-rose-500" : "text-emerald-500")}>
                 {isDeficit ? "DEFICIT" : "SURPLUS"}
               </p>
            </div>
          </div>
        </div>

        {/* Card C: Total Expenses */}
        <div className="bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl shadow-ambient text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mx-10 -my-10 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-primary-fixed-dim text-sm font-semibold uppercase tracking-wider mb-2">Total Expenses</p>
          <h3 className="text-4xl lg:text-5xl font-manrope font-bold">₹{totalExpenses.toFixed(2)}</h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-effect-dark p-6 rounded-3xl transition-colors">
          <h4 className="text-lg font-manrope font-semibold mb-6 text-on-surface">Weekly Spending Trend</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#777587', fontSize: 12}} />
                <YAxis hide />
                <RechartsTooltip 
                  cursor={{fill: '#f5f2ff'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} 
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 glass-effect-dark p-6 rounded-3xl transition-colors">
          <h4 className="text-lg font-manrope font-semibold mb-6 text-on-surface">Category Split</h4>
          {categoryData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-on-surface-variant opacity-70">
              <p>No data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
