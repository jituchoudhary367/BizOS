import { supabase } from './supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getToken() {
    // Always use the live Supabase session token
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get(endpoint, params = {}) {
    const search = new URLSearchParams(params).toString();
    const url = search ? `${endpoint}?${search}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // SSE stream for AI responses
  async *stream(endpoint, data) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Stream error: ${response.status}`);

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
          const chunk = line.slice(6);
          if (chunk === '[DONE]') return;
          try {
            yield JSON.parse(chunk);
          } catch {
            yield { text: chunk };
          }
        }
      }
    }
  }
}

export const apiClient = new ApiClient(API_BASE);
