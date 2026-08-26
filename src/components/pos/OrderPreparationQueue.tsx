import React, { useState } from 'react';
import { Order } from '../../types/order';
import { usePOSRealtime } from '../../contexts/POSRealtimeContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { formatIQD } from '../../utils/currency';
import { formatBaghdadTime } from '../../utils/dates';
import { useToast } from '../../hooks/useToast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import {
  Utensils,
  Printer,
  Clock,
  User,
  Smartphone,
  Monitor,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';

const QUICK_CANCEL_REASONS = [
  'هەڵەی کڕیار لە داواکاری',
  'پاشگەزبوونەوەی کڕیار',
  'دواکەوتنی چێشتخانە',
  'خواردنی داواکراو نەماوە',
  'داواکاری دووبارە بوو',
];

export const OrderPreparationQueue: React.FC = () => {
  const {
    activeOrders,
    preparingCount,
    totalActiveCount,
    loading,
    cancelOrder,
    acknowledgeOrder,
    reprintOrder,
  } = usePOSRealtime();

  const { success, error, warning, info } = useToast();
  const { isOnline } = useNetworkStatus();

  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [acknowledgingOrderId, setAcknowledgingOrderId] = useState<string | null>(null);
  const [hideSeenOrders, setHideSeenOrders] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Cancellation Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const handleOpenCancelModal = (order: Order) => {
    setCancelModalOrder(order);
    setCancelReason('');
  };

  const handleRefreshAndClearSeen = () => {
    setIsRefreshing(true);
    setHideSeenOrders(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const seenCount = activeOrders.filter((o) => !!o.kitchenAcknowledged).length;
      if (seenCount > 0) {
        success(`لیستەکە نوێکرایەوە و (${seenCount}) پسوولەی بینراو لادران`);
      } else {
        info('لیستەکە نوێکرایەوە (هیچ پسوولەیەکی بینراو نییە بۆ لابردن)');
      }
    }, 350);
  };

  const handleToggleShowAll = () => {
    setHideSeenOrders(!hideSeenOrders);
  };

  const handleAcknowledge = async (order: Order) => {
    if (!isOnline) {
      error('پەیوەندی ئینتەرنێت پچڕاوە');
      return;
    }

    try {
      setAcknowledgingOrderId(order.orderId);
      await acknowledgeOrder(order.orderId);
      const orderNum =
        order.orderNumber ||
        (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
      success(`داواکاری ${orderNum} بینرا`);
    } catch (err: any) {
      console.error('Acknowledge error:', err);
      error(err.message || 'هەڵەیەک ڕوویدا');
    } finally {
      setAcknowledgingOrderId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    if (!isOnline) {
      error('پەیوەندی ئینتەرنێت پچڕاوە. ناتوانرێت داواکاری هەڵبوەشێنرێتەوە.');
      return;
    }
    if (!cancelReason.trim()) {
      error('تکایە هۆکاری هەڵوەشاندنەوە بنووسە یان دیاری بکە');
      return;
    }

    try {
      setIsCancelling(true);
      await cancelOrder(cancelModalOrder.orderId, cancelReason.trim());
      const orderNum =
        cancelModalOrder.orderNumber ||
        (cancelModalOrder.orderId
          ? `#${cancelModalOrder.orderId.slice(-4).toUpperCase()}`
          : '#001');
      success(`داواکاری ${orderNum} هەڵوەشێنرایەوە`);
      setCancelModalOrder(null);
      setCancelReason('');
    } catch (err: any) {
      console.error('Cancellation error:', err);
      error(err.message || 'هەڵەیەک لە هەڵوەشاندنەوەی داواکاری ڕوویدا');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReprintReceipt = async (order: Order) => {
    try {
      setPrintingOrderId(order.orderId);
      const res = await reprintOrder(order);
      if (res.status === 'success') {
        success('پسوولەکە بە سەرکەوتوویی چاپکرایەوە');
      } else if (res.status === 'unavailable' || res.status === 'unsupported') {
        warning(res.error || 'چاپکەری iMin لەم ئامێرەدا نەدۆزرایەوە');
      } else {
        warning(res.error || 'چاپکردنی پسوولە سەرکەوتوو نەبوو (تکایە دووبارە هەوڵبدەرەوە)');
      }
    } catch (err: unknown) {
      console.error('Reprint error:', err);
      warning('هەڵەیەک لە چاپکردنی پسوولە ڕوویدا');
    } finally {
      setPrintingOrderId(null);
    }
  };

  if (loading && totalActiveCount === 0) {
    return (
      <div className="py-12 text-center text-gray-500 font-bold flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
        <span>بارکردنی داواکارییە چالاکەکان...</span>
      </div>
    );
  }

  const unseenCount = activeOrders.filter((o) => !o.kitchenAcknowledged).length;
  const seenCount = activeOrders.filter((o) => !!o.kitchenAcknowledged).length;
  const displayedOrders = hideSeenOrders
    ? activeOrders.filter((o) => !o.kitchenAcknowledged)
    : activeOrders;

  return (
    <div id="order-preparation-queue" className="space-y-4 select-none">
      {/* Operational Header Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl border bg-white text-gray-800 border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Utensils className="w-5 h-5 text-amber-500" />
          <span className="text-sm sm:text-base font-bold">لیستی داواکارییە نێردراوەکان بۆ ئامادەکردن</span>
          {unseenCount > 0 && (
            <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-orange-500 text-white animate-pulse">
              {unseenCount} نوێ
            </span>
          )}
          {hideSeenOrders && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
              بینراوەکان شاردراونەتەوە
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh and Clean Seen Orders Button */}
          <button
            id="refresh-clear-seen-btn"
            type="button"
            onClick={handleRefreshAndClearSeen}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-3.5 py-2 rounded-2xl shadow-2xs transition-all cursor-pointer"
            title="ڕیفرێش و لابردنی ئەو پسوولانەی بینراون لەسەر شاشە"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>ڕیفرێش و لابردنی بینراوەکان</span>
          </button>

          {/* Toggle all vs unseen view */}
          {seenCount > 0 && (
            <button
              id="toggle-seen-filter-btn"
              type="button"
              onClick={handleToggleShowAll}
              className={`text-xs font-bold px-3 py-2 rounded-2xl border transition-colors cursor-pointer ${
                hideSeenOrders
                  ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {hideSeenOrders ? `پیشاندانەوەی بینراوەکان (${seenCount})` : 'تەنها نەبینراوەکان'}
            </button>
          )}

          <span className="font-mono font-black text-xs sm:text-sm px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
            {displayedOrders.length} داواکاری
          </span>
        </div>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="py-12 bg-white rounded-3xl border border-dashed border-amber-200 text-center p-8">
          <EmptyState
            title={hideSeenOrders && activeOrders.length > 0 ? "هەموو داواکارییە بینراوەکان لادران لە لیستەکە" : "هیچ داواکارییەک لە ئامادەکردندا نییە"}
            description={hideSeenOrders && activeOrders.length > 0 ? `(${seenCount}) داواکاری بینراون و ئامادەکراون. دەتوانیت پەنجە بنێیت لە "پیشاندانەوەی بینراوەکان".` : "داواکارییە نوێیەکان ڕاستەوخۆ دوای ناردن لێرەدا دەردەکەون."}
            icon={<Utensils className="w-8 h-8 text-orange-400" />}
            action={
              hideSeenOrders && activeOrders.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHideSeenOrders(false)}
                  className="rounded-2xl font-bold mt-2"
                >
                  پیشاندانەوەی هەموو داواکارییەکان
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        /* Orders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedOrders.map((order) => {
            const orderNumDisplay =
              order.orderNumber ||
              (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
            const isPrinting = printingOrderId === order.orderId;
            const isAcknowledging = acknowledgingOrderId === order.orderId;
            const isSeen = !!order.kitchenAcknowledged;

            return (
              <Card
                key={order.orderId}
                id={`prep-order-${order.orderId}`}
                className={`flex flex-col justify-between bg-white border-2 shadow-sm rounded-3xl p-4 sm:p-5 text-right transition-all ${
                  isSeen
                    ? 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/20'
                    : 'border-amber-300 hover:border-amber-400 shadow-md ring-1 ring-amber-200'
                }`}
              >
                <div>
                  {/* Top Row: Order Number, Table, Time, Status Badge */}
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
                      {/* Operational Status Pill */}
                      {isSeen ? (
                        <span className="flex items-center gap-1 text-[11px] font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>بینراوە</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-300">
                          <Utensils className="w-3 h-3 text-amber-700" />
                          <span>لە ئامادەکردندایە</span>
                        </span>
                      )}

                      {/* Source indicator */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {order.source === 'captain' ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            <Smartphone className="w-2.5 h-2.5" />
                            <span>کاپتن</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200">
                            <Monitor className="w-2.5 h-2.5" />
                            <span>POS</span>
                          </span>
                        )}
                        <span
                          className="text-xs font-black text-orange-600 font-mono"
                          dir="ltr"
                        >
                          {formatIQD(order.totalAmount)}
                        </span>
                      </div>
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

                    {/* Note if provided */}
                    {order.note && (
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5 mt-2">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <span className="font-bold">تێبینی: {order.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Creator info */}
                  {order.createdByName && (
                    <div className="pt-2 flex items-center justify-end text-[10px] text-gray-400 gap-1">
                      <User className="w-3 h-3" />
                      <span>{order.createdByName}</span>
                    </div>
                  )}
                </div>

                {/* Operations Actions: Seen Button ("بینی"), Reprint and Cancel */}
                <div className="pt-4 flex items-center justify-between gap-2">
                  {/* Single Action "بینی" Button */}
                  <button
                    id={`seen-order-btn-${order.orderId}`}
                    type="button"
                    onClick={() => handleAcknowledge(order)}
                    disabled={isAcknowledging || isSeen}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs ${
                      isSeen
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 opacity-90 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm'
                    }`}
                    title={isSeen ? 'داواکاری بینراوە' : 'دیاریکردن وەک بینراو'}
                  >
                    {isAcknowledging ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : isSeen ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>بینراوە</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>بینی</span>
                      </>
                    )}
                  </button>

                  {/* Manual Reprint Button */}
                  <Button
                    id={`reprint-order-${order.orderId}`}
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => handleReprintReceipt(order)}
                    isLoading={isPrinting}
                    className="px-3 py-2 rounded-2xl border-orange-200 hover:bg-orange-50 text-gray-700 font-bold text-xs gap-1.5 cursor-pointer"
                    title="چاپکردنەوەی پسوولە"
                  >
                    <Printer className="w-4 h-4 text-orange-500" />
                    <span className="hidden sm:inline">چاپکردنەوە</span>
                  </Button>

                  {/* Cancel Button */}
                  <button
                    id={`cancel-order-btn-${order.orderId}`}
                    type="button"
                    onClick={() => handleOpenCancelModal(order)}
                    className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    title="هەڵوەشاندنەوەی داواکاری"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">هەڵوەشاندن</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Cancellation Modal */}
      {cancelModalOrder && (
        <Modal
          isOpen={!!cancelModalOrder}
          onClose={() => {
            if (!isCancelling) {
              setCancelModalOrder(null);
              setCancelReason('');
            }
          }}
          title="هەڵوەشاندنەوەی داواکاری"
          icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
          size="md"
          footer={
            <div className="flex items-center justify-between gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCancelModalOrder(null);
                  setCancelReason('');
                }}
                disabled={isCancelling}
                className="rounded-2xl text-xs font-bold cursor-pointer"
              >
                پاشگەزبوونەوە
              </Button>

              <Button
                id="confirm-cancel-order-btn"
                type="button"
                variant="danger"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
                disabled={!cancelReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2.5 rounded-2xl shadow-xs text-xs sm:text-sm cursor-pointer"
              >
                <span>پشتڕاستکردنەوەی هەڵوەشاندنەوە</span>
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-right select-none">
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold">
                  داواکاری:{' '}
                  {cancelModalOrder.orderNumber ||
                    `#${cancelModalOrder.orderId.slice(-4).toUpperCase()}`}
                </span>
                {cancelModalOrder.tableNumber && (
                  <span className="mr-2 font-bold">
                    (مێزی {cancelModalOrder.tableNumber})
                  </span>
                )}
              </div>
              <span className="font-mono font-bold text-red-700">
                {formatIQD(cancelModalOrder.totalAmount)}
              </span>
            </div>

            <p className="text-xs text-gray-600 font-semibold">
              تکایە هۆکاری هەڵوەشاندنەوە دیاری بکە (پێویستە):
            </p>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-2">
              {QUICK_CANCEL_REASONS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCancelReason(chip)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                    cancelReason === chip
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-red-50 hover:border-red-200'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Custom Reason Textarea */}
            <div>
              <textarea
                id="cancel-reason-textarea"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="هۆکاری هەڵوەشاندنەوە بنووسە..."
                rows={3}
                className="w-full p-3 text-xs bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 text-right font-semibold"
              />
            </div>

            <p className="text-[11px] text-gray-400">
              * داواکاری هەڵوەشاوە لە لیستەکانی فرۆش و قازانج دەسڕدرێتەوە و لە داتابەیس دەمێنێتەوە بۆ پێداچوونەوە.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
