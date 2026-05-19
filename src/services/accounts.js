import { supabase } from '../supabaseClient';

const getUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
};

export const fetchAccounts = async () => {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Fetch accounts error:', error.message);
    return [];
  }
  return data;
};

export const addAccount = async (accountData) => {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required');

  const payload = {
    user_id: userId,
    name: accountData.name,
    type: accountData.type,
    starting_balance: parseFloat(accountData.starting_balance) || 0,
    color: accountData.color || '#6366f1',
    icon: accountData.icon || 'wallet',
  };

  const { data, error } = await supabase
    .from('accounts')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Add account error:', error.message);
    throw error;
  }
  return data;
};

export const updateAccount = async (accountId, updates) => {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('accounts')
    .update({
      name: updates.name,
      type: updates.type,
      starting_balance: parseFloat(updates.starting_balance) || 0,
      color: updates.color,
      icon: updates.icon,
    })
    .eq('id', accountId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update account error:', error.message);
    throw error;
  }
  return data;
};

export const deleteAccount = async (accountId, moveToAccountId = null) => {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required');

  // If moveToAccountId provided, reassign transactions first
  if (moveToAccountId) {
    const { error: moveError } = await supabase
      .from('expenses')
      .update({ account_id: moveToAccountId })
      .eq('account_id', accountId)
      .eq('user_id', userId);

    if (moveError) {
      console.error('Move transactions error:', moveError.message);
      throw moveError;
    }
  } else {
    // Set account_id to null on all linked transactions
    const { error: nullError } = await supabase
      .from('expenses')
      .update({ account_id: null })
      .eq('account_id', accountId)
      .eq('user_id', userId);

    if (nullError) {
      console.error('Nullify transactions error:', nullError.message);
      throw nullError;
    }
  }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete account error:', error.message);
    throw error;
  }
  return true;
};

export const fetchAccountTransactionCount = async (accountId) => {
  const { count, error } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId);

  if (error) return 0;
  return count || 0;
};