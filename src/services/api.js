import { supabase } from '../supabaseClient';

// Helper to get current user ID reliably
const getUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.error("User not authenticated");
    return null;
  }
  return user.id;
};

export const fetchExpenses = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id) // ← add this line
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }
  return data;
};

/**
 * UPDATED: Combined Save Logic
 * This ensures that if the category is 'Lending', 
 * a record is created in BOTH 'expenses' and 'split_details'.
 */
// ─────────────────────────────────────────────────────────────
// In src/services/api.js
// REPLACE the entire addExpense function with this:
// ─────────────────────────────────────────────────────────────

export const addExpense = async (expenseData) => {
  const userId = await getUserId();
  if (!userId) throw new Error("Authentication required");

  const expensePayload = {
    user_id: userId,
    description: expenseData.description || expenseData.desc || "Untitled Expense",
    amount: parseFloat(expenseData.amount) || 0,
    category: expenseData.category || "General",
    date: expenseData.date || new Date().toISOString().split('T')[0],
    // ── NEW: attach account_id if provided ──
    account_id: expenseData.account_id || null,
    type: expenseData.type || 'Expense',
  };

  const { data: newExpense, error: expenseError } = await supabase
    .from('expenses')
    .insert([expensePayload])
    .select()
    .single();

  if (expenseError) {
    console.error("Supabase Add Expense Error:", expenseError.message);
    throw expenseError;
  }

  // Handle Lending/Friends split creation
  if (expensePayload.category.toLowerCase() === 'lending/friends' ||
      expensePayload.category.toLowerCase() === 'lending') {
    const splitPayload = {
      user_id: userId,
      expense_id: newExpense.id,
      friend_name: expenseData.friend_name || 'New Friend',
      amount_owed: expensePayload.amount,
      is_paid: false,
    };

    const { error: splitError } = await supabase
      .from('split_details')
      .insert([splitPayload]);

    if (splitError) {
      console.error("Split Creation failed, but expense was saved:", splitError.message);
    }
  }

  return newExpense;
};

export const updateExpense = async (id, updates) => {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required');

  const payload = {
    description: updates.description,
    amount:      parseFloat(updates.amount),
    category:    updates.category,
    date:        updates.date,
    type:        updates.type,
    account_id:  updates.account_id || null,
  };

  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Update expense error:', error.message);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Transaction not found or unauthorized');
  }

  return data[0];
};

export const deleteExpense = async (id) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // ← add this line

  if (error) {
    console.error("Delete failed:", error.message);
    throw error;
  }
  return true;
};

// --- SPLITS LOGIC ---

export const fetchSplits = async () => {
  const userId = await getUserId();
  if (!userId) return [];
  
  // Flat select string to avoid PGRST100 parser errors
  const { data, error } = await supabase
    .from('split_details')
    .select('id,friend_name,amount_owed,is_paid,created_at,expenses(description,date,category)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch splits error:", error.message);
    return [];
  }
  return data;
};

export const updateSplitPaidStatus = async (splitId, isPaid) => {
  const { data, error } = await supabase
    .from('split_details')
    .update({ is_paid: isPaid })
    .eq('id', splitId)
    .select()
    .single();

  if (error) {
    console.error("Update split error:", error);
    throw error;
  }
  return data;
};

// --- META DATA LOGIC ---

export const fetchMetaData = async () => {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('user_meta')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Fetch meta error:", error);
  }
  
  // Map snake_case DB column back to camelCase for the app
  return { startingBalance: data?.starting_balance || 0 };
};

export const updateMetaData = async (startingBalance) => {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('user_meta')
    .upsert({ 
      user_id: userId, 
      starting_balance: startingBalance  // ← snake_case to match DB
    })
    .select()
    .single();

  if (error) {
    console.error("Update meta error:", error);
    throw error;
  }
  return data;
};