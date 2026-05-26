import { create } from 'zustand';

export const useNotificationStore = create((set, get) => {
  // Initialize persisted preferences when available
  const initialSound = (typeof window !== 'undefined' && window.localStorage.getItem('bizos:soundEnabled'))
    ? window.localStorage.getItem('bizos:soundEnabled') === 'true'
    : true;

  return {
    notifications: [],
    unreadCount: 0,
    isOpen: false,
    soundEnabled: initialSound,

  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.is_read).length,
    });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  closePanel: () => set({ isOpen: false }),
  toggleSound: () => set((state) => {
    const next = !state.soundEnabled;
    try { if (typeof window !== 'undefined') window.localStorage.setItem('bizos:soundEnabled', String(next)); } catch {}
    return { soundEnabled: next };
  }),
  setSoundEnabled: (v) => {
    try { if (typeof window !== 'undefined') window.localStorage.setItem('bizos:soundEnabled', String(v)); } catch {}
    set({ soundEnabled: v });
  },
  };
});
