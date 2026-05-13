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

// FIX: Ensure user_id is included in the insert payload to avoid 400/403 errors
export const addExpense = async (expenseData) => {
  const userId = await getUserId();
  
  const payload = {
    ...expenseData,
    user_id: userId // Explicitly attach the owner ID
  };

  const { data, error } = await supabase
    .from('expenses')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("Supabase Add Expense Error:", error);
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
  
  // Mapping columns for the UI while keeping DB names secure
  const { data, error } = await supabase
    .from('split_details')
    .select(`
      id,
      name:friend_name,
      amount:amount_owed,
      is_paid,
      created_at,
      expenses (
        description,
        date,
        category
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch splits error:", error);
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