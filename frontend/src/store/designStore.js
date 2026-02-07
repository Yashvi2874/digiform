import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDesignStore = create(
  persist(
    (set, get) => ({
      designs: [],
      currentDesign: null,
      userId: null,
      
      // Phase 4: Simulation Control State
      massProperties: null,
      massPropertiesComputed: false,
      massPropertiesLoading: false,
      massPropertiesError: null,
      selectedMaterial: 'Structural Steel',
      densityOverride: null,
      simulationHistory: [],
      currentSimulationLoading: false,
      currentSimulationType: null,

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
      }),

      // Phase 4: Simulation Control Actions
      setMassProperties: (massProperties) => set({
        massProperties,
        massPropertiesComputed: true,
        massPropertiesError: null
      }),

      setMassPropertiesLoading: (loading) => set({
        massPropertiesLoading: loading,
        currentSimulationLoading: loading,
        currentSimulationType: loading ? 'mass_properties' : null
      }),

      setMassPropertiesError: (error) => set({
        massPropertiesError: error,
        massPropertiesLoading: false,
        currentSimulationLoading: false
      }),

      setSelectedMaterial: (material) => set({
        selectedMaterial: material,
        massPropertiesComputed: false,
        massPropertiesError: null
      }),

      setDensityOverride: (density) => set({
        densityOverride: density,
        massPropertiesComputed: false,
        massPropertiesError: null
      }),

      setSimulationLoading: (loading, type) => set({
        currentSimulationLoading: loading,
        currentSimulationType: type
      }),

      addSimulationToHistory: (simulation) => set((state) => ({
        simulationHistory: [...state.simulationHistory, {
          ...simulation,
          timestamp: new Date(),
          id: `${Date.now()}_${Math.random()}`
        }]
      })),

      clearMassProperties: () => set({
        massProperties: null,
        massPropertiesComputed: false,
        massPropertiesError: null
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
