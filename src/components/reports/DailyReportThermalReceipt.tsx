import React from 'react';
import { DailySummary } from '../../types/closing';
import { ProductSalesSummary, ExpenseCategorySummary } from '../../types/analytics';
import { formatIQD } from '../../utils/currency';
import { APP_CONFIG } from '../../config/appConfig';
import { formatBaghdadDateTime } from '../../utils/dates';

interface DailyReportThermalReceiptProps {
  summary: DailySummary;
  topProducts?: ProductSalesSummary[] | Array<{ productName: string; totalQuantity?: number; quantity?: number; totalRevenue: number }>;
  expenseCategories?: ExpenseCategorySummary[] | Array<{ category: string; totalAmount: number }>;
  closedByName?: string;
  className?: string;
  isPrintOnly?: boolean;
}

export const DailyReportThermalReceipt: React.FC<DailyReportThermalReceiptProps> = ({
  summary,
  topProducts = [],
  expenseCategories = [],
  closedByName,
  className = '',
  isPrintOnly = false,
}) => {
  return (
    <div
      id="daily-report-thermal-receipt"
      dir="rtl"
      className={`font-mono text-black select-none ${
        isPrintOnly ? 'hidden print:block' : 'block'
      } ${className}`}
      style={{
        width: '100%',
        maxWidth: '58mm',
        margin: '0 auto',
        padding: '6px 8px',
        backgroundColor: '#ffffff',
        color: '#000000',
        lineHeight: 1.35,
      }}
    >
      {/* Restaurant Header */}
      <div className="text-center pb-1.5">
        <h2 className="text-sm font-black text-black tracking-tight leading-tight">
          {APP_CONFIG.restaurantName}
        </h2>
        <p className="text-xs font-bold text-gray-900 mt-0.5">
          ڕاپۆرتی دارایی و حسابی ڕۆژانە
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-1.5" />

      {/* Date and Time */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between font-bold">
          <span>بەرواری ژمێریاری:</span>
          <span className="font-mono" dir="ltr">
            {summary.businessDate}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>کاتی چاپکردن:</span>
          <span className="font-mono" dir="ltr">
            {formatBaghdadDateTime(new Date())}
          </span>
        </div>
        {closedByName && (
          <div className="flex items-center justify-between text-[11px] text-gray-800 font-bold">
            <span>تۆمارکراو لەلایەن:</span>
            <span>{closedByName}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-1.5" />

      {/* Revenue Section */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between font-bold text-[11px] text-gray-800">
          <span>کۆی فرۆشی ڕۆژ:</span>
          <span className="font-mono font-black text-xs" dir="ltr">
            {formatIQD(summary.totalSales)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-700">
          <span>ژمارەی داواکارییەکان:</span>
          <span className="font-mono font-bold" dir="ltr">
            {summary.orderCount} داواکاری
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-1.5" />

      {/* Expense Section */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between font-bold text-[11px] text-gray-800">
          <span>کۆی خەرجییەکان:</span>
          <span className="font-mono font-black text-xs text-red-700" dir="ltr">
            {formatIQD(summary.totalExpenses)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-700">
          <span>ژمارەی خەرجییەکان:</span>
          <span className="font-mono font-bold" dir="ltr">
            {summary.expenseCount} خەرجی
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-1.5" />

      {/* Net Profit Summary */}
      <div className="py-1">
        <div className="flex items-center justify-between text-xs font-black">
          <span>قازانجی پاک (Net Profit):</span>
          <span className="font-mono text-sm font-black" dir="ltr">
            {formatIQD(summary.netProfit)}
          </span>
        </div>
        <div className="text-[9px] text-gray-600 mt-0.5">
          (کۆی فرۆش - کۆی خەرجییەکان)
        </div>
      </div>

      {/* Top Products if any */}
      {topProducts && topProducts.length > 0 && (
        <>
          <div className="border-t border-dashed border-black my-1.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-[11px] block pb-0.5">پڕفرۆشترین خواردنەکان:</span>
            {topProducts.slice(0, 5).map((p, idx) => {
              const qty = 'totalQuantity' in p ? p.totalQuantity : p.quantity || 0;
              return (
                <div key={idx} className="flex items-baseline justify-between text-[10px]">
                  <span>
                    {idx + 1}. {p.productName} ({qty} دانە)
                  </span>
                  <span className="font-mono font-bold" dir="ltr">
                    {formatIQD(p.totalRevenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Expense Categories if any */}
      {expenseCategories && expenseCategories.length > 0 && (
        <>
          <div className="border-t border-dashed border-black my-1.5" />
          <div className="space-y-1 text-xs">
            <span className="font-bold text-[11px] block pb-0.5">خەرجی بەپێی بەش:</span>
            {expenseCategories.map((cat, idx) => (
              <div key={idx} className="flex items-baseline justify-between text-[10px]">
                <span>• {cat.category}</span>
                <span className="font-mono font-bold" dir="ltr">
                  {formatIQD(cat.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Divider */}
      <div className="border-t border-dashed border-black my-1.5" />

      {/* Provider Branding */}
      <div className="text-center text-[9px] text-gray-800 space-y-0.5 pt-0.5">
        <p className="font-bold">{APP_CONFIG.providerAttributionKurdish}</p>
        <p className="font-mono tracking-tight">{APP_CONFIG.providerAttribution}</p>
      </div>
    </div>
  );
};
