import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  id?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'پەسەندکردن',
  cancelText = 'پاشگەزبوونەوە',
  variant = 'primary',
  isLoading = false,
  id,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      id={id || 'confirm-dialog'}
      maxWidth="sm"
      footer={
        <>
          <Button
            id="confirm-dialog-cancel"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            size="md"
          >
            {cancelText}
          </Button>
          <Button
            id="confirm-dialog-confirm"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            size="md"
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`shrink-0 p-2.5 rounded-full ${
            variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-neutral-800">{title}</p>
          <p className="text-sm text-neutral-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};
