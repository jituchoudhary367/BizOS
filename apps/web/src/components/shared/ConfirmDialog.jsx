import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirm', variant = 'danger' }) {
  const variantStyles = {
    danger: 'btn-danger',
    primary: 'btn-primary',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-surface-overlay border border-surface-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-danger" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{description}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={onClose} className="btn-ghost text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className={`${variantStyles[variant]} text-sm`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
