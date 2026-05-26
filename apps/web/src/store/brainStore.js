import { create } from 'zustand';

export const useBrainStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  isRecording: false,
  suggestedPrompts: true,

  setActiveConversation: (id) => {
    set({ activeConversationId: id, suggestedPrompts: false });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...message,
      }],
      suggestedPrompts: false,
    }));
  },

  updateLastMessage: (content) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        const last = messages[messages.length - 1];
        messages[messages.length - 1] = { ...last, content: last.content + content };
      }
      return { messages };
    });
  },

  setStreaming: (isStreaming) => set({ isStreaming }),
  setRecording: (isRecording) => set({ isRecording }),

  startNewConversation: () => {
    const id = crypto.randomUUID();
    set((state) => ({
      conversations: [
        { id, title: 'New conversation', created_at: new Date().toISOString() },
        ...state.conversations,
      ],
      activeConversationId: id,
      messages: [],
      suggestedPrompts: true,
    }));
    return id;
  },

  clearMessages: () => set({ messages: [], suggestedPrompts: true }),
}));
