import React from 'react';
import { AnalyticsRange } from '../../types/analytics';
import { Calendar, Clock, BarChart2 } from 'lucide-react';

interface AnalyticsRangeSelectorProps {
  selectedRange: AnalyticsRange;
  onSelectRange: (range: AnalyticsRange) => void;
  dateLabel: string;
  loading?: boolean;
}

export const AnalyticsRangeSelector: React.FC<AnalyticsRangeSelectorProps> = ({
  selectedRange,
  onSelectRange,
  dateLabel,
  loading,
}) => {
  const ranges: { id: AnalyticsRange; label: string; icon: React.ReactNode }[] = [
    { id: 'daily', label: 'ئەمڕۆ (Daily)', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'weekly', label: 'ئەم هەفتەیە (Weekly)', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'monthly', label: 'ئەم مانگە (Monthly)', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-3xl border border-orange-100 shadow-xs select-none">
      {/* Tab Switcher Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-orange-50/70 rounded-2xl border border-orange-100">
        {ranges.map((r) => {
          const isActive = selectedRange === r.id;
          return (
            <button
              key={r.id}
              id={`range-btn-${r.id}`}
              type="button"
              onClick={() => onSelectRange(r.id)}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-xs scale-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Range Badge */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-orange-50 text-orange-950 border border-orange-200 text-xs font-bold shrink-0 self-end sm:self-center">
        <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
        <span className="text-gray-500 font-medium">ماوە:</span>
        <span dir="ltr" className="font-mono text-gray-800">
          {dateLabel}
        </span>
      </div>
    </div>
  );
};
