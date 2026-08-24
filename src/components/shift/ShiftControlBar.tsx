import React, { useState } from 'react';
import { useShift } from '../../hooks/useShift';
import { useAuth } from '../../hooks/useAuth';
import { Shift, CashMovementType } from '../../types/shift';
import { formatIQD } from '../../utils/currency';
import { formatBaghdadTime } from '../../utils/dates';
import { OpenShiftModal } from './OpenShiftModal';
import { CashMovementModal } from './CashMovementModal';
import { CloseShiftModal } from './CloseShiftModal';
import { ShiftSummaryReceiptModal } from './ShiftSummaryReceiptModal';
import { Button } from '../ui/Button';
import {
  LockOpen,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ShiftControlBar: React.FC = () => {
  const { activeShift, isShiftOpen, loading } = useShift();
  const { role } = useAuth();

  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState<boolean>(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState<boolean>(false);
  const [cashMovementType, setCashMovementType] = useState<CashMovementType>('cash_in');
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState<boolean>(false);
  const [closedShiftReceipt, setClosedShiftReceipt] = useState<Shift | null>(null);

  // Captains do not operate shifts or cash controls
  if (role === 'captain') {
    return null;
  }

  if (loading) {
    return null;
  }

  const handleOpenCashIn = () => {
    setCashMovementType('cash_in');
    setIsCashMovementModalOpen(true);
  };

  const handleOpenCashOut = () => {
    setCashMovementType('cash_out');
    setIsCashMovementModalOpen(true);
  };

  return (
    <>
      <div id="shift-control-bar" className="w-full">
        {!isShiftOpen ? (
          /* NO ACTIVE SHIFT: Warm callout bar */
          <div className="bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-3.5 sm:p-4 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-right">
              <div className="p-2.5 bg-white/20 backdrop-blur-xs rounded-xl shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-wide">سندوق لە ئێستادا داخراوە</h4>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  بۆ دەستپێکردنی فرۆشتن و بەڕێوەبردنی کاش، تکایە شێفت بکەرەوە و پارەی سەرەتایی تۆمار بکە.
                </p>
              </div>
            </div>

            <Button
              id="btn-open-shift"
              onClick={() => setIsOpenShiftModalOpen(true)}
              style={{ backgroundColor: '#ffffff' }}
              className="w-full sm:w-auto bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 font-black rounded-xl px-5 py-2.5 shadow-sm text-xs flex items-center justify-center gap-2 shrink-0 transition-all active:scale-95"
            >
              <LockOpen className="w-4 h-4 text-orange-600" />
              <span
                style={{
                  backgroundColor: '#cb1212',
                  marginRight: '6px',
                  paddingRight: '7px',
                  paddingLeft: '8px',
                  marginLeft: '2px',
                  marginTop: '2px',
                  marginBottom: '0px',
                  fontSize: '14px',
                  borderColor: '#ea2323',
                }}
              >
                کردنەوەی شێفت
              </span>
            </Button>
          </div>
        ) : (
          /* ACTIVE OPEN SHIFT: Compact modern status bar */
          <div className="bg-white border-2 border-orange-200/90 rounded-2xl p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Shift metadata & badge */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black text-emerald-800">شێفت کراوەیە</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>دەستپێکردن:</span>
                <span className="font-bold text-gray-900" dir="ltr">
                  {activeShift?.openedAt ? formatBaghdadTime(activeShift.openedAt) : '--:--'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Coins className="w-3.5 h-3.5 text-orange-500" />
                <span>پارەی سەرەتایی:</span>
                <span className="font-bold text-gray-900" dir="ltr">
                  {formatIQD(activeShift?.openingCash || 0)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                id="btn-shift-cash-in"
                type="button"
                onClick={handleOpenCashIn}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              >
                <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>داخڵ (Cash In)</span>
              </button>

              <button
                id="btn-shift-cash-out"
                type="button"
                onClick={handleOpenCashOut}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              >
                <ArrowUpCircle className="w-3.5 h-3.5 text-red-600" />
                <span>دەرچوو (Cash Out)</span>
              </button>

              <button
                id="btn-shift-close"
                type="button"
                onClick={() => setIsCloseShiftModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>داخستنی شێفت</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Open Shift Modal */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
      />

      {/* Cash Movement Modal */}
      <CashMovementModal
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
        defaultType={cashMovementType}
      />

      {/* Close Shift Modal */}
      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        onShiftClosed={(closed) => {
          setClosedShiftReceipt(closed);
        }}
      />

      {/* Summary Receipt Modal after Shift Closed */}
      <ShiftSummaryReceiptModal
        isOpen={!!closedShiftReceipt}
        onClose={() => setClosedShiftReceipt(null)}
        shift={closedShiftReceipt}
      />
    </>
  );
};
