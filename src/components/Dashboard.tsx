import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import type { Dataset, DatasetStats, Insight } from '../types';
import { classNames } from '../utils/helpers';
import MetricCard from './MetricCard';
import MiniChart from './MiniChart';

interface DashboardProps {
  dataset: Dataset | null;
  stats: DatasetStats | null;
  insights: Insight[];
  onNavigate: (view: string) => void;
}

export default function Dashboard({ dataset, stats, insights, onNavigate }: DashboardProps) {
  if (!dataset || !stats) {
    return <EmptyDashboard onNavigate={onNavigate} />;
  }

  const highImportanceInsights = insights.filter((i) => i.importance === 'high').slice(0, 3);
  const trends = insights.filter((i) => i.category === 'trend').slice(0, 4);
  const recommendations = insights.filter((i) => i.category === 'recommendation').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-secondary-400 mt-1">AI-powered insights for {dataset.name}</p>
        </div>
        <button
          onClick={() => onNavigate('insights')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-glow transition-shadow"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Generate Insights</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Records"
          value={stats.totalRows.toLocaleString()}
          change={12.5}
          icon={<Users className="w-6 h-6" />}
          color="primary"
        />
        <MetricCard
          title="Columns"
          value={stats.totalColumns.toString()}
          change={0}
          icon={<Package className="w-6 h-6" />}
          color="accent"
        />
        <MetricCard
          title="Data Quality"
          value={`${(100 - stats.missingPercentage).toFixed(1)}%`}
          change={5.2}
          icon={<BarChart3 className="w-6 h-6" />}
          color="success"
        />
        <MetricCard
          title="Completeness"
          value={`${((1 - stats.missingValues / (stats.totalRows * stats.totalColumns)) * 100).toFixed(1)}%`}
          change={-2.1}
          icon={<DollarSign className="w-6 h-6" />}
          color="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Summary Card */}
        <div className="lg:col-span-2 bg-secondary-900 rounded-xl border border-secondary-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Data Summary</h2>
            <button
              onClick={() => onNavigate('data')}
              className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
            >
              View Details
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <QuickStat label="Numeric Columns" value={stats.numericColumns} />
            <QuickStat label="Text Columns" value={stats.textColumns} />
            <QuickStat label="Date Columns" value={stats.dateColumns} />
            <QuickStat label="Memory Used" value={stats.memoryUsage} />
          </div>

          {/* Visual Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-secondary-800/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-secondary-400 mb-3">Column Types Distribution</h3>
              <MiniChart
                data={[
                  { name: 'Numeric', value: stats.numericColumns, color: '#3b82f6' },
                  { name: 'Text', value: stats.textColumns, color: '#10b981' },
                  { name: 'Date', value: stats.dateColumns, color: '#f59e0b' },
                ]}
                type="donut"
              />
            </div>
            <div className="bg-secondary-800/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-secondary-400 mb-3">Data Quality Score</h3>
              <div className="flex items-center justify-center h-32">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1e293b"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(100 - stats.missingPercentage) * 2.51} 251`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {(100 - stats.missingPercentage).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights Card */}
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Key Insights</h2>
            <div className="flex items-center gap-1 px-2 py-1 bg-accent-500/20 rounded-full">
              <Sparkles className="w-3 h-3 text-accent-400" />
              <span className="text-xs text-accent-400 font-medium">AI Generated</span>
            </div>
          </div>

          {highImportanceInsights.length > 0 ? (
            <div className="space-y-3">
              {highImportanceInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-secondary-800/50 rounded-lg p-3 hover:bg-secondary-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={classNames(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        insight.category === 'trend' && 'bg-primary-500/20 text-primary-400',
                        insight.category === 'recommendation' && 'bg-accent-500/20 text-accent-400',
                        insight.category === 'risk' && 'bg-error-500/20 text-error-400',
                        insight.category === 'key_finding' && 'bg-warning-500/20 text-warning-400'
                      )}
                    >
                      {insight.category === 'trend' && <TrendingUp className="w-4 h-4" />}
                      {insight.category === 'recommendation' && <Sparkles className="w-4 h-4" />}
                      {insight.category === 'risk' && <AlertCircle className="w-4 h-4" />}
                      {insight.category === 'key_finding' && <BarChart3 className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{insight.title}</p>
                      <p className="text-xs text-secondary-400 mt-1 line-clamp-2">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary-800 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-secondary-500" />
              </div>
              <p className="text-secondary-400 text-sm">No insights generated yet</p>
              <button
                onClick={() => onNavigate('insights')}
                className="mt-3 text-primary-400 text-sm font-medium hover:text-primary-300 transition-colors"
              >
                Generate Insights
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trend Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Detected Trends</h2>
          {trends.length > 0 ? (
            <div className="space-y-4">
              {trends.map((trend) => (
                <div key={trend.id} className="flex items-center gap-4">
                  <div
                    className={classNames(
                      'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium',
                      trend.confidence_score && trend.confidence_score > 0.8
                        ? 'bg-success-500/20 text-success-400'
                        : trend.confidence_score && trend.confidence_score > 0.5
                        ? 'bg-warning-500/20 text-warning-400'
                        : 'bg-secondary-700 text-secondary-400'
                    )}
                  >
                    {trend.confidence_score && trend.confidence_score > 0.8 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {trend.confidence_score && trend.confidence_score > 0.8 ? 'Strong' : 'Moderate'}
                  </div>
                  <p className="text-sm text-secondary-300 flex-1">{trend.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 text-sm text-center py-4">
              Upload data to detect trends
            </p>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">AI Recommendations</h2>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={rec.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-accent-400 font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-secondary-300">{rec.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 text-sm text-center py-4">
              Generate insights to see recommendations
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-6">
        <BarChart3 className="w-12 h-12 text-primary-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to DataCopilot</h2>
      <p className="text-secondary-400 max-w-md mb-8">
        Upload your dataset to begin exploring insights, generating visualizations, and asking questions in natural language.
      </p>
      <button
        onClick={() => onNavigate('upload')}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl hover:shadow-glow-accent transition-all"
      >
        <TrendingUp className="w-5 h-5" />
        <span className="font-medium">Upload Your First Dataset</span>
      </button>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-secondary-800/50 rounded-lg p-3">
      <p className="text-secondary-500 text-xs">{label}</p>
      <p className="text-white font-semibold mt-1">{value}</p>
    </div>
  );
}
