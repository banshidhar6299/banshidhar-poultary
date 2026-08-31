import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { ChickLogo } from '../../components/ChickLogo';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <ChickLogo size={64} className="justify-center" />
      <span className="text-5xl font-black font-display text-brand-600">404</span>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Page Not Found
      </h1>
      <p className="text-xs text-slate-500 max-w-sm">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="pt-2 flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
      </div>
    </div>
  );
};
