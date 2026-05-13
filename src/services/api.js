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

export const addExpense = async (expenseData) => {
  const userId = await getUserId();
  if (!userId) throw new Error("Authentication required");

  // Robust payload mapping to prevent 400 errors
  const payload = {
    user_id: userId,
    description: expenseData.description || expenseData.desc || "Untitled Expense",
    amount: parseFloat(expenseData.amount) || 0, // Ensure numeric type
    category: expenseData.category || "General",
    date: expenseData.date || new Date().toISOString().split('T')[0]
  };

  const { data, error } = await supabase
    .from('expenses')
    .insert([payload])
    .select()
    .single();

  if (error) {
    // Detailed logging to pinpoint exact column failures
    console.error("Supabase Add Expense Error:", error.message, error.details);
    throw error;
  }
  return data;
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
  
  // Single-line select string to bypass parser errors (PGRST100)
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