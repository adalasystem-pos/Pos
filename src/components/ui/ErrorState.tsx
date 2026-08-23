import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-red-200 bg-red-50/40 text-red-900 ${className}`}
    >
      <div className="p-3 bg-red-100 rounded-full text-red-600 mb-2.5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-red-800">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>دووبارە هەوڵدانەوە</span>
          </Button>
        </div>
      )}
    </div>
  );
};
