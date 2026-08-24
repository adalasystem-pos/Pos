import React from 'react';
import { ProductSalesSummary } from '../../types/analytics';
import { formatIQD } from '../../utils/currency';
import { Card } from '../ui/Card';
import { Award, Flame, ShoppingBag, TrendingUp } from 'lucide-react';

interface TopSellingProductsCardProps {
  products: ProductSalesSummary[];
  loading?: boolean;
}

export const TopSellingProductsCard: React.FC<TopSellingProductsCardProps> = ({
  products,
  loading,
}) => {
  const topList = products.slice(0, 8); // Top 8 items for a compact, clean overview
  const maxQty = topList.length > 0 ? topList[0].totalQuantity : 1;

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
            ١
          </span>
        );
      case 1:
        return (
          <span className="w-6 h-6 rounded-full bg-slate-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
            ٢
          </span>
        );
      case 2:
        return (
          <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
            ٣
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-950 font-black text-xs flex items-center justify-center font-mono">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <Card
      id="top-selling-products-card"
      className="p-5 bg-white border border-orange-100 shadow-sm rounded-3xl space-y-4 text-right"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-50 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">بەرهەمە پڕفرۆشەکان (Best Sellers)</h3>
            <p className="text-[11px] text-gray-500 font-medium">
              ڕیزبەندی ئایتمەکان بەپێی زۆرترین ژمارەی فرۆشراو
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-orange-50 text-orange-700 px-2.5 py-1 rounded-xl border border-orange-200">
          {products.length} بەرهەم
        </span>
      </div>

      {/* Content */}
      {topList.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500">هیچ فرۆشێک لەم ماوەیەدا تۆمار نەکراوە</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {topList.map((item, index) => {
            const percentage = Math.max(8, Math.round((item.totalQuantity / maxQty) * 100));

            return (
              <div
                key={item.productId || index}
                className="p-2.5 rounded-2xl bg-orange-50/40 hover:bg-orange-50 border border-orange-100/60 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getRankBadge(index)}
                    <span className="text-xs font-black text-gray-900 truncate">
                      {item.productName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="font-black text-orange-600 bg-white px-2 py-0.5 rounded-lg border border-orange-200 shadow-2xs">
                      {item.totalQuantity} دانە
                    </span>
                    <span className="font-bold text-gray-700 font-mono" dir="ltr">
                      {formatIQD(item.totalRevenue)}
                    </span>
                  </div>
                </div>

                {/* Relative progress bar */}
                <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-orange-100">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
