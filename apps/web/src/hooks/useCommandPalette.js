import { useState, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';

/**
 * Command palette hook with Cmd+K / Ctrl+K shortcut and fuzzy search
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Default commands / quick actions
  const commands = [
    { id: 'create-order', label: 'Create order', category: 'Actions', path: '/app/orders', icon: 'Plus' },
    { id: 'add-product', label: 'Add product', category: 'Actions', path: '/app/inventory', icon: 'Plus' },
    { id: 'generate-invoice', label: 'Generate invoice', category: 'Actions', path: '/app/finance/invoices', icon: 'FileText' },
    { id: 'check-outstanding', label: 'Check outstanding', category: 'Actions', path: '/app/finance/collections', icon: 'AlertCircle' },
    { id: 'nav-dashboard', label: 'Dashboard', category: 'Navigation', path: '/app/dashboard', icon: 'LayoutDashboard' },
    { id: 'nav-brain', label: 'AI Brain', category: 'Navigation', path: '/app/brain', icon: 'Sparkles' },
    { id: 'nav-orders', label: 'Orders', category: 'Navigation', path: '/app/orders', icon: 'ShoppingCart' },
    { id: 'nav-inventory', label: 'Inventory', category: 'Navigation', path: '/app/inventory', icon: 'Package' },
    { id: 'nav-finance', label: 'Finance', category: 'Navigation', path: '/app/finance', icon: 'IndianRupee' },
    { id: 'nav-customers', label: 'Customers', category: 'Navigation', path: '/app/customers', icon: 'Users' },
    { id: 'nav-staff', label: 'Staff', category: 'Navigation', path: '/app/staff', icon: 'IdCard' },
    { id: 'nav-analytics', label: 'Analytics', category: 'Navigation', path: '/app/analytics', icon: 'BarChart3' },
    { id: 'nav-agents', label: 'Agent control', category: 'Navigation', path: '/app/agents', icon: 'Bot' },
    { id: 'nav-settings', label: 'Settings', category: 'Navigation', path: '/app/settings', icon: 'Settings' },
  ];

  const fuse = new Fuse(commands, {
    keys: ['label', 'category'],
    threshold: 0.3,
  });

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search
  useEffect(() => {
    if (query) {
      const searchResults = fuse.search(query).map(r => r.item);
      setResults(searchResults);
    } else {
      setResults(commands);
    }
  }, [query]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  return { isOpen, open, close, query, setQuery, results };
}
