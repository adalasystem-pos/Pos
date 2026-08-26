import React from 'react';
import { DailyClosing, DailySummary } from '../../types/closing';
import { formatIQD } from '../../utils/currency';
import { formatBaghdadDateTime } from '../../utils/dates';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Lock, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';

interface DailyClosingCardProps {
  closing: DailyClosing | null;
  summary: DailySummary;
  onOpenClosingModal: () => void;
  onPrintDailyReport?: () => void;
  isOnline: boolean;
}

export const DailyClosingCard: React.FC<DailyClosingCardProps> = ({
  closing,
  summary,
  onOpenClosingModal,
  onPrintDailyReport,
  isOnline,
}) => {
  const isClosed = !!closing;

  return (
    <Card
      id="daily-closing-card"
      className={`p-6 border-2 text-right transition-all shadow-sm rounded-3xl ${
        isClosed
          ? 'bg-gray-900 text-white border-gray-800'
          : 'bg-white text-gray-900 border-orange-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left / Top status and info */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3.5 rounded-2xl shrink-0 ${
              isClosed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-orange-100 text-orange-600'
            }`}
          >
            {isClosed ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black">
                {isClosed ? 'سندوقی ئەمڕۆ داخراوە (Closed)' : 'داخستنی سندوقی ڕۆژانە'}
              </h3>
              {isClosed ? (
                <span className="text-[11px] font-bold bg-emerald-900/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>داخراو</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold bg-orange-100 text-orange-900 px-2.5 py-0.5 rounded-full border border-orange-200">
                  سندوق کراوەیە
                </span>
              )}
            </div>

            <p
              className={`text-xs ${isClosed ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {isClosed
                ? `لە ڕێکەوتی ${formatBaghdadDateTime(closing.closedAt)} لەلایەن (${closing.closedByName || 'کاشێر'}) داخراوە.`
                : 'لە کۆتایی دەوامی کارکردندا سندوق دابخە بۆ پاشەکەوتکردنی کۆتایی حساباتی ڕۆژ.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onPrintDailyReport && (
            <Button
              id="print-daily-closing-report-btn"
              type="button"
              variant="outline"
              size="md"
              onClick={onPrintDailyReport}
              className={`gap-2 rounded-2xl font-bold cursor-pointer ${
                isClosed
                  ? 'border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white'
                  : 'border-orange-200 text-orange-950 hover:bg-orange-50'
              }`}
              title="چاپکردنی پسوولەی حسابی ئەمڕۆ بە چاپکەری پەڕاو (Thermal 58mm)"
            >
              <Printer className="w-4 h-4 text-orange-500" />
              <span>چاپکردنی ڕاپۆرت</span>
            </Button>
          )}

          {!isClosed ? (
            <Button
              id="open-closing-dialog-btn"
              variant="secondary"
              size="lg"
              onClick={onOpenClosingModal}
              disabled={!isOnline || (summary.orderCount === 0 && summary.expenseCount === 0)}
              className="gap-2 font-bold bg-gray-900 hover:bg-black text-white rounded-2xl cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>داخستنی سندوقی ئەمڕۆ</span>
            </Button>
          ) : (
            <div className="text-left bg-gray-800 px-4 py-2 rounded-2xl border border-gray-700">
              <span className="text-[10px] text-gray-400 block font-medium">قازانجی پاکی داخراو</span>
              <span className="text-base font-black text-orange-400" dir="rtl">
                {formatIQD(closing.netProfit)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Snapshot metrics if already closed */}
      {isClosed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-5 border-t border-gray-800 text-xs">
          <div className="p-3 rounded-2xl bg-gray-800/60" style={{ backgroundColor: '#3a4152' }}>
            <span
              className="text-gray-400 block text-[10px]"
              style={{ color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}
            >
              کۆی فرۆش
            </span>
            <span className="font-bold text-emerald-400">{formatIQD(closing.totalSales)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-800/60" style={{ backgroundColor: '#3a4152' }}>
            <span
              className="text-gray-400 block text-[10px]"
              style={{ color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}
            >
              کۆی خەرجی
            </span>
            <span className="font-bold text-red-400">{formatIQD(closing.totalExpenses)}</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-800/60" style={{ backgroundColor: '#3a4152' }}>
            <span
              className="text-gray-400 block text-[10px]"
              style={{ color: '#ffffff', fontWeight: 'bold', textAlign: 'center' }}
            >
              ژمارەی فرۆشەکان
            </span>
            <span className="font-bold text-white">{closing.orderCount} داواکاری</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-800/60" style={{ backgroundColor: '#3a4152' }}>
            <span
              className="text-gray-400 block text-[10px]"
              style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontStyle: 'normal',
                textAlign: 'center',
              }}
            >
              ژمارەی خەرجییەکان
            </span>
            <span
              className="font-bold text-white block"
              style={{ textAlign: 'right', fontWeight: 'bold', lineHeight: '16px' }}
            >
              {closing.expenseCount} خەرجی
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
