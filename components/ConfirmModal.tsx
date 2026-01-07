
import React from 'react';
import { AlertIcon } from './icons/AlertIcon';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  isDangerous = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[70] flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4 text-slate-100">
          <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-900/30 text-red-500' : 'bg-blue-900/30 text-blue-500'}`}>
            <AlertIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
                onConfirm();
                onClose();
            }}
            className={`px-4 py-2 text-white rounded-lg font-bold transition-colors text-sm shadow-md ${
                isDangerous 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-brand-blue hover:bg-brand-blue-light'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
