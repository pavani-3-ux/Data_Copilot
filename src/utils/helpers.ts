export const colors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#10b981',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  chart: [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#6366f1',
  ],
};

export function formatNumber(value: number, decimals = 2): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(decimals) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(decimals) + 'K';
  }
  return value.toFixed(decimals);
}

export function formatPercentage(value: number, decimals = 1): string {
  return value.toFixed(decimals) + '%';
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const value = row[h];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');
  downloadFile(csvContent, filename, 'text/csv');
}

export function getChartTypeForQuery(query: string): 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('trend') || lowerQuery.includes('over time') || lowerQuery.includes('monthly') || lowerQuery.includes('yearly')) {
    return 'line';
  }
  if (lowerQuery.includes('distribution') || lowerQuery.includes('histogram')) {
    return 'histogram';
  }
  if (lowerQuery.includes('correlation') || lowerQuery.includes('relationship') || lowerQuery.includes('vs')) {
    return 'scatter';
  }
  if (lowerQuery.includes('proportion') || lowerQuery.includes('percentage') || lowerQuery.includes('share')) {
    return 'pie';
  }
  return 'bar';
}

export const sampleQueries = [
  "Which product generated the highest revenue?",
  "Show monthly sales trend",
  "Which region performed best?",
  "What are the top 10 customers?",
  "Compare sales by category",
  "What is the average order value?",
  "Show revenue distribution",
  "Which products have declining sales?",
  "What are the seasonal patterns?",
  "Analyze customer segments",
];
