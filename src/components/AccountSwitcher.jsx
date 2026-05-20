import React, { useState } from 'react';
import { ChevronDown, Wallet, Check } from 'lucide-react';
import { cn } from '../utils/cn';

export default function AccountSwitcher({ accounts, selectedAccountId, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 text-left',
          isOpen
            ? 'bg-surface-container-low border-primary/30 shadow-sm'
            : 'bg-surface-container-low/60 border-outline-variant/20 hover:bg-surface-container-low'
        )}
      >
        {selectedAccount ? (
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: selectedAccount.color }}
          />
        ) : (
          <Wallet className="w-4 h-4 text-primary shrink-0" />
        )}
        <span className="flex-1 font-semibold text-sm text-on-surface truncate">
          {selectedAccount ? selectedAccount.name : 'All Accounts'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-on-surface-variant transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

            {/* All Accounts */}
            <button
              onClick={() => { onSelect(null); setIsOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low',
                !selectedAccountId && 'bg-primary/5'
              )}
            >
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-on-surface">All Accounts</p>
                <p className="text-xs text-on-surface-variant">
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              {!selectedAccountId && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>

            {accounts.length > 0 && <div className="border-t border-outline-variant/10 mx-3" />}

            {/* Individual accounts */}
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => { onSelect(account.id); setIsOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low',
                  selectedAccountId === account.id && 'bg-primary/5'
                )}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: account.color + '22' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: account.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface truncate">{account.name}</p>
                  <p className="text-xs text-on-surface-variant">{account.type}</p>
                </div>
                {selectedAccountId === account.id && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}

            {accounts.length === 0 && (
              <div className="px-4 py-3 text-xs text-on-surface-variant text-center">
                No accounts yet. Add one in Settings.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}