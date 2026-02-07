import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useChatStore = create(
  persist(
    (set, get) => ({
      sessionId: null,
      messages: [],
      currentDesignId: null,

      initSession: (sessionId) => set({ sessionId, messages: [] }),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, { ...message, timestamp: new Date() }]
      })),

      setMessages: (messages) => set({ messages }),

      setCurrentDesign: (designId) => set({ currentDesignId: designId }),

      clearChat: () => set({ messages: [], currentDesignId: null })
    }),
    {
      name: 'digiform-chat',
      partialPersist: true
    }
  )
);
