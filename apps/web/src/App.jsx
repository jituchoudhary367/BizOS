import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useAuthStore } from './store';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

if (typeof window !== 'undefined') {
  window.__QUERY_CLIENT = queryClient;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    // Initialize Supabase auth — no demo fallback
    initialize();
  }, []);

  // Auth state change handling and proactive token refresh
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Redirect to login on sign out
        window.location.href = '/login';
      }
    });

    // Periodic session check/refresh every 10 minutes
    const id = setInterval(async () => {
      try {
        await supabase.auth.getSession();
      } catch (e) {
        // ignore
      }
    }, 10 * 60 * 1000);

    return () => {
      sub?.subscription?.unsubscribe?.();
      clearInterval(id);
    };
  }, []);

  // Offline banner
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark">
        {!online && (
          <div className="bg-yellow-400 text-black text-center py-1">You are offline — some features may be limited.</div>
        )}
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  );
}
