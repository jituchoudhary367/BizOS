import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';

export default function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="min-h-screen flex flex-col"
      >
        {/* Top bar */}
        <TopBar
          onOpenCommandPalette={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
          }}
        />

        {/* Page content */}
        <main className="flex-1 p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>

      {/* Command Palette (global) */}
      <CommandPalette />
    </div>
  );
}
