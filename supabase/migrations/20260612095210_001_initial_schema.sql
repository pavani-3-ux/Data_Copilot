-- Create datasets table to store uploaded file metadata
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'xls')),
  file_size BIGINT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  column_count INTEGER NOT NULL DEFAULT 0,
  columns JSONB NOT NULL DEFAULT '[]',
  has_headers BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dataset_data table to store actual data
CREATE TABLE dataset_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  row_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dataset_id, row_index)
);

-- Create data_profiles table to store profiling statistics
CREATE TABLE data_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  data_type TEXT NOT NULL,
  missing_count INTEGER DEFAULT 0,
  missing_percentage NUMERIC(5,2) DEFAULT 0,
  unique_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  min_value TEXT,
  max_value TEXT,
  mean_value NUMERIC,
  median_value NUMERIC,
  std_dev NUMERIC,
  quartiles JSONB,
  top_values JSONB DEFAULT '[]',
  histogram JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dataset_id, column_name)
);

-- Create chat_sessions table to store AI conversations
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table to store individual messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  query_type TEXT CHECK (query_type IN ('question', 'visualization', 'insight', 'forecast', 'general')),
  chart_config JSONB,
  query_result JSONB,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create insights table to store generated insights
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('trend', 'opportunity', 'risk', 'recommendation', 'key_finding')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  importance TEXT CHECK (importance IN ('high', 'medium', 'low')),
  related_columns TEXT[] DEFAULT '{}',
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create forecasts table to store predictions
CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  target_column TEXT NOT NULL,
  date_column TEXT,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('linear', 'moving_average', 'exponential_smoothing')),
  forecast_data JSONB NOT NULL,
  confidence_interval JSONB,
  accuracy_metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reports table to store generated reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('pdf', 'excel', 'csv')),
  content JSONB NOT NULL,
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dashboard_configs table for user dashboard settings
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  layout JSONB NOT NULL DEFAULT '[]',
  widgets JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for datasets
CREATE POLICY "select_own_datasets" ON datasets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_datasets" ON datasets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_datasets" ON datasets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_datasets" ON datasets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for dataset_data
CREATE POLICY "select_own_dataset_data" ON dataset_data FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = dataset_data.dataset_id AND datasets.user_id = auth.uid())
  );
CREATE POLICY "insert_own_dataset_data" ON dataset_data FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = dataset_data.dataset_id AND datasets.user_id = auth.uid())
  );
CREATE POLICY "delete_own_dataset_data" ON dataset_data FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = dataset_data.dataset_id AND datasets.user_id = auth.uid())
  );

-- RLS Policies for data_profiles
CREATE POLICY "select_own_profiles" ON data_profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = data_profiles.dataset_id AND datasets.user_id = auth.uid())
  );
CREATE POLICY "insert_own_profiles" ON data_profiles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = data_profiles.dataset_id AND datasets.user_id = auth.uid())
  );

-- RLS Policies for chat_sessions
CREATE POLICY "select_own_sessions" ON chat_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_sessions" ON chat_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_sessions" ON chat_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_sessions" ON chat_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "select_own_messages" ON chat_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
  );
CREATE POLICY "insert_own_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
  );

-- RLS Policies for insights
CREATE POLICY "select_own_insights" ON insights FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = insights.dataset_id AND datasets.user_id = auth.uid())
  );
CREATE POLICY "insert_own_insights" ON insights FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = insights.dataset_id AND datasets.user_id = auth.uid())
  );

-- RLS Policies for forecasts
CREATE POLICY "select_own_forecasts" ON forecasts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = forecasts.dataset_id AND datasets.user_id = auth.uid())
  );
CREATE POLICY "insert_own_forecasts" ON forecasts FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM datasets WHERE datasets.id = forecasts.dataset_id AND datasets.user_id = auth.uid())
  );

-- RLS Policies for reports
CREATE POLICY "select_own_reports" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for dashboard_configs
CREATE POLICY "select_own_configs" ON dashboard_configs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_configs" ON dashboard_configs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_configs" ON dashboard_configs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_configs" ON dashboard_configs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_datasets_status ON datasets(status);
CREATE INDEX idx_dataset_data_dataset_id ON dataset_data(dataset_id);
CREATE INDEX idx_data_profiles_dataset_id ON data_profiles(dataset_id);
CREATE INDEX idx_chat_sessions_dataset_id ON chat_sessions(dataset_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_insights_dataset_id ON insights(dataset_id);
CREATE INDEX idx_forecasts_dataset_id ON forecasts(dataset_id);
CREATE INDEX idx_reports_dataset_id ON reports(dataset_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);