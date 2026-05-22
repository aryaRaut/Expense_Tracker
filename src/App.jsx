import React, { useState, useEffect, useMemo } from 'react';
import { fetchExpenses, addExpense, deleteExpense, updateExpense } from './services/api';
import { fetchAccounts } from './services/accounts';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import SplitSettlement from './components/SplitSettlement';
import SplitsDashboard from './components/SplitsDashboard';
import AccountSwitcher from './components/AccountSwitcher';
import AccountSettings from './components/AccountSettings';
import TransferForm from './components/TransferForm';
import TransferList from './components/TransferList';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';
import {
  Activity, PlusCircle, LayoutDashboard, Wallet,
  LogOut, Plus, ArrowUpCircle, ArrowDownCircle, Users, MoveRight
} from 'lucide-react';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [notification, setNotification] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [netWorthUpdated, setNetWorthUpdated] = useState(false);

  const [session, setSession] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [initialTransactionType, setInitialTransactionType] = useState('Expense');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pendingSplitExpense, setPendingSplitExpense] = useState(null);
  const [transferRefresh, setTransferRefresh] = useState(0);

  // ── Auth ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthInitialized(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadData(); }, [session]);

  // ── Load data ─────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, accData] = await Promise.all([
        fetchExpenses(),
        fetchAccounts(),
      ]);
      setExpenses(expData);
      setAccounts(accData);
    } catch (err) {
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    if (!selectedAccountId) return expenses;
    return expenses.filter((e) => e.account_id === selectedAccountId);
  }, [expenses, selectedAccountId]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleAddExpense = async (expense) => {
    setAdding(true);
    try {
      const newExp = await addExpense(expense);
      setExpenses([newExp, ...expenses]);
      showNotification('Transaction added', 'success');
      setActiveTab('dashboard');
    } catch (err) {
      showNotification('Failed to add transaction', 'error');
    } finally {
      setAdding(false);
      setPendingSplitExpense(null);
    }
  };

  const handleProceedToSplit = (expenseData) => {
    setPendingSplitExpense(expenseData);
    setActiveTab('split');
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
      showNotification('Transaction deleted', 'success');
      if (activeTab === 'splits') {
        setActiveTab('dashboard');
        setTimeout(() => setActiveTab('splits'), 100);
      }
    } catch (err) {
      showNotification('Failed to delete transaction', 'error');
    }
  };

  const handleEditExpense = async (updatedExpense) => {
    try {
      const saved = await updateExpense(updatedExpense.id, updatedExpense);
      // Replace the old expense in state with the updated one
      setExpenses((prev) =>
        prev.map((e) => (e.id === saved.id ? saved : e))
      );
      showNotification('Transaction updated!', 'success');
    } catch (err) {
      showNotification('Failed to update transaction', 'error');
      throw err; // re-throw so modal stays open on error
    }
  };

  const handleTransferSuccess = (transfer) => {
    showNotification('Transfer recorded successfully!', 'success');
    setTransferRefresh((n) => n + 1);
    setActiveTab('transfers');
  };

  const handleAccountsChanged = (updatedAccounts) => {
    setAccounts(updatedAccounts);
    if (selectedAccountId && !updatedAccounts.find((a) => a.id === selectedAccountId)) {
      setSelectedAccountId(null);
    }
    // Flash net worth update animation
    setNetWorthUpdated(true);
    setTimeout(() => setNetWorthUpdated(false), 3000);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Guards ────────────────────────────────────────────────
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface flex flex-col md:flex-row">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 glass-effect sticky top-0 z-20 border-b border-outline-variant/20">
        <h1 className="text-lg font-manrope font-bold text-primary flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Auditor
        </h1>
        <div className="w-44">
          <AccountSwitcher
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelect={setSelectedAccountId}
          />
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-full w-64 bg-surface-container-lowest border-r border-outline-variant/20 p-6 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 glass-effect flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <h1 className="text-2xl font-manrope font-bold text-primary hidden md:flex items-center gap-2 mb-6 tracking-tight">
          <Activity className="w-8 h-8 text-primary" />
          The Expense Auditor
        </h1>

        {/* Account Switcher */}
        <div className="hidden md:block mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2 ml-1">Viewing</p>
          <AccountSwitcher
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelect={setSelectedAccountId}
          />
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {[
            { tab: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
            { tab: 'add', icon: <PlusCircle className="w-5 h-5" />, label: 'Add Transaction' },
            { tab: 'splits', icon: <Users className="w-5 h-5" />, label: 'Splits' },
            { tab: 'transfers', icon: <MoveRight className="w-5 h-5" />, label: 'Transfers' },
            { tab: 'settings', icon: <Wallet className="w-5 h-5" />, label: 'Account Settings' },
          ].map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'add') setInitialTransactionType('Expense');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 font-medium text-sm px-4 py-3 rounded-2xl transition-all ${activeTab === tab
                  ? 'bg-surface-container-low text-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low/50 hover:text-on-surface'
                }`}
            >
              {icon}{label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 font-medium text-sm px-4 py-3 rounded-2xl transition-all text-on-surface-variant hover:bg-error-container hover:text-on-error-container w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-4 py-6 pb-28 md:pb-10 md:px-8 md:py-10 lg:p-12 max-w-6xl mx-auto space-y-6 w-full animate-in fade-in duration-500">

        {/* Notification */}
        {notification && (
          <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4">
            <div className={`px-6 py-4 rounded-2xl backdrop-blur-md flex items-center gap-3 border shadow-ambient ${notification.type === 'error'
                ? 'bg-tertiary-container/90 border-tertiary text-tertiary-fixed'
                : 'bg-emerald-600/95 border-emerald-500 text-white shadow-[0_8px_30px_rgba(52,211,153,0.4)]'
              }`}>
              <span className="font-semibold">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Active account banner */}
        {selectedAccount && (
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-semibold animate-in fade-in duration-300"
            style={{
              backgroundColor: selectedAccount.color + '12',
              borderColor: selectedAccount.color + '33',
              color: selectedAccount.color,
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedAccount.color }} />
            Viewing: {selectedAccount.name}
            <span className="ml-auto opacity-70 font-medium">{selectedAccount.type}</span>
            <button
              onClick={() => setSelectedAccountId(null)}
              className="ml-2 text-xs underline opacity-70 hover:opacity-100 transition-opacity"
            >
              Clear
            </button>
          </div>
        )}

        {/* Tab rendering */}
        {loading ? (

          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>

        ) : activeTab === 'settings' ? (

          // Settings — only bank accounts, no net worth form
          <div className="max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-500">
            <header className="mb-8">
              <h2 className="text-3xl font-manrope font-extrabold tracking-tight">Account Settings</h2>
              <p className="text-on-surface-variant mt-2">Manage your bank accounts and wallets.</p>
            </header>
            <AccountSettings onAccountsChanged={handleAccountsChanged} />
          </div>

        ) : activeTab === 'add' ? (

          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
            <header className="mb-8">
              <h2 className="text-3xl font-manrope font-extrabold tracking-tight">Record Transaction</h2>
              <p className="text-on-surface-variant mt-2">Log a new income or expense to keep your tracking accurate.</p>
            </header>
            <div className="scale-[1.02] transform origin-top">
              <ExpenseForm
                onAdd={handleAddExpense}
                isLoading={adding}
                initialTransactionType={initialTransactionType}
                onProceedToSplit={handleProceedToSplit}
              />
            </div>
          </div>

        ) : activeTab === 'split' && pendingSplitExpense ? (

          <div className="animate-in fade-in duration-500">
            <SplitSettlement
              expenseData={pendingSplitExpense}
              onFinalize={handleAddExpense}
              onCancel={() => { setPendingSplitExpense(null); setActiveTab('add'); }}
              isLoading={adding}
            />
          </div>

        ) : activeTab === 'splits' ? (

          <SplitsDashboard />

        ) : activeTab === 'transfers' ? (

          <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-8">
            <header>
              <h2 className="text-3xl font-manrope font-extrabold tracking-tight flex items-center gap-3">
                <MoveRight className="w-7 h-7 text-primary" />
                Transfers
              </h2>
              <p className="text-on-surface-variant mt-2">
                Move money between your accounts without affecting your net worth.
              </p>
            </header>
            <TransferForm
              onSuccess={handleTransferSuccess}
              onCancel={() => setActiveTab('dashboard')}
            />
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-outline-variant/20" />
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Transfer History</span>
              <div className="flex-1 border-t border-outline-variant/20" />
            </div>
            <TransferList refreshTrigger={transferRefresh} />
          </div>

        ) : (

          // Dashboard (default)
          <div className="animate-in fade-in duration-500 space-y-10">
            <header>
              <h2 className="text-3xl font-manrope font-extrabold tracking-tight mb-2">
                {selectedAccount ? `${selectedAccount.name} — Overview` : 'Overview'}
              </h2>
            </header>
            <Dashboard
              expenses={filteredExpenses}
              accounts={accounts}
              selectedAccount={selectedAccount}
              netWorthUpdated={netWorthUpdated}
              onSelectAccount={setSelectedAccountId}
            />
            <div className="mt-12">
              <ExpenseList expenses={filteredExpenses} onDelete={handleDeleteExpense} onEdit={handleEditExpense} />
            </div>
          </div>

        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant/20 px-6 py-4 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between relative">

          {/* Left side */}
          <button
            onClick={() => { setActiveTab('dashboard'); setShowAddMenu(false); }}
            className={`flex flex-col items-center gap-1 p-2 flex-1 ${activeTab === 'dashboard' ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('splits'); setShowAddMenu(false); }}
            className={`flex flex-col items-center gap-1 p-2 flex-1 ${activeTab === 'splits' ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Splits</span>
          </button>

          {/* FAB — center */}
          <div className="relative flex-1 flex justify-center -top-5">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-300 ${showAddMenu ? 'rotate-45 bg-surface-variant text-on-surface-variant' : 'bg-primary hover:scale-105'}`}
            >
              <Plus className="w-8 h-8" />
            </button>
            {showAddMenu && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in z-50">
                <button
                  onClick={() => { setInitialTransactionType('Income'); setActiveTab('add'); setShowAddMenu(false); }}
                  className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-2xl shadow-xl border border-outline-variant/10 text-emerald-600 font-semibold text-sm whitespace-nowrap hover:bg-emerald-50 transition-colors"
                >
                  <ArrowDownCircle className="w-5 h-5" />
                  Add Income
                </button>
                <button
                  onClick={() => { setInitialTransactionType('Expense'); setActiveTab('add'); setShowAddMenu(false); }}
                  className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-2xl shadow-xl border border-outline-variant/10 text-rose-500 font-semibold text-sm whitespace-nowrap hover:bg-rose-50 transition-colors"
                >
                  <ArrowUpCircle className="w-5 h-5" />
                  Add Expense
                </button>
              </div>
            )}
          </div>

          {/* Right side */}
          <button
            onClick={() => { setActiveTab('transfers'); setShowAddMenu(false); }}
            className={`flex flex-col items-center gap-1 p-2 flex-1 ${activeTab === 'transfers' ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <MoveRight className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Transfers</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setShowAddMenu(false); }}
            className={`flex flex-col items-center gap-1 p-2 flex-1 ${activeTab === 'settings' ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <Wallet className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Settings</span>
          </button>

        </div>
      </div>

      {showAddMenu && (
        <div
          className="fixed inset-0 bg-on-surface/5 backdrop-blur-[2px] z-30 md:hidden"
          onClick={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
}

export default App;