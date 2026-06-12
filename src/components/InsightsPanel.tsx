import { useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Loader,
} from 'lucide-react';
import { classNames } from '../utils/helpers';
import type { Insight, Dataset } from '../types';

interface InsightsPanelProps {
  dataset: Dataset;
  insights: Insight[];
  onGenerate: () => void;
  isLoading: boolean;
}

const categoryConfig = {
  trend: {
    color: 'primary',
    icon: TrendingUp,
    label: 'Trend',
    bgColor: 'bg-primary-500/20',
    textColor: 'text-primary-400',
    borderColor: 'border-primary-500/30',
  },
  opportunity: {
    color: 'accent',
    icon: Target,
    label: 'Opportunity',
    bgColor: 'bg-accent-500/20',
    textColor: 'text-accent-400',
    borderColor: 'border-accent-500/30',
  },
  risk: {
    color: 'error',
    icon: AlertTriangle,
    label: 'Risk',
    bgColor: 'bg-error-500/20',
    textColor: 'text-error-400',
    borderColor: 'border-error-500/30',
  },
  recommendation: {
    color: 'warning',
    icon: Lightbulb,
    label: 'Recommendation',
    bgColor: 'bg-warning-500/20',
    textColor: 'text-warning-400',
    borderColor: 'border-warning-500/30',
  },
  key_finding: {
    color: 'secondary',
    icon: Sparkles,
    label: 'Key Finding',
    bgColor: 'bg-secondary-500/20',
    textColor: 'text-secondary-300',
    borderColor: 'border-secondary-500/30',
  },
};

export default function InsightsPanel({ insights, onGenerate, isLoading }: InsightsPanelProps) {
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredInsights = filter === 'all'
    ? insights
    : insights.filter((i) => i.category === filter);

  const groupedByCategory = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Insights</h1>
          <p className="text-secondary-400 mt-1">
            Automatically generated insights from your data
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className={classNames(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
            isLoading
              ? 'bg-secondary-700 text-secondary-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-glow'
          )}
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Analyzing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Generate Insights</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const count = groupedByCategory[key]?.length || 0;
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'all' : key)}
              className={classNames(
                'bg-secondary-900 rounded-xl border p-4 text-left transition-all',
                filter === key ? 'border-primary-500 ring-1 ring-primary-500/50' : 'border-secondary-800 hover:border-secondary-700'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={classNames('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
                  <Icon className={classNames('w-4 h-4', config.textColor)} />
                </div>
                <span className="text-white text-lg font-semibold">{count}</span>
              </div>
              <p className={classNames('text-xs', config.textColor)}>{config.label}s</p>
            </button>
          );
        })}
      </div>

      {/* Insights List */}
      {filteredInsights.length > 0 ? (
        <div className="space-y-4">
          {filteredInsights.map((insight) => {
            const config = categoryConfig[insight.category];
            const Icon = config.icon;
            const isExpanded = expandedId === insight.id;

            return (
              <div
                key={insight.id}
                className={classNames(
                  'bg-secondary-900 rounded-xl border transition-all cursor-pointer',
                  isExpanded ? 'border-primary-500/50 ring-1 ring-primary-500/30' : 'border-secondary-800 hover:border-secondary-700'
                )}
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={classNames('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bgColor)}>
                        <Icon className={classNames('w-5 h-5', config.textColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={classNames('text-xs font-medium px-2 py-0.5 rounded-full', config.bgColor, config.textColor)}>
                            {config.label}
                          </span>
                          {insight.importance === 'high' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-error-500/20 text-error-400">
                              High Priority
                            </span>
                          )}
                        </div>
                        <h3 className="text-white font-medium">{insight.title}</h3>
                        <p className="text-secondary-400 text-sm mt-1 line-clamp-2">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={classNames(
                        'w-5 h-5 text-secondary-400 transition-transform flex-shrink-0',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-secondary-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-secondary-500 text-xs mb-2">Related Columns</p>
                          <div className="flex flex-wrap gap-2">
                            {insight.related_columns.map((col) => (
                              <span
                                key={col}
                                className="px-2 py-1 bg-secondary-800 rounded text-xs text-secondary-300"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                        {insight.confidence_score !== null && insight.confidence_score !== undefined && (
                          <div>
                            <p className="text-secondary-500 text-xs mb-2">Confidence Score</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-secondary-700 rounded-full overflow-hidden">
                                <div
                                  className={classNames(
                                    'h-full rounded-full',
                                    insight.confidence_score > 0.8
                                      ? 'bg-success-500'
                                      : insight.confidence_score > 0.5
                                      ? 'bg-warning-500'
                                      : 'bg-error-500'
                                  )}
                                  style={{ width: `${insight.confidence_score * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-white font-medium">
                                {(insight.confidence_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-secondary-900 rounded-xl border border-secondary-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary-800 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-secondary-500" />
          </div>
          <h3 className="text-white font-medium mb-2">No insights yet</h3>
          <p className="text-secondary-400 text-sm max-w-md mx-auto">
            Click "Generate Insights" to automatically analyze your data and discover trends, patterns, and recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
