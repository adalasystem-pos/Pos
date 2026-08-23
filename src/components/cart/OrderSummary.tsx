import React from 'react';
import { formatIQD } from '../../utils/currency';

interface OrderSummaryProps {
  subtotal: number;
  totalAmount: number;
  itemCount: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  totalAmount,
  itemCount,
}) => {
  return (
    <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-100 space-y-2 text-right">
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>ژمارەی بڕگەکان:</span>
        <span className="font-bold text-gray-800">{itemCount} دانە</span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>کۆی سەبەتە:</span>
        <span className="font-bold text-gray-800">{formatIQD(subtotal)}</span>
      </div>

      <div className="pt-2.5 border-t border-orange-200/80 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-700">کۆی گشتی بۆ پارەدان:</span>
        <span className="text-xl font-black text-orange-600 tracking-tight">
          {formatIQD(totalAmount)}
        </span>
      </div>
    </div>
  );
};
