import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm my-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 mb-3.5 ring-8 ring-brand-50/50 dark:ring-brand-950/20">
        {Icon ? (
          <Icon className="w-8 h-8" />
        ) : (
          <svg viewBox="0 0 100 100" width="36" height="36" fill="none">
            <ellipse cx="50" cy="58" rx="22" ry="24" fill="#fbbf24" />
            <circle cx="50" cy="38" r="16" fill="#f59e0b" />
            <circle cx="44" cy="36" r="3.5" fill="#1e293b" />
            <polygon points="36,40 30,44 36,46" fill="#ea580c" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 rounded-xl shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
