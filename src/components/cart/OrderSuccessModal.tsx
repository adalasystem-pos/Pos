import React from 'react';
import { Order } from '../../types/order';
import { formatIQD } from '../../utils/currency';
import { APP_CONFIG } from '../../config/appConfig';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PosReceipt } from '../pos/PosReceipt';
import { formatBaghdadTime } from '../../utils/dates';
import { iminPrinter } from '../../services/iminPrinter';
import { CheckCircle2, Clock, User, FileText, Printer, Utensils } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!order) return null;

  const orderTimeStr = formatBaghdadTime(order.createdAt);
  const orderNumDisplay = order.orderNumber || (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');

  const handlePrint = async () => {
    try {
      await iminPrinter.printReceipt(order, true);
    } catch (err) {
      console.error('Print trigger error:', err);
    }
  };

  return (
    <>
      {/* Isolated thermal print element for window.print() */}
      <PosReceipt order={order} isPrintOnly />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="داواکاری بە سەرکەوتوویی نێردرا بۆ ئامادەکردن"
        icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
        size="md"
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-bold rounded-2xl print:hidden cursor-pointer"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>چاپکردنەوەی پسوولە</span>
            </Button>

            <Button
              id="order-success-confirm-btn"
              type="button"
              variant="primary"
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-2xl custom-shadow text-sm cursor-pointer"
            >
              <span>داواکاری نوێ (باشە)</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-right select-none">
          {/* Preparation Status Notice Banner */}
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">داواکاریەکە نێردرا بۆ ئامادەکردن</span>
            </div>
            <span className="text-xs font-mono font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-300">
              {orderNumDisplay}
            </span>
          </div>

          {/* Receipt Container */}
          <div className="p-4 bg-orange-50/50 rounded-3xl border-2 border-dashed border-orange-200 text-gray-800 space-y-3.5">
            {/* Receipt Header */}
            <div className="text-center space-y-1 pb-3 border-b border-orange-200">
              <h2 className="text-lg font-black text-gray-900">{APP_CONFIG.restaurantName}</h2>
              <p className="text-xs text-gray-500 font-semibold">{APP_CONFIG.systemName}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 mt-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-mono font-bold">
                <span>ژمارەی داواکاری: {orderNumDisplay}</span>
                {order.tableNumber && (
                  <span className="bg-emerald-200 px-2 py-0.2 rounded-full font-bold">
                    مێز: {order.tableNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 font-semibold pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>کات: <span dir="ltr">{orderTimeStr}</span></span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <span>تۆمارکار: {order.createdByName || 'کاشێر'}</span>
                <User className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              </div>
            </div>

            {/* Items Table */}
            <div className="pt-2 border-t border-orange-100 space-y-2">
              <div className="text-xs font-bold text-gray-500 flex justify-between">
                <span>بڕگەکان</span>
                <span>کۆی نرخ</span>
              </div>

              <div className="divide-y divide-orange-100/70 max-h-48 overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-gray-900">
                        {item.productName}{' '}
                        <span className="text-orange-600 font-normal">
                          ({item.portion || 'نەفەر'}) × {item.quantity}
                        </span>
                      </p>
                      {item.customizations && item.customizations.length > 0 && (
                        <p className="text-[10px] text-gray-500">
                          {item.customizations.join('، ')}
                        </p>
                      )}
                    </div>
                    <span className="font-black text-gray-800 font-mono">
                      {formatIQD(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note if available */}
            {order.note && (
              <div className="p-2 bg-white rounded-xl border border-orange-100 text-xs text-gray-600 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                <span>تێبینی: {order.note}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="p-3 bg-white rounded-2xl border-2 border-emerald-200 flex items-center justify-between">
              <span className="text-sm font-black text-gray-800">کۆی گشتی بڕ:</span>
              <span className="text-lg font-black text-emerald-600 font-mono">
                {formatIQD(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Professional provider attribution */}
          <p className="text-[10px] text-center text-gray-400 font-medium pt-1">
            {APP_CONFIG.providerAttribution}
          </p>
        </div>
      </Modal>
    </>
  );
};
