import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../../types/order';
import { usePOSRealtime } from '../../contexts/POSRealtimeContext';
import { useAuth } from '../../contexts/AuthContext';
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
  CheckCircle2,
  Printer,
  Clock,
  User,
  Smartphone,
  Monitor,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Send,
  XCircle,
  Check,
  ChevronRight,
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
    preparingOrders,
    readyOrders,
    servedOrders,
    preparingCount,
    readyCount,
    servedCount,
    totalActiveCount,
    loading,
    markOrderReady,
    markOrderServed,
    completeOrder,
    cancelOrder,
    reprintOrder,
  } = usePOSRealtime();

  const { role } = useAuth();
  const { success, error, warning } = useToast();
  const { isOnline } = useNetworkStatus();

  const [filterStatus, setFilterStatus] = useState<'all' | 'preparing' | 'ready' | 'served'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);

  // Cancellation Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Filter orders based on active tab
  const displayedOrders = useMemo(() => {
    switch (filterStatus) {
      case 'preparing':
        return preparingOrders;
      case 'ready':
        return readyOrders;
      case 'served':
        return servedOrders;
      case 'all':
      default:
        return activeOrders;
    }
  }, [filterStatus, activeOrders, preparingOrders, readyOrders, servedOrders]);

  const handleMarkReady = async (order: Order) => {
    if (!isOnline) {
      error('پەیوەندی ئینتەرنێت پچڕاوە. ناتوانرێت دۆخی داواکاری بگۆڕدرێت.');
      return;
    }
    try {
      setUpdatingOrderId(order.orderId);
      await markOrderReady(order.orderId);
      const orderNum =
        order.orderNumber ||
        (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
      success(`داواکاری ${orderNum} ئامادەکرا`);
    } catch (err: any) {
      console.error('Error marking ready:', err);
      error(err.message || 'هەڵەیەک لە گۆڕینی دۆخی داواکاری ڕوویدا');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkServed = async (order: Order) => {
    if (!isOnline) {
      error('پەیوەندی ئینتەرنێت پچڕاوە. ناتوانرێت دۆخی داواکاری بگۆڕدرێت.');
      return;
    }
    try {
      setUpdatingOrderId(order.orderId);
      await markOrderServed(order.orderId);
      const orderNum =
        order.orderNumber ||
        (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
      success(`داواکاری ${orderNum} گەیەنرا بە کڕیار`);
    } catch (err: any) {
      console.error('Error marking served:', err);
      error(err.message || 'هەڵەیەک لە گۆڕینی دۆخی داواکاری ڕوویدا');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCompleteOrder = async (order: Order) => {
    if (!isOnline) {
      error('پەیوەندی ئینتەرنێت پچڕاوە. ناتوانرێت داواکاری تەواو بکرێت.');
      return;
    }
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

  const handleOpenCancelModal = (order: Order) => {
    setCancelModalOrder(order);
    setCancelReason('');
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

  return (
    <div id="order-preparation-queue" className="space-y-4 select-none">
      {/* Operational Status Counters Bar */}
      <div className="grid grid-cols-3 gap-3">
        {/* Preparing Counter */}
        <div
          onClick={() => setFilterStatus('preparing')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            filterStatus === 'preparing'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-white text-gray-800 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Utensils
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                filterStatus === 'preparing' ? 'text-white' : 'text-amber-500'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold">لە ئامادەکردندا</span>
          </div>
          <span
            className={`font-mono font-black text-sm sm:text-base px-2 py-0.5 rounded-xl ${
              filterStatus === 'preparing'
                ? 'bg-white text-amber-600'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {preparingCount}
          </span>
        </div>

        {/* Ready Counter */}
        <div
          onClick={() => setFilterStatus('ready')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            filterStatus === 'ready'
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
              : 'bg-white text-gray-800 border-blue-200 hover:bg-blue-50/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                filterStatus === 'ready' ? 'text-white' : 'text-blue-500'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold">ئامادەیە</span>
          </div>
          <span
            className={`font-mono font-black text-sm sm:text-base px-2 py-0.5 rounded-xl ${
              filterStatus === 'ready'
                ? 'bg-white text-blue-600'
                : 'bg-blue-100 text-blue-900'
            }`}
          >
            {readyCount}
          </span>
        </div>

        {/* Served Counter */}
        <div
          onClick={() => setFilterStatus('served')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            filterStatus === 'served'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-gray-800 border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Send
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                filterStatus === 'served' ? 'text-white' : 'text-emerald-500'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold">گەیەنراو</span>
          </div>
          <span
            className={`font-mono font-black text-sm sm:text-base px-2 py-0.5 rounded-xl ${
              filterStatus === 'served'
                ? 'bg-white text-emerald-600'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {servedCount}
          </span>
        </div>
      </div>

      {/* Filter Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'all'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-orange-50 border border-orange-200/80'
          }`}
        >
          هەموو چالاکەکان ({totalActiveCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('preparing')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'preparing'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-amber-50 border border-orange-200/80'
          }`}
        >
          لە ئامادەکردندا ({preparingCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('ready')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'ready'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-blue-50 border border-orange-200/80'
          }`}
        >
          ئامادەیە بۆ گەیاندن ({readyCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('served')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            filterStatus === 'served'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-emerald-50 border border-orange-200/80'
          }`}
        >
          گەیەنراوە ({servedCount})
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="هیچ داواکارییەک لەم دۆخەدا نییە"
            description="داواکارییە نوێیەکان و گۆڕانکاری دۆخ بە شێوەی ڕاستەوخۆ لێرەدا دەردەکەون."
            icon={<Utensils className="w-8 h-8 text-orange-400" />}
          />
        </div>
      ) : (
        /* Orders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedOrders.map((order) => {
            const orderNumDisplay =
              order.orderNumber ||
              (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
            const isUpdating = updatingOrderId === order.orderId;
            const isPrinting = printingOrderId === order.orderId;

            const isPreparing = order.status === 'preparing';
            const isReady = order.status === 'ready';
            const isServed = order.status === 'served';

            return (
              <Card
                key={order.orderId}
                id={`prep-order-${order.orderId}`}
                className={`flex flex-col justify-between bg-white border-2 shadow-sm rounded-3xl p-4 sm:p-5 text-right transition-all ${
                  isPreparing
                    ? 'border-amber-200 hover:border-amber-400'
                    : isReady
                    ? 'border-blue-300 hover:border-blue-500 bg-blue-50/20'
                    : 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/20'
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
                      {isPreparing && (
                        <span className="flex items-center gap-1 text-[11px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-300">
                          <Utensils className="w-3 h-3 text-amber-700" />
                          <span>لە ئامادەکردندایە</span>
                        </span>
                      )}
                      {isReady && (
                        <span className="flex items-center gap-1 text-[11px] font-black bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-lg border border-blue-300 animate-pulse">
                          <CheckCircle2 className="w-3 h-3 text-blue-700" />
                          <span>ئامادەیە</span>
                        </span>
                      )}
                      {isServed && (
                        <span className="flex items-center gap-1 text-[11px] font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                          <Send className="w-3 h-3 text-emerald-700" />
                          <span>گەیەنراوە</span>
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

                  {/* Lifecycle Tracker bar */}
                  <div className="pt-2 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                    <div className="flex items-center gap-1">
                      <span className={isPreparing ? 'font-bold text-amber-600' : 'text-gray-400'}>
                        ئامادەکردن
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                      <span className={isReady ? 'font-bold text-blue-600' : 'text-gray-400'}>
                        ئامادە
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                      <span className={isServed ? 'font-bold text-emerald-600' : 'text-gray-400'}>
                        گەیەنراو
                      </span>
                    </div>

                    {order.createdByName && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <User className="w-3 h-3" />
                        <span>{order.createdByName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons depending on status */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Primary Action Button */}
                    {isPreparing && (
                      <Button
                        id={`mark-ready-${order.orderId}`}
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() => handleMarkReady(order)}
                        isLoading={isUpdating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-2xl shadow-xs text-xs sm:text-sm gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>ئامادەیە</span>
                      </Button>
                    )}

                    {isReady && (
                      <Button
                        id={`mark-served-${order.orderId}`}
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() => handleMarkServed(order)}
                        isLoading={isUpdating}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-2xl shadow-xs text-xs sm:text-sm gap-1.5 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>گەیەنرا</span>
                      </Button>
                    )}

                    {isServed && (
                      <Button
                        id={`complete-order-${order.orderId}`}
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() => handleCompleteOrder(order)}
                        isLoading={isUpdating}
                        disabled={role === 'captain'}
                        className={`flex-1 font-black py-2.5 rounded-2xl shadow-xs text-xs sm:text-sm gap-1.5 ${
                          role === 'captain'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                        }`}
                        title={role === 'captain' ? 'تەواوکردنی دارایی تایبەتە بە کاشێر' : 'تەواوکردنی داواکاری'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تەواوکردن</span>
                      </Button>
                    )}

                    {/* Manual Reprint Button */}
                    <Button
                      id={`reprint-order-${order.orderId}`}
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => handleReprintReceipt(order)}
                      isLoading={isPrinting}
                      className="px-3 py-2.5 rounded-2xl border-orange-200 hover:bg-orange-50 text-gray-700 font-bold text-xs gap-1 cursor-pointer shrink-0"
                      title="چاپکردنەوەی پسوولە"
                    >
                      <Printer className="w-4 h-4 text-orange-500" />
                      <span className="hidden sm:inline">چاپکردنەوە</span>
                    </Button>
                  </div>

                  {/* Cancel Button (allowed for preparing and ready states) */}
                  {(isPreparing || isReady) && (
                    <div className="flex justify-end">
                      <button
                        id={`cancel-order-btn-${order.orderId}`}
                        type="button"
                        onClick={() => handleOpenCancelModal(order)}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>هەڵوەشاندنەوەی داواکاری</span>
                      </button>
                    </div>
                  )}
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
