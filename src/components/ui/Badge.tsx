import React from 'react';
import { SentimentClass, RiskSeverity, EvidenceClassification } from '@/lib/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'sentiment' | 'severity' | 'classification' | 'neutral' | 'outline';
  sentiment?: SentimentClass;
  severity?: RiskSeverity;
  classification?: EvidenceClassification;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  sentiment,
  severity,
  classification,
  className = '',
  size = 'sm',
}) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'sentiment' && sentiment) {
    switch (sentiment) {
      case 'positive':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'negative':
        colorClasses = 'bg-red-50 text-red-700 border-red-200';
        break;
      case 'mixed':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'neutral':
      default:
        colorClasses = 'bg-slate-50 text-slate-600 border-slate-200';
        break;
    }
  } else if (variant === 'severity' && severity) {
    switch (severity) {
      case 'critical':
        colorClasses = 'bg-red-100 text-red-800 border-red-300 font-semibold';
        break;
      case 'high':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
        break;
      case 'medium':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
      case 'low':
      default:
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
    }
  } else if (variant === 'classification' && classification) {
    switch (classification) {
      case 'explicitly_stated':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'inferred':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'requiring_verification':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
    }
  } else if (variant === 'outline') {
    colorClasses = 'bg-transparent text-slate-600 border-slate-200';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md border tracking-wide uppercase ${sizeClasses} ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
};
