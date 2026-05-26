import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';

const AI_BASE = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

/**
 * Hook for streaming AI responses via SSE from the AI service.
 * Persists conversations to Supabase ai_conversations table.
 */
export function useAIStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const abortRef = useRef(null);
  const business = useAuthStore((s) => s.business);
  const user = useAuthStore((s) => s.user);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID(), ts: Date.now() }]);
  }, []);

  const updateLastMessage = useCallback((chunk) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last && last.role === 'assistant') {
        copy[copy.length - 1] = { ...last, content: last.content + chunk };
      }
      return copy;
    });
  }, []);

  const sendMessage = useCallback(async (message, context = {}) => {
    if (!business?.id) {
      setError('No business context available');
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    // Add user message to local state
    const userMsg = { role: 'user', content: message, id: crypto.randomUUID(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    // Add empty AI placeholder
    const aiMsg = { role: 'assistant', content: '', id: crypto.randomUUID(), ts: Date.now(), isStreaming: true };
    setMessages((prev) => [...prev, aiMsg]);

    // Get Supabase auth token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${AI_BASE}/api/brain/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message,
          business_id: business.id,
          context: { session_id: sessionId, user_id: user?.id, ...context },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) updateLastMessage(parsed.text);
              if (parsed.action) {
                // Action card — embed in message
                updateLastMessage(`\n[ACTION:${JSON.stringify(parsed.action)}]`);
              }
            } catch {
              // non-JSON chunk
            }
          }
        }
      }

      // Mark streaming done
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { ...last, isStreaming: false };
        }
        return copy;
      });

      // Persist conversation to Supabase
      if (user?.id && business?.id) {
        const finalMessages = await new Promise((res) => {
          setMessages((prev) => { res(prev); return prev; });
        });

        await supabase.from('ai_conversations').upsert({
          session_id: sessionId,
          business_id: business.id,
          profile_id: user.id,
          messages: finalMessages.map((m) => ({ role: m.role, content: m.content })),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'session_id' });
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      updateLastMessage('\n\n*Sorry, I encountered an error. Please try again.*');
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { ...last, isStreaming: false };
        }
        return copy;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [business, user, sessionId, updateLastMessage]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { sendMessage, cancel, clearMessages, messages, isLoading, isStreaming, error, sessionId };
}
