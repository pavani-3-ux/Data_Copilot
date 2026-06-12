import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ColumnInfo, DatasetStats, DataProfile, ChartDataPoint } from '../types';

// Parse CSV file
export function parseCSV(file: File): Promise<{ data: Record<string, unknown>[]; columns: ColumnInfo[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const data = results.data as Record<string, unknown>[];
        const columns = inferColumnTypes(data);
        resolve({ data, columns });
      },
      error: (error: Error) => reject(error),
    });
  });
}

// Parse Excel file
export function parseExcel(file: File): Promise<{ data: Record<string, unknown>[]; columns: ColumnInfo[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
        const columns = inferColumnTypes(jsonData);
        resolve({ data: jsonData, columns });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Infer column types from data
export function inferColumnTypes(data: Record<string, unknown>[]): ColumnInfo[] {
  if (data.length === 0) return [];

  const columns: ColumnInfo[] = [];
  const keys = Object.keys(data[0]);

  for (const key of keys) {
    values: for (const row of data) {
      const value = row[key];
      let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
      let nullable = false;

      if (value === null || value === undefined || value === '') {
        nullable = true;
        continue;
      }

      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (typeof value === 'string') {
        const dateValue = new Date(value);
        if (!isNaN(dateValue.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/)) {
          type = 'date';
        }
      }

      columns.push({
        name: key,
        type,
        nullable,
        sample: value as string | number | boolean,
      });
      break values;
    }

    // If all values were null/empty, add as string
    if (!columns.find((c) => c.name === key)) {
      columns.push({
        name: key,
        type: 'string',
        nullable: true,
      });
    }
  }

  return columns;
}

// Calculate dataset statistics
export function calculateDatasetStats(
  data: Record<string, unknown>[],
  columns: ColumnInfo[]
): DatasetStats {
  const totalRows = data.length;
  const totalColumns = columns.length;

  // Count missing values
  let missingValues = 0;
  for (const row of data) {
    for (const col of columns) {
      const value = row[col.name];
      if (value === null || value === undefined || value === '') {
        missingValues++;
      }
    }
  }

  // Calculate missing percentage
  const totalCells = totalRows * totalColumns;
  const missingPercentage = totalCells > 0 ? (missingValues / totalCells) * 100 : 0;

  // Find duplicate rows
  const seenRows = new Set<string>();
  let duplicateRows = 0;
  for (const row of data) {
    const rowKey = JSON.stringify(row);
    if (seenRows.has(rowKey)) {
      duplicateRows++;
    } else {
      seenRows.add(rowKey);
    }
  }

  // Count column types
  const numericColumns = columns.filter((c) => c.type === 'number').length;
  const textColumns = columns.filter((c) => c.type === 'string').length;
  const dateColumns = columns.filter((c) => c.type === 'date').length;

  // Estimate memory usage
  const avgRowSize = JSON.stringify(data[0] || {}).length;
  const memoryUsage = formatBytes(avgRowSize * totalRows);

  return {
    totalRows,
    totalColumns,
    missingValues,
    missingPercentage: Math.round(missingPercentage * 100) / 100,
    duplicateRows,
    numericColumns,
    textColumns,
    dateColumns,
    memoryUsage,
  };
}

// Profile a single column
export function profileColumn(
  data: Record<string, unknown>[],
  columnName: string,
  columnType: 'string' | 'number' | 'date' | 'boolean'
): DataProfile {
  const values = data
    .map((row) => row[columnName])
    .filter((v) => v !== null && v !== undefined && v !== '');

  const missingCount = data.length - values.length;
  const missingPercentage = (missingCount / data.length) * 100;

  // Calculate unique and duplicate counts
  const uniqueValues = new Set(values.map((v) => String(v)));
  const uniqueCount = uniqueValues.size;
  const duplicateCount = values.length - uniqueCount;

  // Initialize profile
  const profile: DataProfile = {
    id: '',
    dataset_id: '',
    column_name: columnName,
    data_type: columnType,
    missing_count: missingCount,
    missing_percentage: Math.round(missingPercentage * 100) / 100,
    unique_count: uniqueCount,
    duplicate_count: duplicateCount,
    top_values: [],
    histogram: [],
  };

  // Numeric statistics
  if (columnType === 'number') {
    const numericValues = values.map((v) => Number(v)).filter((v) => !isNaN(v));
    if (numericValues.length > 0) {
      numericValues.sort((a, b) => a - b);
      profile.min_value = String(numericValues[0]);
      profile.max_value = String(numericValues[numericValues.length - 1]);
      profile.mean_value = calculateMean(numericValues);
      profile.median_value = calculateMedian(numericValues);
      profile.std_dev = calculateStdDev(numericValues);
      profile.quartiles = {
        q1: numericValues[Math.floor(numericValues.length * 0.25)],
        q2: numericValues[Math.floor(numericValues.length * 0.5)],
        q3: numericValues[Math.floor(numericValues.length * 0.75)],
      };
      profile.histogram = generateHistogram(numericValues);
    }
  }

  // Top values for all types
  const valueCounts = new Map<string, number>();
  for (const v of values) {
    const key = String(v);
    valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
  }
  profile.top_values = Array.from(valueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({ value, count }));

  return profile;
}

// Calculate mean
function calculateMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Calculate median
function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate standard deviation
function calculateStdDev(values: number[]): number {
  const mean = calculateMean(values);
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
}

// Generate histogram bins
function generateHistogram(values: number[]): Array<{ bin: string; count: number }> {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
  const binWidth = (max - min) / binCount;

  if (binWidth === 0) {
    return [{ bin: `${min}`, count: values.length }];
  }

  const bins: Array<{ bin: string; count: number }> = [];
  for (let i = 0; i < binCount; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    bins.push({
      bin: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
      count: 0,
    });
  }

  for (const v of values) {
    const binIndex = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
    bins[binIndex].count++;
  }

  return bins;
}

// Format bytes to human readable
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Prepare chart data
export function prepareChartData(
  data: Record<string, unknown>[],
  xColumn: string,
  yColumn: string,
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max'
): ChartDataPoint[] {
  const aggregated = new Map<string, number[]>();

  for (const row of data) {
    const xValue = String(row[xColumn] || '');
    const yValue = Number(row[yColumn]) || 0;

    if (!aggregated.has(xValue)) {
      aggregated.set(xValue, []);
    }
    aggregated.get(xValue)!.push(yValue);
  }

  const result: ChartDataPoint[] = [];

  for (const [name, values] of aggregated) {
    let value: number;
    switch (aggregation) {
      case 'sum':
        value = values.reduce((a, b) => a + b, 0);
        break;
      case 'count':
        value = values.length;
        break;
      case 'avg':
        value = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'min':
        value = Math.min(...values);
        break;
      case 'max':
        value = Math.max(...values);
        break;
      default:
        value = values.reduce((a, b) => a + b, 0);
    }
    result.push({ name, value });
  }

  return result;
}

// Generate forecast data using simple linear regression
export function generateForecast(
  data: Record<string, unknown>[],
  valueColumn: string,
  periodsAhead = 6
): { predicted: number; actual?: number; index: number }[] {
  const values = data.map((row) => Number(row[valueColumn])).filter((v) => !isNaN(v));
  const n = values.length;

  if (n < 2) {
    return values.map((v, i) => ({ predicted: v, actual: v, index: i }));
  }

  // Linear regression
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const result: { predicted: number; actual?: number; index: number }[] = [];

  // Historical predictions
  for (let i = 0; i < n; i++) {
    result.push({
      index: i,
      actual: values[i],
      predicted: Math.round((intercept + slope * i) * 100) / 100,
    });
  }

  // Future predictions
  for (let i = n; i < n + periodsAhead; i++) {
    result.push({
      index: i,
      predicted: Math.round((intercept + slope * i) * 100) / 100,
    });
  }

  return result;
}
