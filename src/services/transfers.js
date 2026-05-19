import { supabase } from '../supabaseClient';

const getUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
};

export const fetchTransfers = async () => {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('transfers')
    .select(`
      *,
      from_account:from_account_id(id, name, color, type),
      to_account:to_account_id(id, name, color, type)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Fetch transfers error:', error.message);
    return [];
  }
  return data;
};

export const addTransfer = async (transferData) => {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required');

  if (transferData.from_account_id === transferData.to_account_id) {
    throw new Error('From and To accounts must be different');
  }

  const payload = {
    user_id: userId,
    from_account_id: transferData.from_account_id,
    to_account_id: transferData.to_account_id,
    amount: parseFloat(transferData.amount),
    note: transferData.note || null,
    date: transferData.date,
  };

  const { data, error } = await supabase
    .from('transfers')
    .insert([payload])
    .select(`
      *,
      from_account:from_account_id(id, name, color, type),
      to_account:to_account_id(id, name, color, type)
    `)
    .single();

  if (error) {
    console.error('Add transfer error:', error.message);
    throw error;
  }
  return data;
};

export const deleteTransfer = async (transferId) => {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required');

  const { error } = await supabase
    .from('transfers')
    .delete()
    .eq('id', transferId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete transfer error:', error.message);
    throw error;
  }
  return true;
};