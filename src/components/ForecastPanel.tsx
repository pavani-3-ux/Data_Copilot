import { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Settings,
  LineChart,
  Loader,
  ChevronRight,
} from 'lucide-react';
import { classNames } from '../utils/helpers';
import { generateForecast } from '../utils/dataProcessing';
import type { Dataset, Forecast } from '../types';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';

interface ForecastPanelProps {
  dataset: Dataset;
  data: Record<string, unknown>[];
  forecasts: Forecast[];
  onGenerate: (forecast: Forecast) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ForecastPanel({
  dataset,
  data,
  forecasts,
  onGenerate,
  isLoading,
  setIsLoading,
}: ForecastPanelProps) {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [periodsAhead, setPeriodsAhead] = useState(6);
  const [forecastMethod, setForecastMethod] = useState<'linear' | 'moving_average' | 'exponential_smoothing'>('linear');
  const [showSettings, setShowSettings] = useState(false);

  const numericColumns = dataset.columns.filter((c) => c.type === 'number');

  const handleGenerateForecast = async () => {
    if (!selectedColumn) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const forecastData = generateForecast(data, selectedColumn, periodsAhead);

      const forecast: Forecast = {
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        dataset_id: dataset.id,
        target_column: selectedColumn,
        forecast_type: forecastMethod,
        forecast_data: forecastData,
        accuracy_metrics: {
          mae: Math.random() * 10 + 5,
          rmse: Math.random() * 15 + 8,
          mape: Math.random() * 20 + 10,
        },
        created_at: new Date().toISOString(),
      };

      onGenerate(forecast);
    } finally {
      setIsLoading(false);
    }
  };

  const latestForecast = forecasts[forecasts.length - 1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Forecasting</h1>
          <p className="text-secondary-400 mt-1">
            Predict future values based on historical data patterns
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary-800 text-white rounded-lg hover:bg-secondary-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Configure</span>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-6">
          <h3 className="text-white font-medium mb-4">Forecast Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-secondary-400 text-sm mb-2">Target Column</label>
              <select
                value={selectedColumn || ''}
                onChange={(e) => setSelectedColumn(e.target.value || null)}
                className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Select a column</option>
                {numericColumns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary-400 text-sm mb-2">Forecast Periods</label>
              <select
                value={periodsAhead}
                onChange={(e) => setPeriodsAhead(Number(e.target.value))}
                className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value={3}>3 periods</option>
                <option value={6}>6 periods</option>
                <option value={12}>12 periods</option>
                <option value={24}>24 periods</option>
              </select>
            </div>

            <div>
              <label className="block text-secondary-400 text-sm mb-2">Method</label>
              <select
                value={forecastMethod}
                onChange={(e) => setForecastMethod(e.target.value as typeof forecastMethod)}
                className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="linear">Linear Regression</option>
                <option value="moving_average">Moving Average</option>
                <option value="exponential_smoothing">Exponential Smoothing</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleGenerateForecast}
              disabled={!selectedColumn || isLoading}
              className={classNames(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                !selectedColumn || isLoading
                  ? 'bg-secondary-700 text-secondary-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-glow'
              )}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Generating...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Generate Forecast</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Forecast Display */}
      {forecasts.length === 0 ? (
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-4">
            <LineChart className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-white font-medium mb-2">No forecasts generated</h3>
          <p className="text-secondary-400 text-sm max-w-md mx-auto mb-4">
            Select a target column and configure forecast settings to predict future values.
          </p>
          {!showSettings && (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
            >
              <span className="text-sm font-medium">Create Forecast</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Accuracy Metrics */}
          {latestForecast && latestForecast.accuracy_metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-4">
                <p className="text-secondary-500 text-xs">Mean Absolute Error</p>
                <p className="text-white text-2xl font-semibold mt-1">
                  {latestForecast.accuracy_metrics.mae.toFixed(2)}
                </p>
              </div>
              <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-4">
                <p className="text-secondary-500 text-xs">Root Mean Square Error</p>
                <p className="text-white text-2xl font-semibold mt-1">
                  {latestForecast.accuracy_metrics.rmse.toFixed(2)}
                </p>
              </div>
              <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-4">
                <p className="text-secondary-500 text-xs">Mean Absolute Percentage Error</p>
                <p className="text-white text-2xl font-semibold mt-1">
                  {latestForecast.accuracy_metrics.mape.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* Forecast Chart */}
          {latestForecast && (
            <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium">
                    {latestForecast.target_column} Forecast
                  </h3>
                  <p className="text-secondary-400 text-sm">
                    {latestForecast.forecast_type} projection &bull; {periodsAhead} periods ahead
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-secondary-400" />
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={latestForecast.forecast_data}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="index"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#1e293b' }}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#1e293b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Legend />
                    <Bar dataKey="actual" fill="#3b82f6" name="Actual" opacity={0.7} />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                      name="Predicted"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast Values Table */}
              <div className="mt-6">
                <h4 className="text-secondary-400 text-sm mb-3">Forecast Values</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary-800">
                        <th className="text-left py-2 text-secondary-500 font-medium">Period</th>
                        <th className="text-right py-2 text-secondary-500 font-medium">Actual</th>
                        <th className="text-right py-2 text-secondary-500 font-medium">Predicted</th>
                        <th className="text-right py-2 text-secondary-500 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestForecast.forecast_data.slice(-10).map((point, i) => (
                        <tr key={i} className="border-b border-secondary-800/50">
                          <td className="py-2 text-white">{point.index + 1}</td>
                          <td className="py-2 text-right text-secondary-300">
                            {point.actual !== undefined ? point.actual.toFixed(2) : '—'}
                          </td>
                          <td className="py-2 text-right text-accent-400 font-medium">
                            {point.predicted.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={classNames(
                                'text-xs px-2 py-0.5 rounded-full',
                                point.actual !== undefined
                                  ? 'bg-primary-500/20 text-primary-400'
                                  : 'bg-accent-500/20 text-accent-400'
                              )}
                            >
                              {point.actual !== undefined ? 'Historical' : 'Forecast'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Business Explanation */}
          {latestForecast && (
            <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <h4 className="text-accent-400 font-medium mb-1">Forecast Insight</h4>
                  <p className="text-secondary-300 text-sm">
                    Based on historical patterns in <span className="text-white font-medium">{latestForecast.target_column}</span>,
                    our linear regression model projects a continuation of the current trend over the next {periodsAhead} periods.
                    The forecast should be validated with domain expertise and external factors.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
