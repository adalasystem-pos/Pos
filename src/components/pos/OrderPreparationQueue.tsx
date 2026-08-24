import React, { useState } from 'react';
import { Order } from '../../types/order';
import { usePOSRealtime } from '../../contexts/POSRealtimeContext';
import { formatIQD } from '../../utils/currency';
import { formatBaghdadTime } from '../../utils/dates';
import { useToast } from '../../hooks/useToast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import {
  Utensils,
  CheckCircle2,
  Printer,
  Clock,
  User,
  Smartphone,
  Monitor,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const OrderPreparationQueue: React.FC = () => {
  const { preparingOrders, loading, completeOrder, reprintOrder } = usePOSRealtime();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const { success, error, warning } = useToast();

  const handleMarkCompleted = async (order: Order) => {
    try {
      setUpdatingOrderId(order.orderId);
      await completeOrder(order.orderId);
      const orderNum =
        order.orderNumber ||
        (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
      success(`داواکاری ${orderNum} بە سەرکەوتوویی تەواو کرا`);
    } catch (err: any) {
      console.error('Error completing order:', err);
      error(err.message || 'هەڵەیەک لە تەواوکردنی داواکاری ڕوویدا');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleReprintReceipt = async (order: Order) => {
    try {
      setPrintingOrderId(order.orderId);
      const res = await reprintOrder(order);
      if (res.success) {
        success('پسوولەکە بە سەرکەوتوویی چاپکرایەوە');
      } else {
        warning(res.error || 'چاپکردنی پسوولە سەرکەوتوو نەبوو');
      }
    } catch (err: any) {
      console.error('Reprint error:', err);
      warning('هەڵەیەک لە چاپکردنی پسوولە ڕوویدا');
    } finally {
      setPrintingOrderId(null);
    }
  };

  if (loading && preparingOrders.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 font-bold flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
        <span>بارکردنی داواکارییە لە ئامادەکردنەکان...</span>
      </div>
    );
  }

  if (preparingOrders.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="هیچ داواکارییەک لە ئامادەکردندا نییە"
          description="کاتێک کاپتن یان کاشێر داواکاری دەنێرن، بە شێوەی ڕاستەوخۆ لێرەدا دەردەکەوێت."
          icon={<Utensils className="w-8 h-8 text-orange-400" />}
        />
      </div>
    );
  }

  return (
    <div id="order-preparation-queue" className="space-y-4 select-none">
      {/* Top Banner Counter */}
      <div className="flex items-center justify-between p-3.5 bg-orange-500 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <Utensils className="w-5 h-5 text-white shrink-0" />
          <span className="font-black text-sm">داواکارییە چاوەڕوانکراوەکانی چێشتخانە</span>
        </div>
        <span className="bg-white text-orange-600 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
          {preparingOrders.length} داواکاری چالاک
        </span>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {preparingOrders.map((order) => {
          const orderNumDisplay =
            order.orderNumber ||
            (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
          const isUpdating = updatingOrderId === order.orderId;
          const isPrinting = printingOrderId === order.orderId;

          return (
            <Card
              key={order.orderId}
              id={`prep-order-${order.orderId}`}
              className="flex flex-col justify-between bg-white border-2 border-orange-200 shadow-md rounded-3xl p-4 sm:p-5 text-right transition-all hover:border-orange-400"
            >
              <div>
                {/* Header: Order Number, Table, Time, Source Badge */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-orange-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base bg-orange-100 text-orange-950 px-2.5 py-0.5 rounded-xl border border-orange-300">
                        {orderNumDisplay}
                      </span>
                      {order.tableNumber && (
                        <span className="text-xs font-black bg-orange-500 text-white px-2.5 py-0.5 rounded-xl">
                          مێز: {order.tableNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span dir="ltr">{formatBaghdadTime(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {order.source === 'captain' ? (
                      <span className="flex items-center gap-1 text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                        <Smartphone className="w-3 h-3" />
                        <span>کاپتن</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg border border-orange-200">
                        <Monitor className="w-3 h-3" />
                        <span>POS</span>
                      </span>
                    )}

                    <span
                      className="text-xs font-black text-orange-600 bg-orange-50/80 px-2 py-0.5 rounded-lg font-mono"
                      dir="ltr"
                    >
                      {formatIQD(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="py-3 space-y-2 border-b border-orange-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-gray-900 text-sm">
                            {item.productName}
                          </span>
                          {item.portion && (
                            <span className="text-[10px] text-orange-800 bg-orange-50 px-1.5 py-0.2 rounded font-bold border border-orange-100">
                              {item.portion}
                            </span>
                          )}
                        </div>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            [{item.customizations.join('، ')}]
                          </p>
                        )}
                      </div>

                      <div className="font-mono text-xs font-black text-gray-800 shrink-0 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
                        {item.quantity} ×
                      </div>
                    </div>
                  ))}

                  {/* Kitchen Note */}
                  {order.note && (
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5 mt-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <span className="font-bold">تێبینی: {order.note}</span>
                    </div>
                  )}
                </div>

                {/* Print Status indicator & Attendant info */}
                <div className="pt-2 flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                  {order.createdByName ? (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>تۆمارکار: {order.createdByName}</span>
                    </div>
                  ) : (
                    <div />
                  )}

                  {order.kitchenPrintStatus === 'failed' && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>چاپ نەکراوە</span>
                    </span>
                  )}
                  {order.kitchenPrintStatus === 'printed' && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      چاپکراوە
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-2">
                <Button
                  id={`complete-prep-order-${order.orderId}`}
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => handleMarkCompleted(order)}
                  isLoading={isUpdating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-2xl custom-shadow text-xs sm:text-sm gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تەواو بوو (ئامادەکرا)</span>
                </Button>

                <Button
                  id={`reprint-order-${order.orderId}`}
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => handleReprintReceipt(order)}
                  isLoading={isPrinting}
                  className="px-3 py-2.5 rounded-2xl border-orange-200 hover:bg-orange-50 text-gray-700 font-bold text-xs gap-1 cursor-pointer"
                  title="چاپکردنەوەی پسوولە"
                >
                  <Printer className="w-4 h-4 text-orange-500" />
                  <span className="hidden sm:inline">چاپکردنەوە</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
