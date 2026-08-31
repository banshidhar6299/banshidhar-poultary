import React from 'react';

interface ChickLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ChickLoader: React.FC<ChickLoaderProps> = ({
  text = 'Loading...',
  size = 'md'
}) => {
  const sizePx = size === 'sm' ? 32 : size === 'lg' ? 64 : 48;

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div className="relative animate-bounce">
        <div
          className="flex items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 p-2 shadow-lg shadow-brand-500/25"
          style={{ width: sizePx, height: sizePx }}
        >
          <svg viewBox="0 0 100 100" width="80%" height="80%" fill="none">
            <ellipse cx="50" cy="58" rx="22" ry="24" fill="#fbbf24" />
            <circle cx="50" cy="38" r="16" fill="#f59e0b" />
            <circle cx="44" cy="36" r="3.5" fill="#1e293b" />
            <polygon points="36,40 30,44 36,46" fill="#ea580c" />
            <ellipse cx="60" cy="58" rx="10" ry="14" fill="#f59e0b" transform="rotate(-15 60 58)" />
          </svg>
        </div>
      </div>
      {text && (
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
};
