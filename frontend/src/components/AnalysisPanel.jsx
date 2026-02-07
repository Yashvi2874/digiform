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
  const showStressVisualization = useDesignStore(state => state.showStressVisualization);
  const setShowStressVisualization = useDesignStore(state => state.setShowStressVisualization);
  
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
  
  // Ref for auto-scrolling to structural results
  const structuralResultsRef = useRef(null);

  // State for inline structural analysis
  const [showStructuralAnalysis, setShowStructuralAnalysis] = useState(() => {
    // Check if there's a structural analysis in history to auto-open STEP 2
    const history = currentDesign?.simulationData?.simulationHistory || [];
    return history.some(sim => sim.type === 'structural');
  });
  const [structuralLoading, setStructuralLoading] = useState(false);
  const [structuralError, setStructuralError] = useState(null);
  const [structuralResults, setStructuralResults] = useState(() => {
    // Restore latest structural results from history
    const history = currentDesign?.simulationData?.simulationHistory || [];
    const latestStructural = history.filter(sim => sim.type === 'structural').pop();
    return latestStructural?.results || null;
  });
  
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

  // Update structural analysis state when design changes
  useEffect(() => {
    if (currentDesign) {
      const history = currentDesign.simulationData?.simulationHistory || [];
      const hasStructural = history.some(sim => sim.type === 'structural');
      const latestStructural = history.filter(sim => sim.type === 'structural').pop();
      
      // Only show structural analysis if there's a history and STEP 1 is complete
      setShowStructuralAnalysis(hasStructural && massPropertiesComputed);
      setStructuralResults(latestStructural?.results || null);
      setStructuralError(null);
      
      // Reset stress visualization if no structural analysis exists
      if (!hasStructural) {
        setShowStressVisualization(false);
      }
    } else {
      setShowStructuralAnalysis(false);
      setStructuralResults(null);
      setStructuralError(null);
      setShowStressVisualization(false);
    }
  }, [currentDesign?.id, massPropertiesComputed, setShowStressVisualization]);

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
      // Don't auto-run - wait for user to click "Run Analysis" button
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
          results: data.results,
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
        });
        
        // Auto-scroll to results after a short delay
        setTimeout(() => {
          if (structuralResultsRef.current) {
            structuralResultsRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start'
            });
          }
        }, 300);
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
                  <div 
                    ref={structuralResultsRef}
                    className="space-y-3 border-t border-gray-700 pt-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <h4 className="text-lg font-bold text-white">Analysis Results</h4>
                    </div>

                    {/* Stress Visualization Toggle Button */}
                    <div className="flex items-center justify-between p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                      <div>
                        <p className="text-sm font-semibold text-purple-300">Visual Stress Heatmap</p>
                        <p className="text-xs text-purple-200 mt-1">
                          Display face-wise stress heatmap with semi-transparent overlay on CAD model
                        </p>
                      </div>
                      <button
                        onClick={() => setShowStressVisualization(!showStressVisualization)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                          showStressVisualization
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {showStressVisualization ? '✓ Showing' : 'See Heatmap'}
                      </button>
                    </div>

                    {/* 3D Stress Visualization Notice - Only show when enabled */}
                    {showStressVisualization && (
                      <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                        <p className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                          <span>🎨</span>
                          <span>Stress Heatmap Overlay Active</span>
                        </p>
                        <p className="text-xs text-purple-200 mt-1">
                          Semi-transparent stress colors are overlaid on the CAD model's material. 
                          Green = Low stress, Yellow = Medium, Orange = High, Red = Critical
                        </p>
                      </div>
                    )}

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

                    {/* Stress Heatmap Visualization - Only show when enabled */}
                    {showStressVisualization && (
                      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <p className="text-sm font-semibold text-gray-200 mb-3">Stress Distribution Heatmap</p>
                        <p className="text-xs text-gray-400 mb-3">Color-coded stress levels on each surface</p>
                      
                      {/* Color Legend */}
                      <div className="flex items-center gap-2 mb-4 text-xs">
                        <span className="text-gray-400">Legend:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="text-gray-300">Low</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span className="text-gray-300">Medium</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-orange-500 rounded"></div>
                          <span className="text-gray-300">High</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span className="text-gray-300">Critical</span>
                        </div>
                      </div>

                      {/* Geometry-Specific Face Stress Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {(() => {
                          const designType = currentDesign.type.toLowerCase();
                          let faces = [];
                          
                          // Define faces based on geometry type
                          if (designType === 'cylinder') {
                            faces = ['Top Circle', 'Curved Surface', 'Bottom Circle'];
                          } else if (designType === 'sphere') {
                            faces = ['Surface'];
                          } else if (designType === 'cone') {
                            faces = ['Base Circle', 'Conical Surface', 'Apex'];
                          } else if (designType === 'cube' || designType === 'beam' || designType === 'bracket' || designType === 'plate') {
                            faces = ['Top', 'Front', 'Right', 'Bottom', 'Back', 'Left'];
                          } else {
                            // Default for other geometries
                            faces = ['Top', 'Front', 'Right', 'Bottom', 'Back', 'Left'];
                          }
                          
                          return faces.map((face) => {
                            const maxStress = structuralResults.maxVonMisesStress_MPa;
                            const yieldStrength = structuralResults.yieldStrength_MPa || 250;
                            
                            // Calculate stress ratio for this face
                            let stressRatio;
                            const faceLower = face.toLowerCase();
                            const loadFaceLower = loadFace.toLowerCase();
                            const constraintFaceLower = constraintFace.toLowerCase();
                            
                            // For cylinders, map load/constraint faces to cylinder surfaces
                            if (designType === 'cylinder') {
                              if ((loadFaceLower === 'top' && faceLower.includes('top')) ||
                                  (loadFaceLower === 'bottom' && faceLower.includes('bottom')) ||
                                  ((loadFaceLower === 'left' || loadFaceLower === 'right' || 
                                    loadFaceLower === 'front' || loadFaceLower === 'back') && 
                                   faceLower.includes('curved'))) {
                                stressRatio = maxStress / yieldStrength; // Highest stress
                              } else if ((constraintFaceLower === 'top' && faceLower.includes('top')) ||
                                         (constraintFaceLower === 'bottom' && faceLower.includes('bottom')) ||
                                         ((constraintFaceLower === 'left' || constraintFaceLower === 'right' || 
                                           constraintFaceLower === 'front' || constraintFaceLower === 'back') && 
                                          faceLower.includes('curved'))) {
                                stressRatio = (maxStress * 0.6) / yieldStrength; // Medium stress
                              } else {
                                stressRatio = (maxStress * 0.3) / yieldStrength; // Low stress
                              }
                            } else if (designType === 'sphere') {
                              // Sphere has uniform stress distribution
                              stressRatio = maxStress / yieldStrength;
                            } else if (designType === 'cone') {
                              if ((loadFaceLower === 'top' && faceLower.includes('apex')) ||
                                  (loadFaceLower === 'bottom' && faceLower.includes('base')) ||
                                  ((loadFaceLower === 'left' || loadFaceLower === 'right' || 
                                    loadFaceLower === 'front' || loadFaceLower === 'back') && 
                                   faceLower.includes('conical'))) {
                                stressRatio = maxStress / yieldStrength;
                              } else if ((constraintFaceLower === 'top' && faceLower.includes('apex')) ||
                                         (constraintFaceLower === 'bottom' && faceLower.includes('base')) ||
                                         ((constraintFaceLower === 'left' || constraintFaceLower === 'right' || 
                                           constraintFaceLower === 'front' || constraintFaceLower === 'back') && 
                                          faceLower.includes('conical'))) {
                                stressRatio = (maxStress * 0.6) / yieldStrength;
                              } else {
                                stressRatio = (maxStress * 0.3) / yieldStrength;
                              }
                            } else {
                              // Rectangular geometries
                              if (faceLower === loadFaceLower) {
                                stressRatio = maxStress / yieldStrength;
                              } else if (faceLower === constraintFaceLower) {
                                stressRatio = (maxStress * 0.6) / yieldStrength;
                              } else {
                                stressRatio = (maxStress * 0.3) / yieldStrength;
                              }
                            }
                            
                            // Determine color based on stress ratio
                            let bgColor, textColor, stressLevel;
                            if (stressRatio < 0.3) {
                              bgColor = 'bg-green-500/80';
                              textColor = 'text-green-100';
                              stressLevel = 'Low';
                            } else if (stressRatio < 0.6) {
                              bgColor = 'bg-yellow-500/80';
                              textColor = 'text-yellow-100';
                              stressLevel = 'Medium';
                            } else if (stressRatio < 0.85) {
                              bgColor = 'bg-orange-500/80';
                              textColor = 'text-orange-100';
                              stressLevel = 'High';
                            } else {
                              bgColor = 'bg-red-500/80';
                              textColor = 'text-red-100';
                              stressLevel = 'Critical';
                            }
                            
                            const faceStress = stressRatio * yieldStrength;
                            
                            // Determine if this face has load or constraint
                            let hasBorder = false;
                            let borderColor = 'border-transparent';
                            
                            if (designType === 'cylinder') {
                              if ((loadFaceLower === 'top' && faceLower.includes('top')) ||
                                  (loadFaceLower === 'bottom' && faceLower.includes('bottom')) ||
                                  ((loadFaceLower === 'left' || loadFaceLower === 'right' || 
                                    loadFaceLower === 'front' || loadFaceLower === 'back') && 
                                   faceLower.includes('curved'))) {
                                hasBorder = true;
                                borderColor = 'border-white';
                              } else if ((constraintFaceLower === 'top' && faceLower.includes('top')) ||
                                         (constraintFaceLower === 'bottom' && faceLower.includes('bottom')) ||
                                         ((constraintFaceLower === 'left' || constraintFaceLower === 'right' || 
                                           constraintFaceLower === 'front' || constraintFaceLower === 'back') && 
                                          faceLower.includes('curved'))) {
                                hasBorder = true;
                                borderColor = 'border-gray-400';
                              }
                            } else if (designType === 'sphere') {
                              hasBorder = true;
                              borderColor = 'border-white';
                            } else if (designType === 'cone') {
                              if ((loadFaceLower === 'top' && faceLower.includes('apex')) ||
                                  (loadFaceLower === 'bottom' && faceLower.includes('base')) ||
                                  ((loadFaceLower === 'left' || loadFaceLower === 'right' || 
                                    loadFaceLower === 'front' || loadFaceLower === 'back') && 
                                   faceLower.includes('conical'))) {
                                hasBorder = true;
                                borderColor = 'border-white';
                              } else if ((constraintFaceLower === 'top' && faceLower.includes('apex')) ||
                                         (constraintFaceLower === 'bottom' && faceLower.includes('base')) ||
                                         ((constraintFaceLower === 'left' || constraintFaceLower === 'right' || 
                                           constraintFaceLower === 'front' || constraintFaceLower === 'back') && 
                                          faceLower.includes('conical'))) {
                                hasBorder = true;
                                borderColor = 'border-gray-400';
                              }
                            } else {
                              if (faceLower === loadFaceLower) {
                                hasBorder = true;
                                borderColor = 'border-white';
                              } else if (faceLower === constraintFaceLower) {
                                hasBorder = true;
                                borderColor = 'border-gray-400';
                              }
                            }
                            
                            return (
                              <div 
                                key={face}
                                className={`p-3 ${bgColor} rounded-lg border-2 ${borderColor}`}
                              >
                                <div className="flex flex-col items-center">
                                  <p className={`text-xs font-bold ${textColor} mb-1`}>{face}</p>
                                  <p className={`text-lg font-bold ${textColor}`}>
                                    {faceStress.toFixed(1)}
                                  </p>
                                  <p className={`text-xs ${textColor}`}>MPa</p>
                                  <p className={`text-xs ${textColor} mt-1 opacity-80`}>{stressLevel}</p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-400">
                        <p>• White border: Load application surface (highest stress)</p>
                        <p>• Gray border: Fixed constraint surface (reaction stress)</p>
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
