import React, { useState } from 'react';
import { Activity, Loader2, AlertCircle } from 'lucide-react';
import { useDesignStore } from '../store/designStore';
import {
  runMassPropertiesSimulation,
  runStructuralSimulation,
  runDeflectionSimulation,
  runStressSimulation
} from '../services/api';
import ExportPanel from './ExportPanel';
import MassPropertiesDisplay from './MassPropertiesDisplay';
import SimulationControls from './SimulationControls';
import MaterialInfo from './MaterialInfo';

export default function AnalysisPanel() {
  const {
    currentDesign,
    massProperties,
    massPropertiesComputed,
    massPropertiesLoading,
    massPropertiesError,
    selectedMaterial,
    setSelectedMaterial,
    setMassProperties,
    setMassPropertiesLoading,
    setMassPropertiesError,
    addSimulationToHistory,
    setSimulationLoading,
    currentSimulationLoading,
    currentSimulationType
  } = useDesignStore();

  const handleRunMassProperties = async () => {
    if (!currentDesign) {
      setMassPropertiesError('No design available');
      return;
    }

    setMassPropertiesLoading(true);
    try {
      const result = await runMassPropertiesSimulation(
        currentDesign,
        selectedMaterial
      );

      if (result.success) {
        setMassProperties(result.mass_properties);
        addSimulationToHistory({
          type: 'mass_properties',
          material: selectedMaterial,
          results: result.mass_properties
        });
      } else {
        setMassPropertiesError(result.error || 'Failed to compute mass properties');
      }
    } catch (error) {
      setMassPropertiesError(error.response?.data?.error || error.message);
      console.error('Mass properties error:', error);
    } finally {
      setMassPropertiesLoading(false);
    }
  };

  const handleRunStructural = async () => {
    if (!massPropertiesComputed) {
      setMassPropertiesError('STEP 1 (mass properties) required first');
      return;
    }

    if (!currentDesign) {
      setMassPropertiesError('No design available');
      return;
    }

    setSimulationLoading(true, 'structural');
    try {
      const result = await runStructuralSimulation(currentDesign);
      if (result.success) {
        addSimulationToHistory({
          type: 'structural',
          results: result.results
        });
      }
    } catch (error) {
      console.error('Structural simulation error:', error);
    } finally {
      setSimulationLoading(false, null);
    }
  };

  const handleRunDeflection = async () => {
    if (!massPropertiesComputed) {
      setMassPropertiesError('STEP 1 (mass properties) required first');
      return;
    }

    if (!currentDesign) {
      setMassPropertiesError('No design available');
      return;
    }

    setSimulationLoading(true, 'deflection');
    try {
      const result = await runDeflectionSimulation(currentDesign);
      if (result.success) {
        addSimulationToHistory({
          type: 'deflection',
          results: result.results
        });
      }
    } catch (error) {
      console.error('Deflection simulation error:', error);
    } finally {
      setSimulationLoading(false, null);
    }
  };

  const handleRunStress = async () => {
    if (!massPropertiesComputed) {
      setMassPropertiesError('STEP 1 (mass properties) required first');
      return;
    }

    if (!currentDesign) {
      setMassPropertiesError('No design available');
      return;
    }

    setSimulationLoading(true, 'stress');
    try {
      const result = await runStressSimulation(currentDesign);
      if (result.success) {
        addSimulationToHistory({
          type: 'stress',
          results: result.results
        });
      }
    } catch (error) {
      console.error('Stress simulation error:', error);
    } finally {
      setSimulationLoading(false, null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-primary/20 rounded-full blur-3xl"></div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-3 relative">
          <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Simulation Control
          </span>
        </h2>
      </div>

      {/* Export Panel */}
      <ExportPanel design={currentDesign} />

      {currentDesign ? (
        <div className="space-y-6">
          {/* Material Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-200">📦 Material Selection</h3>
            <MaterialInfo
              material={selectedMaterial}
              density={7850} // TODO: Get from store
              onMaterialChange={setSelectedMaterial}
            />
          </div>

          {/* STEP 1: Mass Properties */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">
                STEP 1: Mass Properties
                {massPropertiesComputed && ' ✓'}
              </h3>
              <button
                onClick={handleRunMassProperties}
                disabled={massPropertiesLoading}
                className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  massPropertiesLoading
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {massPropertiesLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Computing...
                  </>
                ) : massPropertiesComputed ? (
                  '✓ Completed'
                ) : (
                  'Run STEP 1'
                )}
              </button>
            </div>

            {/* Error Display */}
            {massPropertiesError && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300">Error</p>
                  <p className="text-sm text-red-200">{massPropertiesError}</p>
                </div>
              </div>
            )}

            {/* Mass Properties Display */}
            {massProperties && !massPropertiesError && (
              <MassPropertiesDisplay
                massProperties={massProperties}
                status={massPropertiesComputed ? 'COMPLETE' : 'PENDING'}
              />
            )}

            {!massProperties && !massPropertiesError && (
              <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl text-center">
                <p className="text-gray-400">
                  Click "Run STEP 1" to compute mass properties from CAD geometry
                </p>
              </div>
            )}
          </div>

          {/* STEP 2: Advanced Simulations */}
          <div className="border-t border-gray-700 pt-6">
            <SimulationControls
              step1Complete={massPropertiesComputed}
              onRunStructural={handleRunStructural}
              onRunDeflection={handleRunDeflection}
              onRunStress={handleRunStress}
              loading={currentSimulationLoading}
              loadingType={currentSimulationType}
              error={massPropertiesComputed ? null : 'Complete STEP 1 first'}
            />
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl text-center">
          <p className="text-gray-400">Create a CAD design to begin simulations</p>
        </div>
      )}
    </div>
  );
}
