import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useCommandPalette } from '../../hooks/useCommandPalette';

export default function CommandPalette() {
  const navigate = useNavigate();
  const { isOpen, close, query, setQuery, results } = useCommandPalette();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (item) => {
    if (item.path) {
      navigate(item.path);
    }
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={close}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-surface-overlay border border-surface-border rounded-xl overflow-hidden shadow-2xl">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-surface-border">
                <Icons.Search size={18} className="text-text-tertiary flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, pages, customers..."
                  className="w-full py-3.5 bg-transparent text-text-primary placeholder:text-text-disabled
                             focus:outline-none text-sm"
                />
                <kbd className="flex-shrink-0 px-1.5 py-0.5 bg-surface-raised border border-surface-border rounded text-[10px] text-text-disabled">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {results.length === 0 && query && (
                  <p className="px-4 py-8 text-center text-text-tertiary text-sm">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                )}

                {/* Group by category */}
                {['Actions', 'Navigation'].map((category) => {
                  const items = results.filter(r => r.category === category);
                  if (items.length === 0) return null;

                  return (
                    <div key={category}>
                      <p className="px-4 pt-2 pb-1 text-[11px] font-medium text-text-disabled uppercase tracking-wider">
                        {category}
                      </p>
                      {items.map((item) => {
                        const Icon = Icons[item.icon] || Icons.Circle;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                                       text-text-secondary hover:text-text-primary hover:bg-surface-raised
                                       transition-colors duration-100"
                          >
                            <Icon size={16} className="flex-shrink-0 text-text-tertiary" />
                            <span className="text-sm">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
