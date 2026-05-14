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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const expensePayload = {
    user_id: user.id,
    description: expenseData.description || expenseData.desc || "Untitled",
    amount: parseFloat(expenseData.amount) || 0,
    category: expenseData.category || "Other",
    date: expenseData.date || new Date().toISOString().split('T')[0],
  };

  const { data: newExpense, error: expenseError } = await supabase
    .from('expenses')
    .insert([expensePayload])
    .select()
    .single();

  if (expenseError) {
    console.error("Expense insert failed:", expenseError.message);
    throw expenseError;
  }

  console.log("✅ Expense saved:", newExpense);
  console.log("Category value:", JSON.stringify(expensePayload.category));

  const isLending = expensePayload.category.toLowerCase().includes('lending');
  console.log("Is lending?", isLending);

  if (isLending) {
    const splits = expenseData.split_details?.length > 0
      ? expenseData.split_details
      : [{ name: expenseData.friend_name || 'Friend', amount: expensePayload.amount, paid: false }];

    console.log("Split rows to insert:", splits);

    const splitRows = splits.map(split => ({
      user_id: user.id,
      expense_id: newExpense.id,
      friend_name: split.name || split.friend_name || 'Unknown',
      amount: parseFloat(split.amount) || 0,
      is_paid: split.paid || split.is_paid || false,
    }));

    console.log("Inserting into split_details:", splitRows);

    const { data: splitData, error: splitError } = await supabase
      .from('split_details')
      .insert(splitRows)
      .select();  // ← add .select() so you can see what was actually inserted

    if (splitError) {
      console.error("❌ Split insert failed:", splitError.message, "Code:", splitError.code, "Details:", splitError.details);
    } else {
      console.log("✅ Split rows inserted:", splitData);
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
    .select('id,friend_name,amount,is_paid,created_at,expenses(description,date,category)')
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