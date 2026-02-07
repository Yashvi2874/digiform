import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDesignStore = create(
  persist(
    (set, get) => ({
      designs: [],
      currentDesign: null,
      userId: null,
      
      // Phase 4: Simulation Control State - now per design
      selectedMaterial: 'Structural Steel',
      densityOverride: null,
      currentSimulationLoading: false,
      currentSimulationType: null,
      
      // Stress Visualization State
      stressResults: null,
      showStressVisualization: false,

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

      addDesign: (design) => set((state) => {
        const newDesign = { 
          ...design, 
          id: Date.now(), 
          timestamp: new Date(),
          // Preserve existing simulationData if it exists, otherwise initialize
          simulationData: design.simulationData || {
            massProperties: null,
            massPropertiesComputed: false,
            massPropertiesError: null,
            simulationHistory: []
          }
        };
        return {
          designs: [...state.designs, newDesign],
          currentDesign: newDesign
        };
      }),

      setCurrentDesign: (id) => set((state) => ({
        currentDesign: state.designs.find(d => d.id === id),
        // Reset loading states when switching designs
        currentSimulationLoading: false,
        currentSimulationType: null
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

      // Phase 4: Simulation Control Actions - now update current design's simulation data
      setMassProperties: (massProperties) => set((state) => {
        if (!state.currentDesign) return state;
        
        const updatedDesign = {
          ...state.currentDesign,
          simulationData: {
            ...state.currentDesign.simulationData,
            massProperties,
            massPropertiesComputed: true,
            massPropertiesError: null
          }
        };
        
        return {
          designs: state.designs.map(d => d.id === updatedDesign.id ? updatedDesign : d),
          currentDesign: updatedDesign
        };
      }),

      setMassPropertiesLoading: (loading) => set({
        currentSimulationLoading: loading,
        currentSimulationType: loading ? 'mass_properties' : null
      }),

      setMassPropertiesError: (error) => set((state) => {
        if (!state.currentDesign) return { 
          currentSimulationLoading: false,
          currentSimulationType: null
        };
        
        const updatedDesign = {
          ...state.currentDesign,
          simulationData: {
            ...state.currentDesign.simulationData,
            massPropertiesError: error
          }
        };
        
        return {
          designs: state.designs.map(d => d.id === updatedDesign.id ? updatedDesign : d),
          currentDesign: updatedDesign,
          currentSimulationLoading: false,
          currentSimulationType: null
        };
      }),

      setSelectedMaterial: (material) => set((state) => {
        // Clear mass properties if material changes and they were already computed
        if (state.currentDesign?.simulationData?.massPropertiesComputed) {
          const updatedDesign = {
            ...state.currentDesign,
            simulationData: {
              ...state.currentDesign.simulationData,
              massPropertiesComputed: false,
              massPropertiesError: 'Material changed. Please recompute STEP 1.'
            }
          };
          
          return {
            selectedMaterial: material,
            designs: state.designs.map(d => d.id === updatedDesign.id ? updatedDesign : d),
            currentDesign: updatedDesign
          };
        }
        
        return { selectedMaterial: material };
      }),

      setDensityOverride: (density) => set((state) => {
        // Clear mass properties if density changes and they were already computed
        if (state.currentDesign?.simulationData?.massPropertiesComputed) {
          const updatedDesign = {
            ...state.currentDesign,
            simulationData: {
              ...state.currentDesign.simulationData,
              massPropertiesComputed: false,
              massPropertiesError: 'Density changed. Please recompute STEP 1.'
            }
          };
          
          return {
            densityOverride: density,
            designs: state.designs.map(d => d.id === updatedDesign.id ? updatedDesign : d),
            currentDesign: updatedDesign
          };
        }
        
        return { densityOverride: density };
      }),

      setSimulationLoading: (loading, type) => set({
        currentSimulationLoading: loading,
        currentSimulationType: type
      }),

      addSimulationToHistory: (simulation) => set((state) => {
        if (!state.currentDesign) return state;
        
        const newSimulation = {
          ...simulation,
          timestamp: new Date(),
          id: `${Date.now()}_${Math.random()}`
        };
        
        const updatedDesign = {
          ...state.currentDesign,
          simulationData: {
            ...state.currentDesign.simulationData,
            simulationHistory: [
              ...(state.currentDesign.simulationData?.simulationHistory || []),
              newSimulation
            ]
          }
        };
        
        return {
          designs: state.designs.map(d => d.id === updatedDesign.id ? updatedDesign : d),
          currentDesign: updatedDesign
        };
      }),

      clearMassProperties: () => set((state) => {
        if (!state.currentDesign) return state;
        
        const updatedDesign = {
          ...state.currentDesign,
          simulationData: {
            ...state.currentDesign.simulationData,
            massProperties: null,
            massPropertiesComputed: false,
            massPropertiesError: null
          }
        };
        
        return {
          designs: state.designs.map(d => d.id === updatedDesign.id ? updatedDesign : d),
          currentDesign: updatedDesign
        };
      }),

      // Stress Visualization Actions
      setStressResults: (results) => set({
        stressResults: results,
        showStressVisualization: true
      }),

      clearStressVisualization: () => set({
        stressResults: null,
        showStressVisualization: false
      }),

      // Helper functions to get simulation data from current design
      getMassProperties: () => {
        const state = get();
        return state.currentDesign?.simulationData?.massProperties || null;
      },
      
      getMassPropertiesComputed: () => {
        const state = get();
        return state.currentDesign?.simulationData?.massPropertiesComputed || false;
      },
      
      getMassPropertiesError: () => {
        const state = get();
        return state.currentDesign?.simulationData?.massPropertiesError || null;
      },
      
      getSimulationHistory: () => {
        const state = get();
        return state.currentDesign?.simulationData?.simulationHistory || [];
      }
    }),
    {
      name: 'digiform-designs',
      version: 3,
      // Partition storage by user ID and include all design data with simulations
      partialize: (state) => ({
        designs: state.designs,
        currentDesign: state.currentDesign,
        userId: state.userId,
        selectedMaterial: state.selectedMaterial,
        densityOverride: state.densityOverride
      }),
      // Migrate old designs to new structure
      migrate: (persistedState, version) => {
        if (version < 3) {
          // Add simulationData to all existing designs
          if (persistedState.designs) {
            persistedState.designs = persistedState.designs.map(design => ({
              ...design,
              simulationData: design.simulationData || {
                massProperties: null,
                massPropertiesComputed: false,
                massPropertiesError: null,
                simulationHistory: []
              }
            }));
          }
          if (persistedState.currentDesign && !persistedState.currentDesign.simulationData) {
            persistedState.currentDesign.simulationData = {
              massProperties: null,
              massPropertiesComputed: false,
              massPropertiesError: null,
              simulationHistory: []
            };
          }
        }
        return persistedState;
      }
    }
  )
);
