import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Sparkles, ShoppingCart, Package, IndianRupee,
  Users, Contact, BarChart3, Bot, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { NAV_ITEMS } from '../../lib/constants';

const iconMap = {
  LayoutDashboard, Sparkles, ShoppingCart, Package, IndianRupee,
  Users, Contact, BarChart3, Bot, Settings,
  IdCard: Contact, // alias for backwards compat with constants.js
};

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Demo badge counts
  const badges = {
    orders: 4,
    inventory: 3,
    finance: 5,
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-screen bg-surface-raised border-r border-surface-border z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-surface-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-text-primary whitespace-nowrap"
              >
                BizOS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-hidden">
        {NAV_ITEMS.map((item, index) => {
          if (item.divider) {
            return (
              <div key={`divider-${index}`} className="my-3 border-t border-surface-border" />
            );
          }

          const Icon = iconMap[item.icon];
          const isActive = location.pathname.startsWith(item.path);
          const badge = badges[item.badge];

          return (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <NavLink
                to={item.path}
                className={cn(
                  'sidebar-item',
                  isActive && 'active',
                  item.glow && 'relative',
                )}
              >
                <div className="relative flex-shrink-0">
                  {Icon && <Icon size={20} />}
                  {item.glow && !collapsed && (
                    <div className="absolute -inset-1 bg-brand-500/20 rounded-full blur-sm animate-pulse-slow" />
                  )}
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Badge */}
                {badge && !collapsed && (
                  <span className="ml-auto bg-brand-500/20 text-brand-400 text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
                {badge && collapsed && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </NavLink>

              {/* Tooltip on collapsed state */}
              {collapsed && hoveredItem === item.label && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50">
                  <div className="bg-surface-overlay text-text-primary text-xs px-2.5 py-1.5 rounded-lg border border-surface-border whitespace-nowrap shadow-lg">
                    {item.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="h-12 flex items-center justify-center border-t border-surface-border
                   text-text-tertiary hover:text-text-primary transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}
