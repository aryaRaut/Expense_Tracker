import React, { useMemo } from 'react';
import { PiggyBank, Building2, CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react';
import { cn } from '../utils/cn';

function AccountIcon({ type, size = 4 }) {
  const cls = `w-${size} h-${size}`;
  if (type === 'Credit Card')   return <CreditCard  className={cls} />;
  if (type === 'Cash')          return <Banknote    className={cls} />;
  if (type === 'UPI Wallet')    return <Smartphone  className={cls} />;
  if (type === 'Savings' || type === 'Fixed Deposit') return <PiggyBank  className={cls} />;
  if (type === 'Salary' || type === 'Current')        return <Building2  className={cls} />;
  return <Wallet className={cls} />;
}

export default function AccountsBreakdown({ accounts, expenses, onSelectAccount }) {
  // Calculate live balance per account:
  // live balance = starting_balance + income transactions - expense transactions
  const accountsWithBalance = useMemo(() => {
    return accounts.map((account) => {
      const accountExpenses = expenses.filter((e) => e.account_id === account.id);
      const income  = accountExpenses.filter((e) => e.type === 'Income').reduce((s, e) => s + Number(e.amount), 0);
      const expense = accountExpenses.filter((e) => e.type !== 'Income').reduce((s, e) => s + Number(e.amount), 0);
      const liveBalance = parseFloat(account.starting_balance || 0) + income - expense;
      return { ...account, liveBalance, txCount: accountExpenses.length };
    });
  }, [accounts, expenses]);

  // Total net worth across all accounts (exclude credit cards from positive sum)
  const totalNetWorth = useMemo(() => {
    return accountsWithBalance.reduce((sum, a) => sum + a.liveBalance, 0);
  }, [accountsWithBalance]);

  if (accounts.length === 0) return null;

  return (
    <div className="glass-effect-dark rounded-[2rem] p-6 border border-outline-variant/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-manrope font-bold text-on-surface">
            Accounts Breakdown
          </h4>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Click any account to filter the dashboard
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
            Combined Balance
          </p>
          <p className={cn(
            'font-manrope font-bold text-xl',
            totalNetWorth >= 0 ? 'text-on-surface' : 'text-rose-500'
          )}>
            {totalNetWorth < 0 ? '-' : ''}
            ₹{Math.abs(totalNetWorth).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Account rows */}
      <div className="space-y-3">
        {accountsWithBalance.map((account) => {
          // Width of progress bar = account's share of total absolute balances
          const totalAbs = accountsWithBalance.reduce((s, a) => s + Math.abs(a.liveBalance), 0);
          const barWidth = totalAbs > 0 ? (Math.abs(account.liveBalance) / totalAbs) * 100 : 0;
          const isNegative = account.liveBalance < 0;

          return (
            <button
              key={account.id}
              onClick={() => onSelectAccount(account.id)}
              className="w-full text-left group"
            >
              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-low/60 transition-all duration-200 group-hover:-translate-y-0.5">

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: account.color }}
                >
                  <AccountIcon type={account.type} size={4} />
                </div>

                {/* Name + type + tx count */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-sm text-on-surface truncate">
                      {account.name}
                    </p>
                    <p className={cn(
                      'font-manrope font-bold text-sm shrink-0',
                      isNegative ? 'text-rose-500' : 'text-on-surface'
                    )}>
                      {isNegative ? '-' : ''}
                      ₹{Math.abs(account.liveBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: isNegative ? '#f43f5e' : account.color,
                      }}
                    />
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-on-surface-variant">
                      {account.type}
                      {account.txCount > 0 && (
                        <span className="ml-1.5 opacity-60">
                          • {account.txCount} txn{account.txCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-on-surface-variant opacity-60">
                      {totalAbs > 0
                        ? `${((Math.abs(account.liveBalance) / totalAbs) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer: credit card warning if any */}
      {accountsWithBalance.some((a) => a.type === 'Credit Card' && a.liveBalance < 0) && (
        <div className="mt-4 pt-4 border-t border-outline-variant/10 text-xs text-on-surface-variant flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          Credit card balances shown in red reduce your net worth.
        </div>
      )}
    </div>
  );
}