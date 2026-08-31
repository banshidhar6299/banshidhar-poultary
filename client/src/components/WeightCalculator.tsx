import React, { useState, useEffect } from 'react';
import { Calculator, RotateCcw, ArrowRightLeft, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatINR } from '../api/client';

interface WeightCalculatorProps {
  defaultRate?: number;
  className?: string;
  isCompact?: boolean;
}

export const WeightCalculator: React.FC<WeightCalculatorProps> = ({
  defaultRate = 120,
  className = '',
  isCompact = false
}) => {
  const { t, isHindi } = useLanguage();

  const [mode, setMode] = useState<'WEIGHT' | 'BIRDS'>('WEIGHT');
  const [totalKg, setTotalKg] = useState<string>('85');
  const [ratePerKg, setRatePerKg] = useState<string>(String(defaultRate));

  // Birds mode
  const [birdCount, setBirdCount] = useState<string>('500');
  const [avgWeightKg, setAvgWeightKg] = useState<string>('2.1');

  // Computed results
  const [computedTotalKg, setComputedTotalKg] = useState<number>(85);
  const [computedGross, setComputedGross] = useState<number>(10200);

  useEffect(() => {
    if (defaultRate) {
      setRatePerKg(String(defaultRate));
    }
  }, [defaultRate]);

  useEffect(() => {
    const rate = parseFloat(ratePerKg) || 0;
    if (mode === 'WEIGHT') {
      const kg = parseFloat(totalKg) || 0;
      setComputedTotalKg(kg);
      setComputedGross(Math.round((kg * rate + Number.EPSILON) * 100) / 100);
    } else {
      const count = parseFloat(birdCount) || 0;
      const avg = parseFloat(avgWeightKg) || 0;
      const calculatedKg = Math.round((count * avg + Number.EPSILON) * 100) / 100;
      setComputedTotalKg(calculatedKg);
      setComputedGross(Math.round((calculatedKg * rate + Number.EPSILON) * 100) / 100);
    }
  }, [mode, totalKg, ratePerKg, birdCount, avgWeightKg]);

  const handleReset = () => {
    setTotalKg('');
    setBirdCount('');
    setAvgWeightKg('');
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-brand-500/5 ${className}`}
    >
      {/* Decorative Chick subtle motif */}
      <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" width="160" height="160" fill="currentColor">
          <circle cx="50" cy="38" r="16" />
          <ellipse cx="50" cy="58" rx="22" ry="24" />
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.calculator.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.calculator.subtitle}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('WEIGHT')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              mode === 'WEIGHT'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isHindi ? 'सीधे वजन (KG)' : 'Direct Weight (KG)'}
          </button>
          <button
            onClick={() => setMode('BIRDS')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              mode === 'BIRDS'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {isHindi ? 'मुर्गी संख्या × औसत' : 'Bird Count × Avg'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mode === 'WEIGHT' ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.calculator.weightLabel}
            </label>
            <input
              type="number"
              step="any"
              value={totalKg}
              onChange={(e) => setTotalKg(e.target.value)}
              placeholder="e.g. 85.5"
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.calculator.birdsCount}
              </label>
              <input
                type="number"
                value={birdCount}
                onChange={(e) => setBirdCount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.calculator.avgWeight} (KG)
              </label>
              <input
                type="number"
                step="0.01"
                value={avgWeightKg}
                onChange={(e) => setAvgWeightKg(e.target.value)}
                placeholder="e.g. 2.1"
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            {t.calculator.rateLabel}
          </label>
          <input
            type="number"
            step="any"
            value={ratePerKg}
            onChange={(e) => setRatePerKg(e.target.value)}
            placeholder="e.g. 120"
            className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Result Display Box */}
      <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-brand-100 uppercase">
            {t.calculator.totalAmount}
          </p>
          <p className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            {formatINR(computedGross)}
          </p>
          <p className="text-[11px] text-brand-200 mt-0.5">
            {computedTotalKg} KG × ₹{ratePerKg || 0}/KG
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl backdrop-blur-sm transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.calculator.clear}</span>
        </button>
      </div>
    </div>
  );
};
