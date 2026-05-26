import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

/**
 * Subscribe to Supabase Realtime changes on a table.
 * - Invalidates TanStack Query cache on INSERT/UPDATE/DELETE
 * - Tracks live connection status
 * - Applies optimistic cache updates for instant UI feedback
 * - Plays notification sound for high-priority events
 */
export function useRealtimeTable(
  table,
  {
    filter,
    queryKey,
    onInsert,
    onUpdate,
    onDelete,
    sound = false,
  } = {}
) {
  const queryClient = useQueryClient();
  const channelRef = useRef(null);
  const [isLive, setIsLive] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [flashes, setFlashes] = useState({}); // { id: timestamp }

  const playSound = useCallback(() => {
    if (!sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext not available
    }
  }, [sound]);

  useEffect(() => {
    const channelName = `realtime:${table}:${filter || 'all'}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          setLastEvent({ type: payload.eventType, row: payload.new || payload.old, ts: Date.now() });

          // Mark flash for UI animation (store by id for 3s)
          try {
            const id = (payload.new || payload.old)?.id;
            if (id) {
              setFlashes((prev) => ({ ...prev, [id]: Date.now() }));
              setTimeout(() => setFlashes((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
              }), 3000);
            }
          } catch (e) {
            // ignore flash errors
          }

          // Invalidate TanStack Query cache
          if (queryKey) {
            queryClient.invalidateQueries({
              queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
            });
          }

          // Optimistic cache update
          if (queryKey) {
            const key = Array.isArray(queryKey) ? queryKey : [queryKey];
            queryClient.setQueriesData({ queryKey: key }, (old) => {
              if (!old) return old;

              if (payload.eventType === 'INSERT' && old.data) {
                return { ...old, data: [payload.new, ...old.data] };
              }
              if (payload.eventType === 'UPDATE' && old.data) {
                return {
                  ...old,
                  data: old.data.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r)),
                };
              }
              if (payload.eventType === 'DELETE' && old.data) {
                return { ...old, data: old.data.filter((r) => r.id !== payload.old?.id) };
              }
              return old;
            });
          }

          // Event-specific callbacks
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new);
              // Play sound for important tables by default
              const shouldSound = sound || ['orders', 'whatsapp_messages'].includes(table);
              if (shouldSound) playSound();
              break;
            case 'UPDATE':
              onUpdate?.(payload.new, payload.old);
              break;
            case 'DELETE':
              onDelete?.(payload.old);
              break;
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      setIsLive(false);
    };
  }, [table, filter, queryKey, playSound]);

  const isFlashing = (id) => !!flashes[id];

  return { isLive, lastEvent, isFlashing, channelRef };
}
