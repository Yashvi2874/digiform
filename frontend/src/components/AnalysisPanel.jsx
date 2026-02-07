import React, { useState, useRef, useEffect } from 'react';
import { Activity, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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
  // Get current design and actions
  const currentDesign = useDesignStore(state => state.currentDesign);
  const selectedMaterial = useDesignStore(state => state.selectedMaterial);
  const currentSimulationLoading = useDesignStore(state => state.currentSimulationLoading);
  const currentSimulationType = useDesignStore(state => state.currentSimulationType);
  
  // Get simulation data from current design
  const massProperties = useDesignStore(state => state.currentDesign?.simulationData?.massProperties || null);
  const massPropertiesComputed = useDesignStore(state => state.currentDesign?.simulationData?.massPropertiesComputed || false);
  const massPropertiesError = useDesignStore(state => state.currentDesign?.simulationData?.massPropertiesError || null);
  const massPropertiesLoading = useDesignStore(state => state.currentSimulationLoading && state.currentSimulationType === 'mass_properties');
  const simulationHistory = useDesignStore(state => state.currentDesign?.simulationData?.simulationHistory || []);
  
  // Get actions
  const setSelectedMaterial = useDesignStore(state => state.setSelectedMaterial);
  const setMassProperties = useDesignStore(state => state.setMassProperties);
  const setMassPropertiesLoading = useDesignStore(state => state.setMassPropertiesLoading);
  const setMassPropertiesError = useDesignStore(state => state.setMassPropertiesError);
  const addSimulationToHistory = useDesignStore(state => state.addSimulationToHistory);
  const setSimulationLoading = useDesignStore(state => state.setSimulationLoading);
  const clearMassProperties = useDesignStore(state => state.clearMassProperties);

  // Ref for auto-scrolling to structural analysis section
  const structuralAnalysisRef = useRef(null);

  // State for inline structural analysis
  const [showStructuralAnalysis, setShowStructuralAnalysis] = useState(false);
  const [structuralLoading, setStructuralLoading] = useState(false);
  const [structuralError, setStructuralError] = useState(null);
  const [structuralResults, setStructuralResults] = useState(null);
  
  // Structural analysis inputs
  const [constraintFace, setConstraintFace] = useState('left');
  const [loadMagnitude, setLoadMagnitude] = useState(1000);
  const [loadDirection, setLoadDirection] = useState('down');
  const [loadFace, setLoadFace] = useState('right');

  const faces = ['left', 'right', 'top', 'bottom', 'front', 'back'];
  const directions = [
    { value: 'down', label: '-Y (Down)', vector: [0, -1, 0] },
    { value: 'up', label: '+Y (Up)', vector: [0, 1, 0] },
    { value: 'left', label: '-X (Left)', vector: [-1, 0, 0] },
    { value: 'right', label: '+X (Right)', vector: [1, 0, 0] },
    { value: 'forward', label: '+Z (Forward)', vector: [0, 0, 1] },
    { value: 'backward', label: '-Z (Backward)', vector: [0, 0, -1] }
  ];

  // Close structural analysis when switching designs or when STEP 1 is not complete
  useEffect(() => {
    if (!massPropertiesComputed) {
      setShowStructuralAnalysis(false);
      setStructuralResults(null);
      setStructuralError(null);
    }
  }, [currentDesign?.id, massPropertiesComputed]);

  // Material densities (kg/m³) - MUST match backend exactly
  const materialDensities = {
    'Structural Steel': 7850,
    'Steel': 7850,
    'Aluminum': 2700,
    'Titanium': 4500,
    'Copper': 8960,
    'Brass': 8470,
    'Plastic': 1200,
    'Composite': 1600,
    'Cast Iron': 7200,
    'Stainless Steel': 7750,
    'Magnesium': 1800
  };

  // Get current density based on selected material
  const currentDensity = materialDensities[selectedMaterial] || 7850;

  const handleRunMassProperties = async () => {
    if (!currentDesign) {
      setMassPropertiesError('No design available');
      return;
    }

    console.log('=== FRONTEND: Running Mass Properties ===');
    console.log('Current design:', JSON.stringify(currentDesign, null, 2));
    console.log('Current design has simulationData?', !!currentDesign.simulationData);
    console.log('Selected material:', selectedMaterial);

    setMassPropertiesLoading(true);
    setMassPropertiesError(null); // Clear previous errors
    
    try {
      const result = await runMassPropertiesSimulation(
        currentDesign,
        selectedMaterial
      );

      if (result.success) {
        // Store both mass properties and material info
        const enrichedMassProperties = {
          ...result.mass_properties,
          material: result.material
        };
        
        setMassProperties(enrichedMassProperties);
        addSimulationToHistory({
          type: 'mass_properties',
          material: selectedMaterial,
          results: result.mass_properties
        });

        // Don't auto-open modal - keep STEP 2 below STEP 1
      } else {
        setMassPropertiesError(result.error || 'Failed to compute mass properties');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message;
      setMassPropertiesError(errorMessage);
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

    // Toggle the structural analysis section
    if (!showStructuralAnalysis) {
      setShowStructuralAnalysis(true);
      // Auto-run analysis when opening
      setTimeout(() => runStructuralAnalysis(), 100);
    }
  };

  // Auto-scroll to structural analysis section when it opens
  useEffect(() => {
    if (showStructuralAnalysis && structuralAnalysisRef.current) {
      // Smooth scroll to the structural analysis section
      structuralAnalysisRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }
  }, [showStructuralAnalysis]);

  const runStructuralAnalysis = async () => {
    setStructuralLoading(true);
    setStructuralError(null);
    setStructuralResults(null);

    try {
      const directionVector = directions.find(d => d.value === loadDirection).vector;
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/structural-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design: {
            type: currentDesign.type,
            parameters: currentDesign.parameters
          },
          material: selectedMaterial,
          constraints: [
            {
              type: 'fixed',
              face: constraintFace,
              dof: ['x', 'y', 'z']
            }
          ],
          loads: [
            {
              type: 'force',
              magnitude: parseFloat(loadMagnitude),
              direction: directionVector,
              face: loadFace
            }
          ]
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Check backend logs.');
      }

      const data = await response.json();

      if (data.success) {
        setStructuralResults(data.results);
        addSimulationToHistory({
          type: 'structural',
          material: selectedMaterial,
          results: data.results
        });
      } else {
        setStructuralError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setStructuralError(err.message || 'Failed to run analysis');
      console.error('Structural analysis error:', err);
    } finally {
      setStructuralLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
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
        <div className="space-y-4">
          {/* Material Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-200">📦 Material Selection</h3>
            
            {/* Warning if material changed after computation */}
            {massPropertiesComputed && (
              <div className="mb-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-xs text-yellow-300">
                  ⚠️ Changing material will require recomputing STEP 1
                </p>
              </div>
            )}
            
            <MaterialInfo
              material={selectedMaterial}
              density={currentDensity}
              onMaterialChange={(newMaterial) => {
                setSelectedMaterial(newMaterial);
              }}
            />
          </div>

          {/* STEP 1: Mass Properties */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
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
              <div className="mb-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
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
                material={massProperties.material || { name: selectedMaterial, density_kg_m3: currentDensity }}
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
          <div className="border-t border-gray-700 pt-4">
            <SimulationControls
              step1Complete={massPropertiesComputed}
              onRunStructural={handleRunStructural}
              loading={currentSimulationLoading}
              loadingType={currentSimulationType}
              error={massPropertiesComputed ? null : 'Complete STEP 1 first'}
            />

            {/* Inline Structural Analysis Section */}
            {showStructuralAnalysis && (
              <div 
                ref={structuralAnalysisRef}
                className="mt-4 p-4 bg-gray-800/30 border border-gray-700 rounded-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">STEP 2</span>
                    <h3 className="text-lg font-bold text-white">Structural & Stress Analysis</h3>
                  </div>
                  <button
                    onClick={() => setShowStructuralAnalysis(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Material Info */}
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <h4 className="font-semibold mb-2 text-gray-200">Material Properties</h4>
                  <p className="text-sm text-gray-400">Material: <span className="text-white">{selectedMaterial}</span></p>
                </div>

                {/* Constraint Definition */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-200">1. Fixed Constraint (Required)</h4>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Constraint Face:</label>
                    <select
                      value={constraintFace}
                      onChange={(e) => setConstraintFace(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    >
                      {faces.map(face => (
                        <option key={face} value={face}>{face.charAt(0).toUpperCase() + face.slice(1)}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Face will be fixed (zero displacement in X, Y, Z)</p>
                  </div>
                </div>

                {/* Load Definition */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-200">2. Applied Load (Required)</h4>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Load Magnitude (N):</label>
                    <input
                      type="number"
                      value={loadMagnitude}
                      onChange={(e) => setLoadMagnitude(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Load Direction:</label>
                    <select
                      value={loadDirection}
                      onChange={(e) => setLoadDirection(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    >
                      {directions.map(dir => (
                        <option key={dir.value} value={dir.value}>{dir.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Load Application Face:</label>
                    <select
                      value={loadFace}
                      onChange={(e) => setLoadFace(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary focus:outline-none"
                    >
                      {faces.map(face => (
                        <option key={face} value={face}>{face.charAt(0).toUpperCase() + face.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Run Button */}
                <button
                  onClick={runStructuralAnalysis}
                  disabled={structuralLoading}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    structuralLoading
                      ? 'bg-gray-700 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                >
                  {structuralLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running Analysis...
                    </>
                  ) : (
                    'Run Analysis'
                  )}
                </button>

                {/* Error Display */}
                {structuralError && (
                  <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-300">Error</p>
                      <p className="text-sm text-red-200">{structuralError}</p>
                    </div>
                  </div>
                )}

                {/* Results Display */}
                {structuralResults && (
                  <div className="space-y-3 border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <h4 className="text-lg font-bold text-white">Analysis Results</h4>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                      structuralResults.status === 'SAFE' 
                        ? 'bg-green-900/30 border border-green-700/50 text-green-300'
                        : 'bg-red-900/30 border border-red-700/50 text-red-300'
                    }`}>
                      {structuralResults.status}
                    </div>

                    {/* Key Results */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Max Von Mises Stress</p>
                        <p className="text-2xl font-bold text-orange-300">
                          {structuralResults.maxVonMisesStress_MPa.toFixed(2)}
                          <span className="text-sm text-gray-400 ml-1">MPa</span>
                        </p>
                      </div>

                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Max Displacement</p>
                        <p className="text-2xl font-bold text-blue-300">
                          {structuralResults.maxDisplacement_mm.toFixed(3)}
                          <span className="text-sm text-gray-400 ml-1">mm</span>
                        </p>
                      </div>

                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Safety Factor</p>
                        <p className={`text-2xl font-bold ${
                          structuralResults.safetyFactor > 2 ? 'text-green-300' :
                          structuralResults.safetyFactor > 1 ? 'text-yellow-300' :
                          'text-red-300'
                        }`}>
                          {structuralResults.safetyFactor.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Analysis Type</p>
                        <p className="text-sm font-semibold text-gray-200">
                          {structuralResults.analysisType || 'Linear Static'}
                        </p>
                      </div>
                    </div>

                    {/* Reaction Forces */}
                    {structuralResults.reactionForces && (
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <p className="text-sm font-semibold text-gray-200 mb-2">Reaction Forces</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Force:</span>
                            <span className="text-white ml-2">{structuralResults.reactionForces.force_N.toFixed(1)} N</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Moment:</span>
                            <span className="text-white ml-2">{structuralResults.reactionForces.moment_Nm.toFixed(2)} N·m</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assumptions */}
                    {structuralResults.assumptions && (
                      <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                        <p className="text-xs font-semibold text-blue-300 mb-1">Analysis Assumptions:</p>
                        <ul className="text-xs text-blue-200 space-y-1">
                          {structuralResults.assumptions.map((assumption, idx) => (
                            <li key={idx}>• {assumption}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
