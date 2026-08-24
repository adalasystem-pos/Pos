import React from 'react';
import { Order } from '../../types/order';
import { formatIQD } from '../../utils/currency';
import { formatBaghdadTime } from '../../utils/dates';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ShoppingBag, Clock, User, CheckCircle2, Utensils, Send, XCircle } from 'lucide-react';

interface DailyOrdersListProps {
  orders: Order[];
  loading?: boolean;
}

export const DailyOrdersList: React.FC<DailyOrdersListProps> = ({ orders, loading }) => {
  if (orders.length === 0 && !loading) {
    return (
      <EmptyState
        title="هیچ فرۆشێک تۆمار نەکراوە"
        description="هەر داواکارییەکی تۆمارکراو لە سیستەم لێرەدا دەردەکەوێت."
        icon={<ShoppingBag className="w-8 h-8" />}
      />
    );
  }

  const renderStatusBadge = (order: Order) => {
    switch (order.status) {
      case 'preparing':
        return (
          <span className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
            <Utensils className="w-3.5 h-3.5 text-amber-600" />
            <span>لە ئامادەکردندایە</span>
          </span>
        );
      case 'ready':
        return (
          <span className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>ئامادەیە</span>
          </span>
        );
      case 'served':
        return (
          <span className="flex items-center gap-1 text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
            <Send className="w-3.5 h-3.5 text-teal-600" />
            <span>گەیەنراوە</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>هەڵوەشاوەتەوە</span>
          </span>
        );
      case 'completed':
      default:
        return (
          <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>تەواوکراو</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-2.5">
      {orders.map((order, idx) => (
        <Card
          key={order.orderId}
          id={`order-row-${order.orderId}`}
          className="p-4 bg-white border border-orange-100/90 shadow-sm text-right rounded-3xl"
        >
          {/* Top row: Order Number, Table, Time, Cashier, Amount */}
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-orange-50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black bg-orange-100 text-orange-950 px-2.5 py-0.5 rounded-xl border border-orange-200 font-mono">
                {order.orderNumber || `#${orders.length - idx}`}
              </span>
              {order.tableNumber && (
                <span className="text-[11px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-lg">
                  مێز: {order.tableNumber}
                </span>
              )}
              {order.source === 'captain' && (
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                  کاپتن
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span dir="ltr">{formatBaghdadTime(order.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-xs sm:text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-xl border border-orange-100 font-mono"
                dir="ltr"
              >
                {formatIQD(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="pt-3 space-y-1.5">
            {order.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
                className="flex items-center justify-between text-xs text-gray-800"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold">{item.productName}</span>
                  {item.portion && (
                    <span className="text-[10px] text-orange-800 bg-orange-50 px-1.5 py-0.2 rounded-md border border-orange-100 font-semibold">
                      {item.portion}
                    </span>
                  )}
                  {item.customizations && item.customizations.length > 0 && (
                    <span className="text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-100">
                      {item.customizations.join('، ')}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 font-bold shrink-0" dir="ltr">
                  {item.quantity} × {formatIQD(item.unitPrice)}
                </span>
              </div>
            ))}

            {order.note && (
              <p className="text-[11px] text-gray-400 italic pt-1 border-t border-orange-50 mt-1">
                تێبینی: {order.note}
              </p>
            )}

            {order.status === 'cancelled' && order.cancelReason && (
              <p className="text-[11px] text-red-500 font-medium pt-1 border-t border-red-50 mt-1">
                هۆکاری هەڵوەشاندنەوە: {order.cancelReason}
              </p>
            )}
          </div>

          {/* Bottom user attribution & status */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2.5 border-t border-orange-50 mt-2.5 font-medium">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>تۆمارکار: {order.createdByName || 'کاشێر'}</span>
            </span>
            {renderStatusBadge(order)}
          </div>
        </Card>
      ))}
    </div>
  );
};
