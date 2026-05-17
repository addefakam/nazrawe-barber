export const formatBirr = (cents: number): string => {
  const birr = cents / 100;
  const formatted = new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(birr);
  return `Br ${formatted}`;
};

/** @deprecated Use formatBirr instead */
export const formatEuro = formatBirr;

export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp));
};

export const formatTime = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-ET', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
};

export type DateFilterType = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

export const filterTransactionsByDate = (transactions: any[], filter: DateFilterType) => {
  const now = new Date();
  
  // Get start of today
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Get start of yesterday
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const endOfYesterday = startOfToday - 1;
  
  // Get start of this week (Monday start)
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday=0
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday).getTime();
  
  // Get start of this month
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  return transactions.filter((tx) => {
    const txTime = tx.timestamp;
    if (filter === 'today') {
      return txTime >= startOfToday;
    } else if (filter === 'yesterday') {
      return txTime >= startOfYesterday && txTime <= endOfYesterday;
    } else if (filter === 'week') {
      return txTime >= startOfThisWeek;
    } else if (filter === 'month') {
      return txTime >= startOfThisMonth;
    } else {
      return true; // 'all'
    }
  });
};
