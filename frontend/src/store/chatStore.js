import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useChatStore = create(
  persist(
    (set, get) => ({
      sessionId: null,
      messages: [],
      currentDesignId: null,
      userId: null,
      sessions: [], // Store list of sessions

      initSession: (sessionId, userId) => set({ 
        sessionId, 
        messages: [], 
        userId 
      }),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, { ...message, timestamp: new Date() }]
      })),

      setMessages: (messages) => set({ messages }),

      setCurrentDesign: (designId) => set({ currentDesignId: designId }),

      clearChat: () => set({ 
        messages: [], 
        currentDesignId: null, 
        sessionId: null 
      }),

      clearAll: () => set({ 
        sessionId: null, 
        messages: [], 
        currentDesignId: null, 
        userId: null,
        sessions: []
      }),

      addSession: (session) => set((state) => ({
        sessions: [session, ...state.sessions]
      })),

      setSessions: (sessions) => set({ sessions }),

      switchSession: (sessionId) => set({ 
        sessionId, 
        messages: [] 
      })
    }),
    {
      name: 'digiform-chat',
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          return {
            sessionId: null,
            messages: [],
            currentDesignId: null,
            userId: null,
            sessions: []
          };
        }
        return persistedState;
      }
    }
  )
);
