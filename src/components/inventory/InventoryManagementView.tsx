import React, { useState, useMemo } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../hooks/useAuth';
import { Ingredient } from '../../types/inventory';
import { LowStockAlertBanner } from './LowStockAlertBanner';
import { IngredientAddModal } from './IngredientAddModal';
import { IngredientEditModal } from './IngredientEditModal';
import { StockInModal } from './StockInModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { StockMovementHistoryModal } from './StockMovementHistoryModal';
import { Button } from '../ui/Button';
import {
  Package,
  PlusCircle,
  Search,
  AlertTriangle,
  Sliders,
  ArrowDownToLine,
  History,
  Edit3,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';

export const InventoryManagementView: React.FC = () => {
  const { ingredients, loading, error, toggleActive, lowStockCount } = useInventory();
  const { isAdminOrManager } = useAuth();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'low_stock' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [stockInIngredient, setStockInIngredient] = useState<Ingredient | null>(null);
  const [adjustIngredient, setAdjustIngredient] = useState<Ingredient | null>(null);
  const [historyIngredient, setHistoryIngredient] = useState<Ingredient | null>(null);

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.unit.toLowerCase().includes(searchTerm.toLowerCase().trim());

      if (!matchesSearch) return false;

      switch (filterMode) {
        case 'low_stock':
          return item.isActive !== false && item.currentStock <= item.minimumStock;
        case 'active':
          return item.isActive !== false;
        case 'inactive':
          return item.isActive === false;
        case 'all':
        default:
          return true;
      }
    });
  }, [ingredients, searchTerm, filterMode]);

  return (
    <div className="space-y-5 text-right">
      {/* Top Banner for Low Stock Alerts */}
      <LowStockAlertBanner
        onSelectIngredient={(id) => {
          const found = ingredients.find((i) => i.id === id);
          if (found) setStockInIngredient(found);
        }}
      />

      {/* Action Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-orange-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <span>کۆگا و پێکهاتەکان</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">
                {ingredients.length} کەرەستە
              </span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              بەڕێوەبردنی کەرەستەی خاو، ڕێژەی کۆگا و کەمکردنەوەی ئۆتۆماتیکی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setHistoryIngredient(null)} // opens full history
            className="rounded-2xl text-xs font-bold gap-1.5 border-gray-200 hover:bg-orange-50/50"
          >
            <History className="w-4 h-4 text-gray-600" />
            <span>مێژووی جووڵەکان</span>
          </Button>

          {isAdminOrManager && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-2xl text-xs font-black gap-1.5 bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>زیادکردنی پێکهاتە</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان بەدوای پێکهاتە یان یەکەی پێوانە..."
            className="w-full rounded-2xl border border-orange-100 bg-white pr-10 pl-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none min-h-[42px] shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterMode === 'all'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-orange-50'
            }`}
          >
            هەموو ({ingredients.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('low_stock')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterMode === 'low_stock'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>کۆگای کەم ({lowStockCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterMode === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-emerald-50'
            }`}
          >
            چالاکەکان
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('inactive')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterMode === 'inactive'
                ? 'bg-gray-700 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            ناچالاکەکان
          </button>
        </div>
      </div>

      {/* Ingredients Grid / List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400 font-bold">
          بارکردنی پێکهاتەکانی کۆگا...
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="py-16 bg-white rounded-3xl border border-orange-100 text-center space-y-3 p-6">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-400 mx-auto flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-gray-800">هیچ پێکهاتەیەک نەدۆزرایەوە</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm
              ? 'هیچ پێکهاتەیەک لەگەڵ وشەی گەڕانەکەت ناگونجێت'
              : 'هێشتا هیچ پێکهاتەیەک زیاد نەکراوە. دەتوانیت یەکەم پێکهاتەی کۆگا زیاد بکەیت'}
          </p>
          {isAdminOrManager && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-2xl text-xs font-black bg-orange-500 text-white mx-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>زیادکردنی پێکهاتەی نوێ</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIngredients.map((item) => {
            const isLow = item.isActive !== false && item.currentStock <= item.minimumStock;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-4 border transition-all hover:shadow-md flex flex-col justify-between space-y-3.5 ${
                  isLow
                    ? 'border-amber-400/80 bg-amber-50/20'
                    : item.isActive === false
                    ? 'border-gray-200 bg-gray-50/50 opacity-75'
                    : 'border-orange-100 hover:border-orange-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-gray-900">{item.name}</h3>
                      {item.isActive === false ? (
                        <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 text-[10px] font-bold">
                          ناچالاک
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>کۆگای کەم</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          بەردەست
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-bold block">
                      یەکە: {item.unit}
                    </span>
                  </div>

                  {/* Stock Quantity Display */}
                  <div className="text-left bg-gray-50 p-2.5 rounded-2xl border border-gray-100 min-w-[90px]">
                    <span className="text-[10px] text-gray-400 font-bold block">بڕی کۆگا</span>
                    <span
                      className={`text-base font-black font-mono ${
                        isLow
                          ? 'text-red-600'
                          : item.isActive === false
                          ? 'text-gray-500'
                          : 'text-emerald-700'
                      }`}
                    >
                      {item.currentStock}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold mr-1">
                      {item.unit}
                    </span>
                  </div>
                </div>

                {/* Min stock threshold info */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 bg-white/70 px-3 py-1.5 rounded-xl border border-gray-100">
                  <span>کەمترین ئاستی ئاگاداری:</span>
                  <span className="font-mono font-bold text-gray-700">
                    {item.minimumStock} {item.unit}
                  </span>
                </div>

                {/* Operational Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStockInIngredient(item)}
                    className="flex items-center justify-center gap-1 py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black transition-colors"
                    title="زیادکردنی کۆگا"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>+ کۆگا</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustIngredient(item)}
                    className="flex items-center justify-center gap-1 py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-black transition-colors"
                    title="ڕێکخستنی بڕی کۆگا"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>ڕێکخستن</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistoryIngredient(item)}
                    className="flex items-center justify-center gap-1 py-2 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                    title="مێژووی جووڵەکان"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>مێژوو</span>
                  </button>
                </div>

                {/* Secondary Edit Action */}
                {isAdminOrManager && (
                  <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                    <button
                      type="button"
                      onClick={() => setEditingIngredient(item)}
                      className="hover:text-orange-600 font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>دەستکاریکردنی زانیارییەکان</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(item.id, item.isActive !== false)}
                      className="hover:text-gray-700 font-medium"
                    >
                      {item.isActive !== false ? 'ناچالاککردن' : 'چالاککردنەوە'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <IngredientAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <IngredientEditModal
        isOpen={!!editingIngredient}
        onClose={() => setEditingIngredient(null)}
        ingredient={editingIngredient}
      />

      <StockInModal
        isOpen={!!stockInIngredient}
        onClose={() => setStockInIngredient(null)}
        ingredient={stockInIngredient}
      />

      <StockAdjustmentModal
        isOpen={!!adjustIngredient}
        onClose={() => setAdjustIngredient(null)}
        ingredient={adjustIngredient}
      />

      <StockMovementHistoryModal
        isOpen={historyIngredient !== undefined && historyIngredient !== null}
        onClose={() => setHistoryIngredient(undefined as any)}
        ingredient={historyIngredient}
      />
    </div>
  );
};
