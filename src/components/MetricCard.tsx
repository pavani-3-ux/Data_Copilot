import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { classNames } from '../utils/helpers';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: ReactNode;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'secondary';
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-500/10',
    border: 'border-primary-500/20',
    icon: 'text-primary-400',
    trend: 'text-primary-400',
  },
  accent: {
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/20',
    icon: 'text-accent-400',
    trend: 'text-accent-400',
  },
  success: {
    bg: 'bg-success-500/10',
    border: 'border-success-500/20',
    icon: 'text-success-400',
    trend: 'text-success-400',
  },
  warning: {
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
    icon: 'text-warning-400',
    trend: 'text-warning-400',
  },
  error: {
    bg: 'bg-error-500/10',
    border: 'border-error-500/20',
    icon: 'text-error-400',
    trend: 'text-error-400',
  },
  secondary: {
    bg: 'bg-secondary-500/10',
    border: 'border-secondary-500/20',
    icon: 'text-secondary-400',
    trend: 'text-secondary-400',
  },
};

export default function MetricCard({ title, value, change, subtitle, icon, color }: MetricCardProps) {
  const colors = colorClasses[color];
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={classNames(
        'bg-secondary-900 rounded-xl border p-5 transition-all duration-200 hover:shadow-lg',
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-secondary-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <div
                className={classNames(
                  'flex items-center gap-0.5',
                  isPositive ? 'text-success-400' : 'text-error-400'
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                <span className="text-xs font-medium">{Math.abs(change).toFixed(1)}%</span>
              </div>
              <span className="text-secondary-500 text-xs">vs last period</span>
            </div>
          )}
          {subtitle && <p className="text-secondary-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={classNames('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg)}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
