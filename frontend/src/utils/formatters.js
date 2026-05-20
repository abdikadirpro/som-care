export const formatCurrency = (amount, currency = 'ETB') =>
  `${currency} ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export const isExpiringSoon = (date, days = 30) => {
  if (!date) return false;
  const expiry = new Date(date);
  const future = new Date();
  future.setDate(future.getDate() + days);
  return expiry <= future && expiry >= new Date();
};

export const isExpired = (date) => date && new Date(date) < new Date();

export const stockStatus = (qty, min) => {
  if (qty === 0) return { label: 'Out of Stock', color: '#ef4444' };
  if (qty <= min) return { label: 'Low Stock', color: '#f59e0b' };
  return { label: 'In Stock', color: '#22c55e' };
};

export const truncate = (str, n = 40) => str?.length > n ? str.slice(0, n) + '...' : str;
