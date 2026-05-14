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
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  
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
export const addExpense = async (expenseData) => {
  const userId = await getUserId();
  if (!userId) throw new Error("Authentication required");

  // 1. Prepare Expense Payload
  const expensePayload = {
    user_id: userId,
    description: expenseData.description || expenseData.desc || "Untitled Expense",
    amount: parseFloat(expenseData.amount) || 0,
    category: expenseData.category || "General",
    date: expenseData.date || new Date().toISOString().split('T')[0]
  };

  // 2. Insert into 'expenses' table
  const { data: newExpense, error: expenseError } = await supabase
    .from('expenses')
    .insert([expensePayload])
    .select()
    .single();

  if (expenseError) {
    console.error("Supabase Add Expense Error:", expenseError.message);
    throw expenseError;
  }

  // 3. Handle Split Creation if category is "Lending"
  // Note: Case-insensitive check to be safe
  if (expensePayload.category.toLowerCase() === 'lending') {
    const splitPayload = {
      user_id: userId,
      expense_id: newExpense.id,
      friend_name: expenseData.friend_name || 'New Friend',
      amount_owed: expensePayload.amount,
      is_paid: false
    };

    const { error: splitError } = await supabase
      .from('split_details')
      .insert([splitPayload]);

    if (splitError) {
      console.error("Split Creation failed, but expense was saved:", splitError.message);
      // We don't throw here so the user sees the success of the expense
    }
  }

  return newExpense;
};

export const deleteExpense = async (id) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
  return data || { startingBalance: 0 };
};

export const updateMetaData = async (startingBalance) => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('user_meta')
    .upsert({ user_id: userId, startingBalance })
    .select()
    .single();

  if (error) {
    console.error("Update meta error:", error);
    throw error;
  }
  return data;
};