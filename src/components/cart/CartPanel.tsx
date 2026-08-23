import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
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
import { ShoppingBag, Trash2, CheckCircle2, MessageSquare } from 'lucide-react';

export const CartPanel: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    totalAmount,
    note,
    setNote,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { user, displayName } = useAuth();
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
      error('پەیوەندی ئینتەرنێت پچڕاوە. ناتوانرێت داواکاری پاشەکەوت بکرێت.');
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

      // Step 3 & 4: Create and save order in Firestore with status = 'preparing'
      const newOrder = await createOrder({
        items,
        note,
        userId: user.uid,
        userName: displayName,
      });

      // Step 5: Confirmed success -> Clear cart
      clearCart();

      const shortOrderId = newOrder.orderId ? newOrder.orderId.slice(-6).toUpperCase() : '000000';
      const timeStr = formatBaghdadTime(newOrder.createdAt);

      // Trigger preparation notification
      showToast(
        `ژمارەی داواکاری: #${shortOrderId} • کات: ${timeStr} (${formatIQD(newOrder.totalAmount)})`,
        'success',
        'داواکاریەکە نێردرا بۆ ئامادەکردن',
        5000
      );

      // Step 6 & 7: Set completed order state and open modal
      setCompletedOrder(newOrder);
      setIsSuccessModalOpen(true);

      // Step 8: Trigger POS receipt print automatically
      setTimeout(() => {
        try {
          window.print();
        } catch (printErr) {
          console.warn('Automatic print dialog error:', printErr);
          warning('فرۆشتن بە سەرکەوتوویی تۆمارکرا، بەڵام چاپکردنی پسوولە سەرکەوتوو نەبوو');
        }
      }, 350);
    } catch (err: any) {
      console.error('Order creation error:', err);
      // If saving fails: preserve cart and notify
      error(
        err.message || 'داواکاریەکە نەنێردرا بۆ ئامادەکردن. فرۆشتن تۆمار نەکرا. تکایە دووبارە هەوڵ بدەرەوە.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="pos-cart-panel"
      className="flex flex-col h-full bg-white rounded-3xl border-2 border-orange-100 shadow-lg overflow-hidden"
    >
      {/* Cart Header */}
      <div className="p-4 sm:p-5 bg-white border-b border-orange-100 flex items-center justify-between">
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

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[calc(100vh-380px)] md:max-h-none">
        {items.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="سەبەتە بەتاڵە"
              description="خواردن یان کاڵایەک لە لیستی تەنیشت دیاری بکە بۆ ئەوەی لێرەدا دەربکەوێت."
              icon={<ShoppingBag className="w-8 h-8 text-orange-400" />}
            />
          </div>
        ) : (
          items.map((item, idx) => (
            <CartItemRow
              key={`${item.productId}-${item.portion}-${idx}`}
              item={item}
              index={idx}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              onRemove={removeItem}
            />
          ))
        )}
      </div>

      {/* Note & Bottom Summary */}
      {items.length > 0 && (
        <div className="p-4 sm:p-5 bg-white border-t border-orange-100 space-y-3.5">
          {/* Note Input */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <input
              id="order-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="تێبینی بۆ چێشتخانە (ئارەزوومەندانە)..."
              className="w-full pr-9 pl-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-orange-100 bg-orange-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 text-right text-gray-800"
            />
          </div>

          {/* Totals Box */}
          <OrderSummary
            subtotal={subtotal}
            totalAmount={totalAmount}
            itemCount={itemCount}
          />

          {/* Complete Order Button */}
          <Button
            id="complete-order-btn"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCompleteOrder}
            isLoading={isSubmitting}
            disabled={!isOnline || items.length === 0}
            className="w-full bg-orange-500 text-white font-black py-4 rounded-2xl text-base sm:text-lg custom-shadow hover:bg-orange-600 active:translate-y-1 active:shadow-none transition-all gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>تەواوکردنی فرۆشتن</span>
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
