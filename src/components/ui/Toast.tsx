import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200 text-right ${
              isSuccess
                ? 'bg-emerald-950 text-white border-emerald-800'
                : isError
                ? 'bg-red-950 text-white border-red-800'
                : isWarning
                ? 'bg-amber-950 text-white border-amber-800'
                : 'bg-neutral-900 text-white border-neutral-800'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-sm font-bold">{toast.title}</p>}
              <p className="text-xs sm:text-sm text-neutral-200 leading-snug">{toast.message}</p>
            </div>

            {toast.action && (
              <button
                id={toast.action.id || `toast-action-${toast.id}`}
                type="button"
                onClick={() => {
                  if (toast.action?.onClick) {
                    toast.action.onClick();
                  }
                  removeToast(toast.id);
                }}
                className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black rounded-lg shadow-sm transition-all cursor-pointer border border-orange-400 self-center"
              >
                {toast.action.label}
              </button>
            )}

            <button
              id={`toast-close-${toast.id}`}
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
