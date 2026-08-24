import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StockMovement, Ingredient } from '../../types/inventory';
import { listenStockMovements } from '../../services/inventory.service';
import { formatBaghdadTime } from '../../utils/dates';
import { History, ArrowDownToLine, Sliders, ShoppingBag, Clock, User } from 'lucide-react';

interface StockMovementHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
}

export const StockMovementHistoryModal: React.FC<StockMovementHistoryModalProps> = ({
  isOpen,
  onClose,
  ingredient,
}) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = listenStockMovements(
      (loaded) => {
        setMovements(loaded);
        setLoading(false);
      },
      ingredient ? ingredient.id : undefined,
      40
    );

    return () => unsubscribe();
  }, [isOpen, ingredient]);

  const getMovementBadge = (type: string, quantity: number) => {
    switch (type) {
      case 'stock_in':
        return (
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg text-xs font-black">
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>زیادکردنی کۆگا (+{quantity})</span>
          </span>
        );
      case 'stock_adjustment':
        return (
          <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg text-xs font-black">
            <Sliders className="w-3.5 h-3.5" />
            <span>ڕێکخستن ({quantity > 0 ? `+${quantity}` : quantity})</span>
          </span>
        );
      case 'consumption':
        return (
          <span className="flex items-center gap-1 text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg text-xs font-black">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>بەکارهاتنی داواکاری ({quantity})</span>
          </span>
        );
      default:
        return (
          <span className="text-gray-700 bg-gray-50 px-2 py-0.5 rounded-lg text-xs font-black">
            {quantity}
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        ingredient
          ? `مێژووی جووڵەی کۆگا: ${ingredient.name}`
          : 'مێژووی هەموو جووڵەکانی کۆگا'
      }
      icon={<History className="w-5 h-5 text-orange-500" />}
      size="lg"
      footer={
        <div className="flex items-center justify-end w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-2xl font-bold"
          >
            داخستن
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-right">
        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500 font-bold">
            بارکردنی مێژووی جووڵەکانی کۆگا...
          </div>
        ) : movements.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 font-bold bg-gray-50 rounded-2xl border border-gray-100">
            هیچ جووڵەیەکی تۆمارکراو بۆ ئەم پێکهاتەیە نەدۆزرایەوە
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pl-1">
            {movements.map((mov, idx) => (
              <div
                key={mov.id || idx}
                className="p-3 bg-white hover:bg-orange-50/30 rounded-2xl border border-gray-100 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getMovementBadge(mov.type, mov.quantity)}
                    <span className="font-bold text-gray-900">
                      {mov.ingredientName || ingredient?.name || 'پێکهاتە'}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium text-[11px]">
                    {mov.reason || 'بێ هۆکار'}
                  </p>
                </div>

                <div className="text-left space-y-1 shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 justify-end">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{formatBaghdadTime(mov.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 justify-end">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>{mov.createdByName || 'سیستەم'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
