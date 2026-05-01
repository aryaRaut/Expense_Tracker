import React, { useState, useEffect } from 'react';
import { fetchExpenses, addExpense, deleteExpense, fetchMetaData, updateMetaData } from './services/api';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import { Activity, PlusCircle, LayoutDashboard, Wallet, Save, LogOut } from 'lucide-react';
import Auth from './components/Auth';
import { supabase } from './supabaseClient';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [startingBalance, setStartingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [targetBalance, setTargetBalance] = useState('');
  const [netWorthUpdated, setNetWorthUpdated] = useState(false);

  const [session, setSession] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, metaData] = await Promise.all([
        fetchExpenses(),
        fetchMetaData()
      ]);
      setExpenses(expData);
      setStartingBalance(metaData.startingBalance);
    } catch (err) {
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNetWorth = async (e) => {
    e.preventDefault();
    if (!targetBalance) return;
    try {
      const target = parseFloat(targetBalance);
      // Dynamic Rebasing Math
      const tInc = expenses.filter(ex => ex.type === 'Income').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const tExp = expenses.filter(ex => ex.type !== 'Income').reduce((acc, curr) => acc + Number(curr.amount), 0);
      
      const newBase = target - tInc + tExp;
      
      await updateMetaData(newBase);
      setStartingBalance(newBase);
      
      showNotification('Total Balance Updated!', 'success');
      setTargetBalance('');
      setActiveTab('dashboard');
      
      // Trigger success animation
      setNetWorthUpdated(true);
      setTimeout(() => setNetWorthUpdated(false), 3000);
    } catch (err) {
      showNotification('Failed to update balance', 'error');
    }
  };

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
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
      showNotification('Transaction deleted', 'success');
    } catch (err) {
      showNotification('Failed to delete transaction', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-surface font-inter text-on-surface flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-surface-container-lowest border-r border-outline-variant/20 p-6 md:min-h-screen sticky top-0 z-10 glass-effect">
        <h1 className="text-2xl font-manrope font-bold text-primary flex items-center gap-2 mb-10 tracking-tight">
          <Activity className="w-8 h-8 text-primary" />
          The Expense Auditor
        </h1>
        <nav className="flex flex-col gap-3">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex items-center gap-3 font-medium text-sm px-4 py-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-surface-container-low text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low/50 hover:text-on-surface'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('add')} 
            className={`flex items-center gap-3 font-medium text-sm px-4 py-3 rounded-2xl transition-all ${activeTab === 'add' ? 'bg-surface-container-low text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low/50 hover:text-on-surface'}`}
          >
            <PlusCircle className="w-5 h-5" />
            Record Transaction
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`flex items-center gap-3 font-medium text-sm px-4 py-3 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-surface-container-low text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low/50 hover:text-on-surface'}`}
          >
            <Wallet className="w-5 h-5" />
            Account Settings
          </button>
        </nav>
        <div className="mt-auto pt-8">
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="flex items-center gap-3 font-medium text-sm px-4 py-3 rounded-2xl transition-all text-on-surface-variant hover:bg-error-container hover:text-on-error-container w-full"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 lg:p-12 max-w-6xl mx-auto space-y-10 w-full animate-in fade-in duration-500">
        {notification && (
          <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4">
            <div className={`px-6 py-4 rounded-2xl backdrop-blur-md flex items-center gap-3 border shadow-ambient ${notification.type === 'error' ? 'bg-tertiary-container/90 border-tertiary text-tertiary-fixed' : 'bg-emerald-600/95 border-emerald-500 text-white shadow-[0_8px_30px_rgba(52,211,153,0.4)]'}`}>
              <span className="font-semibold">{notification.message}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-500">
            <header className="mb-8">
              <h2 className="text-3xl font-manrope font-extrabold tracking-tight">Account Settings</h2>
              <p className="text-on-surface-variant mt-2">Manage your financial baseline and configuration.</p>
            </header>

            <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-surface-container-high">
              <h3 className="text-xl font-manrope font-semibold text-on-surface flex items-center gap-2 mb-6">
                <Wallet className="w-5 h-5 text-primary" />
                Update Net Worth
              </h3>
              <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
                Enter your exact current bank balance or total net worth today. We will recalculate your underlying financial baseline so your history remains perfectly intact and future transactions continue tracking from this new point.
              </p>

              <form onSubmit={handleUpdateNetWorth} className="space-y-6">
                <div>
                  <label className="block text-label-sm uppercase tracking-wide text-on-surface-variant font-medium mb-2">Current Bank Balance / Net Worth</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-lg">₹</span>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={targetBalance}
                      onChange={(e) => setTargetBalance(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface rounded-2xl py-4 pl-10 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow appearance-none font-semibold text-primary"
                      placeholder="50000.00"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="mt-6 w-full bg-gradient-to-br from-primary to-primary-container hover:from-primary/90 hover:to-primary text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Update Balance
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'add' ? (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
            <header className="mb-8">
              <h2 className="text-3xl font-manrope font-extrabold tracking-tight">Record Transaction</h2>
              <p className="text-on-surface-variant mt-2">Log a new income or expense to keep your tracking accurate.</p>
            </header>
            
            <div className="scale-[1.02] transform origin-top">
              <ExpenseForm onAdd={handleAddExpense} isLoading={adding} />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-10">
            <header>
              <h2 className="text-3xl font-manrope font-extrabold tracking-tight mb-2">Overview</h2>
            </header>

            <Dashboard expenses={expenses} startingBalance={startingBalance} netWorthUpdated={netWorthUpdated} />
            
            <div className="mt-12">
              <h3 className="text-2xl font-manrope font-bold tracking-tight mb-6 hidden">Recent Transactions</h3>
              <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
