// Dataset Types
export interface Dataset {
  id: string;
  name: string;
  file_type: 'csv' | 'xlsx' | 'xls';
  file_size: number;
  row_count: number;
  column_count: number;
  columns: ColumnInfo[];
  has_headers: boolean;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnInfo {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  sample?: string | number | boolean;
}

export interface DataRow {
  id: string;
  dataset_id: string;
  row_index: number;
  row_data: Record<string, unknown>;
}

// Data Profile Types
export interface DataProfile {
  id: string;
  dataset_id: string;
  column_name: string;
  data_type: string;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  duplicate_count: number;
  min_value?: string;
  max_value?: string;
  mean_value?: number;
  median_value?: number;
  std_dev?: number;
  quartiles?: {
    q1: number;
    q2: number;
    q3: number;
  };
  top_values: Array<{ value: string; count: number }>;
  histogram: Array<{ bin: string; count: number }>;
}

export interface DatasetStats {
  totalRows: number;
  totalColumns: number;
  missingValues: number;
  missingPercentage: number;
  duplicateRows: number;
  numericColumns: number;
  textColumns: number;
  dateColumns: number;
  memoryUsage: string;
}

// Chat Types
export interface ChatSession {
  id: string;
  dataset_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  query_type?: 'question' | 'visualization' | 'insight' | 'forecast' | 'general';
  chart_config?: ChartConfig;
  query_result?: Record<string, unknown>;
  execution_time_ms?: number;
  created_at: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'area';
  title: string;
  x_axis: string;
  y_axis: string;
  data: ChartDataPoint[];
  colors?: string[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Insight Types
export interface Insight {
  id: string;
  dataset_id: string;
  category: 'trend' | 'opportunity' | 'risk' | 'recommendation' | 'key_finding';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  related_columns: string[];
  confidence_score: number;
  created_at: string;
}

// Forecast Types
export interface Forecast {
  id: string;
  dataset_id: string;
  target_column: string;
  date_column?: string;
  forecast_type: 'linear' | 'moving_average' | 'exponential_smoothing';
  forecast_data: ForecastPoint[];
  confidence_interval?: {
    lower: number[];
    upper: number[];
  };
  accuracy_metrics?: {
    mae: number;
    rmse: number;
    mape: number;
  };
  created_at: string;
}

export interface ForecastPoint {
  date?: string;
  index: number;
  actual?: number;
  predicted: number;
  lower?: number;
  upper?: number;
}

// Report Types
export interface Report {
  id: string;
  dataset_id: string;
  user_id: string;
  title: string;
  report_type: 'pdf' | 'excel' | 'csv';
  content: ReportContent;
  file_path?: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
  created_at: string;
}

export interface ReportContent {
  summary: string;
  statistics: DatasetStats;
  insights: Insight[];
  charts: ChartConfig[];
  recommendations: string[];
}

// Dashboard Types
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'insight' | 'forecast';
  title: string;
  config: Record<string, unknown>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: string;
}

// Upload Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'processing' | 'profiling' | 'complete' | 'error';
}

export interface FileValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimated_rows: number;
  estimated_columns: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Application State Types
export type AppView = 'dashboard' | 'upload' | 'data' | 'chat' | 'insights' | 'forecasts' | 'reports';

export interface AppState {
  currentView: AppView;
  currentDataset: Dataset | null;
  isLoading: boolean;
  error: string | null;
}
