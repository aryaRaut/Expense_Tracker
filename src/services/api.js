import { supabase } from '../supabaseClient';

const API_BASE = '/api';

const getAuthHeaders = async (existingHeaders = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      ...existingHeaders,
      'Authorization': `Bearer ${session.access_token}`
    };
  }
  return existingHeaders;
};

export const fetchExpenses = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/expenses`, { headers });
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};

export const addExpense = async (expenseData) => {
  try {
    const headers = await getAuthHeaders({
      'Content-Type': 'application/json',
    });
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(expenseData)
    });
    if (!response.ok) throw new Error('Failed to add expense');
    return await response.json();
  } catch (error) {
    console.error("Add error:", error);
    throw error;
  }
};

export const deleteExpense = async (id) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to delete expense');
    return true;
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};

export const fetchMetaData = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/meta`, { headers });
    if (!response.ok) throw new Error('Failed to fetch meta data');
    return await response.json();
  } catch (error) {
    console.error("Fetch meta error:", error);
    return { startingBalance: 0 };
  }
};

export const updateMetaData = async (startingBalance) => {
  try {
    const headers = await getAuthHeaders({
      'Content-Type': 'application/json',
    });
    const response = await fetch(`${API_BASE}/meta`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ startingBalance })
    });
    if (!response.ok) throw new Error('Failed to update meta data');
    return await response.json();
  } catch (error) {
    console.error("Update meta error:", error);
    throw error;
  }
};

export const fetchSplits = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/splits`, { headers });
    if (!response.ok) throw new Error('Failed to fetch splits');
    return await response.json();
  } catch (error) {
    console.error("Fetch splits error:", error);
    return [];
  }
};

export const updateSplitPaidStatus = async (splitId, isPaid) => {
  try {
    const headers = await getAuthHeaders({
      'Content-Type': 'application/json',
    });
    const response = await fetch(`${API_BASE}/splits/${splitId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ is_paid: isPaid })
    });
    if (!response.ok) throw new Error('Failed to update split');
    return await response.json();
  } catch (error) {
    console.error("Update split error:", error);
    throw error;
  }
};