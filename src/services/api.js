// Remove the localhost URLs and use relative paths for Vercel
const API_BASE = '/api';

export const fetchExpenses = async () => {
  try {
    const response = await fetch(`${API_BASE}/expenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
};

export const addExpense = async (expenseData) => {
  try {
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE'
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
    const response = await fetch(`${API_BASE}/meta`);
    if (!response.ok) throw new Error('Failed to fetch meta data');
    return await response.json();
  } catch (error) {
    console.error("Fetch meta error:", error);
    return { startingBalance: 0 };
  }
};

export const updateMetaData = async (startingBalance) => {
  try {
    const response = await fetch(`${API_BASE}/meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startingBalance })
    });
    if (!response.ok) throw new Error('Failed to update meta data');
    return await response.json();
  } catch (error) {
    console.error("Update meta error:", error);
    throw error;
  }
};