import { useState, useCallback } from 'react';
import {
  Layout,
  Dashboard,
  FileUpload,
  DataExplorer,
  AIChat,
  InsightsPanel,
  ForecastPanel,
  ReportsPanel,
} from './components';
import type {
  Dataset,
  DatasetStats,
  DataProfile,
  ChatMessage,
  Insight,
  Forecast,
  Report,
  ChartConfig,
} from './types';
import { processUserQuery } from './services/aiService';

type AppView = 'dashboard' | 'upload' | 'data' | 'chat' | 'insights' | 'forecasts' | 'reports';

export default function App() {
  // Dataset state
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [profiles, setProfiles] = useState<DataProfile[]>([]);

  // Application state
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Insights state
  const [insights, setInsights] = useState<Insight[]>([]);

  // Forecasts state
  const [forecasts, setForecasts] = useState<Forecast[]>([]);

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([]);

  // Handle file upload completion
  const handleUploadComplete = useCallback(
    (newDataset: Dataset, newStats: DatasetStats, newProfiles: DataProfile[], newData: Record<string, unknown>[]) => {
      setDataset(newDataset);
      setStats(newStats);
      setProfiles(newProfiles);
      setData(newData);
      setCurrentView('dashboard');
      setMessages([]);
      setInsights([]);
      setForecasts([]);
      setReports([]);
      setChartConfigs([]);
    },
    []
  );

  // Handle sending chat messages
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!dataset) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        session_id: 'current',
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setIsLoading(true);
      try {
        const startTime = Date.now();
        const response = await processUserQuery(message, dataset, data);
        const executionTime = Date.now() - startTime;

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          session_id: 'current',
          role: 'assistant',
          content: response.answer,
          query_type: 'question',
          chart_config: response.chart,
          query_result: response.queryResult ? { data: response.queryResult } : undefined,
          execution_time_ms: executionTime,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Store insights if returned
        if (response.insights) {
          setInsights((prev) => [...prev, ...response.insights!]);
        }

        // Store chart config
        if (response.chart) {
          setChartConfigs((prev) => [...prev, response.chart!]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [dataset, data]
  );

  // Handle insight generation
  const handleGenerateInsights = useCallback(async () => {
    if (!dataset) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newInsights: Insight[] = [];

      // Add key findings from profiles
      for (const profile of profiles.slice(0, 5)) {
        if (profile.unique_count < data.length * 0.1) {
          newInsights.push({
            id: Math.random().toString(36).substring(2),
            dataset_id: dataset.id,
            category: 'key_finding',
            title: `Low Cardinality in ${profile.column_name}`,
            description: `${profile.column_name} has only ${profile.unique_count} unique values out of ${data.length} records, indicating potential categorical data.`,
            importance: 'medium',
            related_columns: [profile.column_name],
            confidence_score: 0.9,
            created_at: new Date().toISOString(),
          });
        }

        if (profile.missing_percentage > 10) {
          newInsights.push({
            id: Math.random().toString(36).substring(2),
            dataset_id: dataset.id,
            category: 'risk',
            title: `High Missing Values in ${profile.column_name}`,
            description: `${profile.column_name} has ${profile.missing_percentage.toFixed(1)}% missing values which may affect analysis accuracy.`,
            importance: 'high',
            related_columns: [profile.column_name],
            confidence_score: 0.95,
            created_at: new Date().toISOString(),
          });
        }

        if (profile.data_type === 'number' && profile.std_dev !== undefined && profile.std_dev > profile.mean_value! * 0.5) {
          newInsights.push({
            id: Math.random().toString(36).substring(2),
            dataset_id: dataset.id,
            category: 'trend',
            title: `High Variability in ${profile.column_name}`,
            description: `${profile.column_name} shows high variability (std dev: ${profile.std_dev.toFixed(2)}) compared to mean (${profile.mean_value!.toFixed(2)}), indicating diverse data distribution.`,
            importance: 'medium',
            related_columns: [profile.column_name],
            confidence_score: 0.8,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Add recommendations
      newInsights.push({
        id: Math.random().toString(36).substring(2),
        dataset_id: dataset.id,
        category: 'recommendation',
        title: 'Data Quality Improvement',
        description: 'Consider cleaning missing values and standardizing data formats to improve analysis accuracy.',
        importance: 'medium',
        related_columns: profiles.filter((p) => p.missing_percentage > 5).map((p) => p.column_name),
        confidence_score: 0.85,
        created_at: new Date().toISOString(),
      });

      newInsights.push({
        id: Math.random().toString(36).substring(2),
        dataset_id: dataset.id,
        category: 'opportunity',
        title: 'Deep Dive Analysis',
        description: 'The dataset shows interesting patterns. Consider segmenting data by key dimensions for deeper insights.',
        importance: 'medium',
        related_columns: [],
        confidence_score: 0.75,
        created_at: new Date().toISOString(),
      });

      setInsights((prev) => [...prev, ...newInsights]);
    } finally {
      setIsLoading(false);
    }
  }, [dataset, profiles, data]);

  // Handle forecast generation
  const handleGenerateForecast = useCallback((forecast: Forecast) => {
    setForecasts((prev) => [...prev, forecast]);
  }, []);

  // Handle report generation
  const handleGenerateReport = useCallback((report: Report) => {
    setReports((prev) => [...prev, report]);
  }, []);

  // Handle report deletion
  const handleDeleteReport = useCallback((reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }, []);

  // Render current view
  const renderView = () => {
    if (!dataset || currentView === 'upload') {
      return (
        <FileUpload
          onUploadComplete={handleUploadComplete}
          isProcessing={isLoading}
          setIsProcessing={setIsLoading}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            dataset={dataset}
            stats={stats}
            insights={insights}
            onNavigate={(view) => setCurrentView(view as AppView)}
          />
        );

      case 'data':
        return stats && <DataExplorer dataset={dataset} data={data} stats={stats} profiles={profiles} />;

      case 'chat':
        return (
          <AIChat
            dataset={dataset}
            data={data}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        );

      case 'insights':
        return (
          <InsightsPanel
            dataset={dataset}
            insights={insights}
            onGenerate={handleGenerateInsights}
            isLoading={isLoading}
          />
        );

      case 'forecasts':
        return (
          <ForecastPanel
            dataset={dataset}
            data={data}
            forecasts={forecasts}
            onGenerate={handleGenerateForecast}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );

      case 'reports':
        return stats && (
          <ReportsPanel
            dataset={dataset}
            stats={stats}
            insights={insights}
            charts={chartConfigs}
            reports={reports}
            onGenerate={handleGenerateReport}
            onDelete={handleDeleteReport}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );

      default:
        return (
          <Dashboard
            dataset={dataset}
            stats={stats}
            insights={insights}
            onNavigate={(view) => setCurrentView(view as AppView)}
          />
        );
    }
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={(view) => setCurrentView(view as AppView)}
      datasetName={dataset?.name}
    >
      {renderView()}
    </Layout>
  );
}
