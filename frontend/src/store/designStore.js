import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDesignStore = create(
  persist(
    (set, get) => ({
      designs: [],
      currentDesign: null,
      userId: null,

      // Initialize with user ID to ensure data isolation
      initializeForUser: (userId) => {
        const currentUserId = get().userId;
        if (currentUserId !== userId) {
          // Different user - clear all data
          set({
            designs: [],
            currentDesign: null,
            userId
          });
        }
      },

      addDesign: (design) => set((state) => ({
        designs: [...state.designs, { ...design, id: Date.now(), timestamp: new Date() }],
        currentDesign: { ...design, id: Date.now(), timestamp: new Date() }
      })),

      setCurrentDesign: (id) => set((state) => ({
        currentDesign: state.designs.find(d => d.id === id)
      })),

      updateDesignAnalysis: (id, analysis) => set((state) => ({
        designs: state.designs.map(d => 
          d.id === id ? { ...d, analysis } : d
        ),
        currentDesign: state.currentDesign?.id === id 
          ? { ...state.currentDesign, analysis }
          : state.currentDesign
      })),

      removeDesign: (id) => set((state) => {
        const newDesigns = state.designs.filter(d => d.id !== id);
        const wasCurrentDesign = state.currentDesign?.id === id;
        
        return {
          designs: newDesigns,
          // If we deleted the current design, set the most recent one as current
          currentDesign: wasCurrentDesign 
            ? (newDesigns.length > 0 ? newDesigns[newDesigns.length - 1] : null)
            : state.currentDesign
        };
      }),

      clearDesigns: () => set({
        designs: [],
        currentDesign: null
      })
    }),
    {
      name: 'digiform-designs',
      version: 2,
      // Partition storage by user ID
      partialize: (state) => ({
        designs: state.designs,
        currentDesign: state.currentDesign,
        userId: state.userId
      })
    }
  )
);
