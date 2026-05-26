import { Bell, Search, Command, Volume, VolumeX } from 'lucide-react';
import { useAuthStore, useNotificationStore } from '../../store';
import { getInitials } from '../../lib/formatters';

export default function TopBar({ onOpenCommandPalette }) {
  const { profile, business } = useAuthStore();
  const { unreadCount, togglePanel, soundEnabled, toggleSound } = useNotificationStore();

  return (
    <header className="h-16 bg-surface-raised border-b border-surface-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left — Page context */}
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-text-secondary">
          {business?.name || 'BizOS'}
        </h2>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Search / Command Palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-surface-border rounded-lg
                     text-text-tertiary hover:text-text-secondary hover:border-surface-hover
                     transition-all duration-200 text-sm"
        >
          <Search size={14} />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-raised border border-surface-border rounded text-[10px] text-text-disabled">
            <Command size={10} />K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={togglePanel}
          className="relative p-2 rounded-lg text-text-tertiary hover:text-text-primary
                     hover:bg-surface transition-colors duration-200"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
          className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors duration-200"
        >
          {soundEnabled ? <Volume size={18} /> : <VolumeX size={18} />}
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-surface-border">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-medium">
            {getInitials(profile?.full_name)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-text-primary leading-tight">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[11px] text-text-tertiary leading-tight capitalize">
              {profile?.role || 'owner'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
