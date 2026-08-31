import React from 'react';

interface ChickLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  logoUrl?: string;
}

export const ChickLogo: React.FC<ChickLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  logoUrl
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Banshidhar Poultry Logo"
          className="rounded-xl object-cover shadow-sm"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-md shadow-brand-500/20"
          style={{ width: size, height: size }}
        >
          <svg
            viewBox="0 0 100 100"
            width={size * 0.75}
            height={size * 0.75}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="50" cy="58" rx="22" ry="24" fill="#fbbf24" />
            <circle cx="50" cy="38" r="16" fill="#f59e0b" />
            <path d="M48 22 Q50 16 54 20 Q56 22 52 24 Z" fill="#d97706" />
            <circle cx="44" cy="36" r="3.5" fill="#1e293b" />
            <circle cx="43" cy="35" r="1.2" fill="#ffffff" />
            <polygon points="36,40 30,44 36,46" fill="#ea580c" />
            <ellipse cx="60" cy="58" rx="10" ry="14" fill="#f59e0b" transform="rotate(-15 60 58)" />
            <path d="M44 82 L44 90 M44 90 L38 90 M44 90 L48 90" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
            <path d="M56 82 L56 90 M56 90 L50 90 M56 90 L60 90" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}
      {showText && (
        <div className="flex flex-col">
          <span className="font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            BANSHIDHAR
          </span>
          <span className="text-[10px] font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase">
            POULTRY
          </span>
        </div>
      )}
    </div>
  );
};
