import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useDesignStore } from '../store/designStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Structural Analysis Modal with Auto-Run and Color Visualization
 */
export default function StructuralAnalysisModal({ design, material, onClose }) {
  const { setStressResults } = useDesignStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  
  // Input states
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

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const directionVector = directions.find(d => d.value === loadDirection).vector;
      
      const response = await fetch(`${API_BASE}/api/structural-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          design: {
            type: design.type,
            parameters: design.parameters
          },
          material: material,
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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response. Check backend logs.');
      }

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to run analysis');
      console.error('Structural analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  // AUTO-RUN ANALYSIS ON MOUNT
  useEffect(() => {
    handleRunAnalysis();
  }, []); // Run once when modal opens

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">STEP 2</span>
              <h2 className="text-xl font-bold text-white">Static Structural Analysis</h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">Configure simulation parameters and run FEA analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Material Info */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-200">Material Properties</h3>
            <p className="text-sm text-gray-400">Material: <span className="text-white">{material}</span></p>
            <p className="text-xs text-gray-500 mt-1">Properties loaded from database</p>
          </div>

          {/* Constraint Definition */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-200">1. Fixed Constraint (Required)</h3>
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
            <h3 className="font-semibold text-gray-200">2. Applied Load (Required)</h3>
            
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
            onClick={handleRunAnalysis}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Analysis...
              </>
            ) : (
              'Run Analysis'
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-300">Error</p>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-4 border-t border-gray-700 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-bold text-white">Analysis Results</h3>
              </div>

              {/* Status Badge */}
              <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                results.status === 'SAFE' 
                  ? 'bg-green-900/30 border border-green-700/50 text-green-300'
                  : 'bg-red-900/30 border border-red-700/50 text-red-300'
              }`}>
                {results.status}
              </div>

              {/* Key Results */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Max Von Mises Stress</p>
                  <p className="text-2xl font-bold text-orange-300">
                    {results.maxVonMisesStress_MPa.toFixed(2)}
                    <span className="text-sm text-gray-400 ml-1">MPa</span>
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Max Displacement</p>
                  <p className="text-2xl font-bold text-blue-300">
                    {results.maxDisplacement_mm.toFixed(3)}
                    <span className="text-sm text-gray-400 ml-1">mm</span>
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Safety Factor</p>
                  <p className={`text-2xl font-bold ${
                    results.safetyFactor > 2 ? 'text-green-300' :
                    results.safetyFactor > 1 ? 'text-yellow-300' :
                    'text-red-300'
                  }`}>
                    {results.safetyFactor.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Analysis Type</p>
                  <p className="text-sm font-semibold text-gray-200">
                    {results.analysisType || 'Linear Static'}
                  </p>
                </div>
              </div>

              {/* Reaction Forces */}
              {results.reactionForces && (
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <p className="text-sm font-semibold text-gray-200 mb-2">Reaction Forces</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Force:</span>
                      <span className="text-white ml-2">{results.reactionForces.force_N.toFixed(1)} N</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Moment:</span>
                      <span className="text-white ml-2">{results.reactionForces.moment_Nm.toFixed(2)} N·m</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Assumptions */}
              {results.assumptions && (
                <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-300 mb-1">Analysis Assumptions:</p>
                  <ul className="text-xs text-blue-200 space-y-1">
                    {results.assumptions.map((assumption, idx) => (
                      <li key={idx}>• {assumption}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
