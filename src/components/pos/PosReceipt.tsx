import React from 'react';
import { Order } from '../../types/order';
import { formatIQD } from '../../utils/currency';
import { APP_CONFIG } from '../../config/appConfig';
import { formatBaghdadTime } from '../../utils/dates';

interface PosReceiptProps {
  order: Order | null;
  className?: string;
  isPrintOnly?: boolean;
}

export const PosReceipt: React.FC<PosReceiptProps> = ({
  order,
  className = '',
  isPrintOnly = false,
}) => {
  if (!order) return null;

  const shortOrderId = order.orderId ? order.orderId.slice(-6).toUpperCase() : '000000';
  const orderTimeStr = formatBaghdadTime(order.createdAt);

  return (
    <div
      id="pos-thermal-receipt"
      dir="rtl"
      className={`pos-receipt-container font-mono text-black select-none ${
        isPrintOnly ? 'hidden print:block' : 'block'
      } ${className}`}
      style={{
        width: '100%',
        maxWidth: '80mm',
        margin: '0 auto',
        padding: '8px 12px',
        backgroundColor: '#ffffff',
        color: '#000000',
        lineHeight: 1.35,
      }}
    >
      {/* Restaurant Header */}
      <div className="text-center pb-2">
        <h2 className="text-base sm:text-lg font-black text-black tracking-tight leading-tight">
          {APP_CONFIG.restaurantName}
        </h2>
        <p className="text-[11px] font-bold text-gray-800 mt-0.5">
          {APP_CONFIG.systemName}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-2" />

      {/* Order Number & Timestamp */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between font-bold">
          <span>ژمارەی داواکاری:</span>
          <span className="font-mono text-sm font-black" dir="ltr">
            #{shortOrderId}
          </span>
        </div>
        <div className="flex items-center justify-between font-semibold text-[11px]">
          <span>کات:</span>
          <span className="font-mono" dir="ltr">
            {orderTimeStr}
          </span>
        </div>
        {order.createdByName && (
          <div className="flex items-center justify-between text-[10px] text-gray-700">
            <span>کاشێر:</span>
            <span>{order.createdByName}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-2" />

      {/* Items List */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between font-bold text-[11px] pb-1 border-b border-gray-300">
          <span>ناوی ئایتم</span>
          <span>کۆی هێڵ</span>
        </div>

        {order.items.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-xs text-black">
                {item.productName}{' '}
                {item.portion && (
                  <span className="font-normal text-[10px]">
                    ({item.portion})
                  </span>
                )}
              </span>
              <span className="font-mono font-bold text-xs" dir="ltr">
                {formatIQD(item.lineTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono">
              <span dir="ltr">
                {item.quantity} × {formatIQD(item.unitPrice)}
              </span>
              {item.customizations && item.customizations.length > 0 && (
                <span className="text-gray-700 text-[9px]">
                  [{item.customizations.join(', ')}]
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Note if present */}
      {order.note && (
        <div className="mt-2 pt-1 border-t border-dotted border-gray-300 text-[10px] italic">
          <span>تێبینی: {order.note}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-dashed border-black my-2.5" />

      {/* Grand Total */}
      <div className="flex items-center justify-between py-1 text-sm font-black">
        <span>کۆی گشتی:</span>
        <span className="font-mono text-base" dir="ltr">
          {formatIQD(order.totalAmount)}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-2" />

      {/* Preparation Operational Status */}
      <div className="text-center py-1">
        <p className="text-[11px] font-bold text-black border border-black px-2 py-1 rounded inline-block">
          داواکاریەکە نێردرا بۆ ئامادەکردن
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-black my-2" />

      {/* IDG Attribution */}
      <div className="text-center text-[9px] text-gray-800 space-y-0.5 pt-0.5">
        <p className="font-bold">{APP_CONFIG.providerAttributionKurdish}</p>
        <p className="font-mono tracking-tight">{APP_CONFIG.providerAttribution}</p>
      </div>
    </div>
  );
};
