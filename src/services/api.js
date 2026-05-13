import { supabase } from '../supabaseClient';

// Helper to get current user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
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
  const { data, error } = await supabase
    .from('expenses')
    .insert([expenseData])
    .select()
    .single();

  if (error) throw error;
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
  
  // UPDATED: Changed column names to match image_e9735f.png
  const { data, error } = await supabase
    .from('split_details')
    .select(`
      id,
      name:friend_name,    /* Mapping friend_name to 'name' for the UI */
      amount:amount_owed,  /* Mapping amount_owed to 'amount' for the UI */
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

  if (error) throw error;
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

  if (error) throw error;
  return data;
};