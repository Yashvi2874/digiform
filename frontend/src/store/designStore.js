import { create } from 'zustand';

export const useDesignStore = create((set) => ({
  designs: [],
  currentDesign: null,

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
}));
