import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useShift } from '../../hooks/useShift';
import { useToast } from '../../hooks/useToast';
import { useProducts } from '../../hooks/useProducts';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { createOrder } from '../../services/orders.service';
import { Order } from '../../types/order';
import { CartItemRow } from './CartItemRow';
import { OrderSummary } from './OrderSummary';
import { OrderSuccessModal } from './OrderSuccessModal';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { formatIQD } from '../../utils/currency';
import { formatBaghdadTime } from '../../utils/dates';
import { ShoppingBag, Trash2, CheckCircle2, MessageSquare, UtensilsCrossed } from 'lucide-react';

const COMMON_TABLES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'هۆڵ', 'سەفەری'];

interface CartPanelProps {
  isMobileDrawer?: boolean;
  onClose?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({ isMobileDrawer = false, onClose }) => {
  const {
    items,
    itemCount,
    subtotal,
    totalAmount,
    note,
    setNote,
    tableNumber,
    setTableNumber,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { user, displayName, role } = useAuth();
  const { activeShift } = useShift();
  const { isProductActive } = useProducts();
  const { showToast, error, warning } = useToast();
  const { isOnline } = useNetworkStatus();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  const handleCompleteOrder = async () => {
    // Step 1: Validations
    if (!user) {
      error('تکایە سەرەتا بچۆ ژوورەوە بۆ تەواوکردنی داواکاری');
      return;
    }

    if (items.length === 0) {
      error('سەبەتەی داواکاری بەتاڵە');
      return;
    }

    if (!isOnline) {
      error('پەیوەندی ئینتەرنێت پچڕاوە. داواکارییەکە نەنێردرا.');
      return;
    }

    // Availability & pricing validation check
    const inactiveItem = items.find((item) => !isProductActive(item.productId));
    if (inactiveItem) {
      error(
        `خواردنی (${inactiveItem.productName}) لە ئێستادا بەردەست نییە و ناتوانرێت بفرۆشرێت. تکایە لە سەبەتەکە لایببە.`
      );
      return;
    }

    const invalidPriceItem = items.find((item) => item.unitPrice <= 0 || item.quantity <= 0);
    if (invalidPriceItem) {
      error('نرخ یان ژمارەی بڕگەی سەبەتە نادروستە');
      return;
    }

    // Step 2: Prevent duplicate submission
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const orderSource = role === 'captain' ? 'captain' : 'pos';

      // Step 3 & 4: Create and save order in Firestore with status = 'preparing'
      const newOrder = await createOrder({
        items,
        note,
        tableNumber,
        source: orderSource,
        shiftId: activeShift?.id,
        userId: user.uid,
        userName: displayName,
      });

      // Step 5: Confirmed success -> Clear cart
      clearCart();

      const orderNumDisplay = newOrder.orderNumber || (newOrder.orderId ? `#${newOrder.orderId.slice(-4).toUpperCase()}` : '#001');
      const timeStr = formatBaghdadTime(newOrder.createdAt);
      const tableInfo = newOrder.tableNumber ? ` • مێز: ${newOrder.tableNumber}` : '';

      // Trigger preparation notification
      showToast(
        `ژمارەی داواکاری: ${orderNumDisplay}${tableInfo} • کات: ${timeStr} (${formatIQD(newOrder.totalAmount)})`,
        'success',
        'داواکاریەکە بە سەرکەوتوویی نێردرا بۆ ئامادەکردن',
        5000
      );

      // Step 6 & 7: Set completed order state and open modal
      setCompletedOrder(newOrder);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.error('Order creation error:', err);
      // If saving fails: preserve cart and notify
      error(
        err.message || 'داواکارییەکە نەنێردرا. تکایە پەیوەندی ئینتەرنێت بپشکنە و دووبارە هەوڵ بدەرەوە.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="pos-cart-panel"
      className={`flex flex-col h-full min-h-0 bg-white ${
        isMobileDrawer ? 'rounded-none border-0 shadow-none' : 'rounded-3xl border-2 border-orange-100 shadow-lg'
      } overflow-hidden`}
    >
      {/* Cart Header (only shown if not already framed by mobile drawer header) */}
      {!isMobileDrawer && (
        <div className="shrink-0 p-4 sm:p-5 bg-white border-b border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl font-bold shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-800">سەبەتەی داواکاری</h3>
              <span className="text-xs text-orange-600 font-bold">
                {itemCount > 0 ? `${itemCount} بڕگە دیاریکراوە` : 'سەبەتە بەتاڵە'}
              </span>
            </div>
          </div>

          {items.length > 0 && (
            <button
              id="clear-cart-btn"
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50 cursor-pointer font-bold"
              title="سڕینەوەی هەموو سەبەتە"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>بەتاڵکردن</span>
            </button>
          )}
        </div>
      )}

      {/* Cart Items List - Vertically constrained & independently scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-2.5">
        {items.length === 0 ? (
          <div className="py-8 sm:py-12">
            <EmptyState
              title="سەبەتە بەتاڵە"
              description="خواردن یان کاڵایەک لە لیستی تەنیشت دیاری بکە بۆ ئەوەی لێرەدا دەربکەوێت."
              icon={<ShoppingBag className="w-8 h-8 text-orange-400" />}
            />
          </div>
        ) : (
          <>
            {isMobileDrawer && (
              <div className="flex items-center justify-between pb-1 border-b border-orange-100/60">
                <span className="text-xs font-bold text-gray-500">{itemCount} بڕگە لە سەبەتەدا</span>
                <button
                  id="mobile-clear-cart-btn"
                  type="button"
                  onClick={() => setIsClearConfirmOpen(true)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors py-1 px-2 rounded-lg hover:bg-red-50 cursor-pointer font-bold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>بەتاڵکردن</span>
                </button>
              </div>
            )}
            {items.map((item, idx) => (
              <CartItemRow
                key={`${item.productId}-${item.portion}-${idx}`}
                item={item}
                index={idx}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeItem}
              />
            ))}
          </>
        )}
      </div>

      {/* Table Selection, Note & Bottom Summary - Pinned at bottom, always reachable */}
      {items.length > 0 && (
        <div className="shrink-0 p-3.5 sm:p-4 bg-white border-t border-orange-100 space-y-2.5 sm:space-y-3 safe-area-pb shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-10">
          {/* Table Number Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                <span>ژمارەی مێز (ئارەزوومەندانە):</span>
              </label>
              {tableNumber && (
                <button
                  type="button"
                  onClick={() => setTableNumber('')}
                  className="text-[10px] text-gray-400 hover:text-red-500 font-bold cursor-pointer"
                >
                  پاککردنەوە
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <input
                id="cart-table-input"
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="ژمارەی مێز (نموونە: 12)..."
                className="min-w-[100px] sm:min-w-[110px] flex-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-orange-200 bg-orange-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 text-right text-gray-800"
              />
              <div className="flex items-center gap-1 shrink-0">
                {COMMON_TABLES.slice(0, 6).map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setTableNumber(tbl)}
                    className={`px-2 py-1 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                      tableNumber === tbl
                        ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                        : 'bg-white text-gray-700 border-orange-100 hover:bg-orange-50'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <input
              id="order-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="تێبینی بۆ چێشتخانە (ئارەزوومەندانە)..."
              className="w-full pr-9 pl-3.5 py-1.5 sm:py-2 text-xs font-semibold rounded-2xl border border-orange-100 bg-orange-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 text-right text-gray-800"
            />
          </div>

          {/* Totals Box */}
          <OrderSummary
            subtotal={subtotal}
            totalAmount={totalAmount}
            itemCount={itemCount}
          />

          {/* Send to Preparation Button */}
          <Button
            id="complete-order-btn"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCompleteOrder}
            isLoading={isSubmitting}
            disabled={!isOnline || items.length === 0}
            className="w-full bg-orange-500 text-white font-black py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base custom-shadow hover:bg-orange-600 active:translate-y-1 active:shadow-none transition-all gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ناردن بۆ ئامادەکردن</span>
          </Button>
        </div>
      )}

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          clearCart();
          setIsClearConfirmOpen(false);
        }}
        title="بەتاڵکردنی سەبەتە"
        message="دڵنیایت لە سڕینەوەی هەموو بڕگەکانی ناو ئەم سەبەتەیە؟"
        confirmText="بەڵێ، بەتاڵی بکە"
        variant="danger"
      />

      {/* Sales Completion Receipt & Confirmation Modal */}
      <OrderSuccessModal
        order={completedOrder}
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setCompletedOrder(null);
        }}
      />
    </div>
  );
};
