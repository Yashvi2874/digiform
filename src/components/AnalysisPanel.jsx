import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Loader2, Gauge, Shield, Weight, Zap, X } from 'lucide-react';
import { useDesignStore } from '../store/designStore';
import { runSimulation } from '../services/api';

export default function AnalysisPanel() {
  const { currentDesign, updateDesignAnalysis } = useDesignStore();
  const [loading, setLoading] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [loadInput, setLoadInput] = useState({
    force: '',
    area: '',
    loadType: 'axial'
  });

  const handleRunSimulation = async () => {
    setShowLoadDialog(true);
  };

  const handleSimulationSubmit = async () => {
    if (!loadInput.force || !loadInput.area) {
      alert('Please enter both force and area values');
      return;
    }

    setLoading(true);
    setShowLoadDialog(false);
    
    try {
      const analysis = await runSimulation({
        ...currentDesign,
        loadConditions: {
          force: parseFloat(loadInput.force),
          area: parseFloat(loadInput.area),
          loadType: loadInput.loadType
        }
      });
      updateDesignAnalysis(currentDesign.id, analysis);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="relative">
        <div className="absolute -top-2 -right-2 w-20 h-20 bg-secondary/20 rounded-full blur-3xl"></div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-3 relative">
          <div className="p-2 bg-gradient-to-br from-secondary to-purple-600 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Performance Analysis
          </span>
        </h2>
      </div>

      <button
        onClick={handleRunSimulation}
        disabled={loading}
        className="w-full bg-gradient-to-r from-secondary to-purple-600 hover:from-purple-600 hover:to-secondary disabled:from-gray-700 disabled:to-gray-600 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-secondary/50 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Running Simulation...
          </>
        ) : (
          <>
            <Gauge className="w-6 h-6" />
            Run Simulation
          </>
        )}
      </button>

      {/* Load Input Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-light border-2 border-primary/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Load Conditions
              </h3>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Applied Force (N)
                </label>
                <input
                  type="number"
                  value={loadInput.force}
                  onChange={(e) => setLoadInput({ ...loadInput, force: e.target.value })}
                  placeholder="e.g., 1000"
                  className="w-full bg-dark border-2 border-gray-700 focus:border-primary rounded-lg p-3 text-white focus:outline-none"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Enter the force in Newtons</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Load Area (mm²)
                </label>
                <input
                  type="number"
                  value={loadInput.area}
                  onChange={(e) => setLoadInput({ ...loadInput, area: e.target.value })}
                  placeholder="e.g., 500"
                  className="w-full bg-dark border-2 border-gray-700 focus:border-primary rounded-lg p-3 text-white focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Area where load is applied</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Load Type
                </label>
                <select
                  value={loadInput.loadType}
                  onChange={(e) => setLoadInput({ ...loadInput, loadType: e.target.value })}
                  className="w-full bg-dark border-2 border-gray-700 focus:border-primary rounded-lg p-3 text-white focus:outline-none"
                >
                  <option value="axial">Axial (Tension/Compression)</option>
                  <option value="shear">Shear</option>
                  <option value="bending">Bending</option>
                  <option value="torsion">Torsion</option>
                </select>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <p className="text-xs text-gray-300">
                  <strong>Calculated Stress:</strong>{' '}
                  {loadInput.force && loadInput.area
                    ? `${(parseFloat(loadInput.force) / parseFloat(loadInput.area)).toFixed(2)} MPa`
                    : 'Enter values to calculate'}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowLoadDialog(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulationSubmit}
                  className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary py-3 rounded-lg font-semibold transition shadow-lg"
                >
                  Run Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentDesign.analysis && (
        <div className="space-y-4">
          {/* Status indicator */}
          <div className={`p-4 rounded-xl border-2 ${
            currentDesign.analysis.safetyFactor < 2 
              ? 'bg-red-900/20 border-red-500/50' 
              : 'bg-green-900/20 border-green-500/50'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {currentDesign.analysis.safetyFactor < 2 ? (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              <h3 className="font-bold text-lg">
                {currentDesign.analysis.safetyFactor < 2 ? 'Attention Required' : 'Design Validated'}
              </h3>
            </div>
            <p className="text-sm text-gray-300">
              {currentDesign.analysis.safetyFactor < 2 
                ? 'Component may require reinforcement or material change'
                : 'Component meets structural requirements'}
            </p>
          </div>

          {/* Load conditions display */}
          {currentDesign.analysis.loadConditions && (
            <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/30">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-primary">
                <Zap className="w-5 h-5" />
                Applied Load
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400 block">Force</span>
                  <span className="font-bold text-white">{currentDesign.analysis.loadConditions.force} N</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Area</span>
                  <span className="font-bold text-white">{currentDesign.analysis.loadConditions.area} mm²</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block">Load Type</span>
                  <span className="font-bold text-white capitalize">{currentDesign.analysis.loadConditions.loadType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Structural metrics */}
          <div className="p-5 bg-gradient-to-br from-dark/50 to-dark-light/50 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
              <Shield className="w-5 h-5" />
              Structural Integrity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Max Stress</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                      style={{ width: `${Math.min((currentDesign.analysis.maxStress / currentDesign.analysis.yieldStrength) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-white w-24 text-right">{currentDesign.analysis.maxStress} MPa</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Safety Factor</span>
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full font-bold ${
                    currentDesign.analysis.safetyFactor < 2 
                      ? 'bg-red-500/20 text-red-400' 
                      : currentDesign.analysis.safetyFactor < 3
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {currentDesign.analysis.safetyFactor}x
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Deformation</span>
                <span className="font-bold text-white">{currentDesign.analysis.deformation} mm</span>
              </div>
            </div>
          </div>

          {/* Material properties */}
          <div className="p-5 bg-gradient-to-br from-dark/50 to-dark-light/50 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-secondary">
              <Weight className="w-5 h-5" />
              Material Properties
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark/50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block mb-1">Material</span>
                <p className="font-bold text-white">{currentDesign.analysis.material}</p>
              </div>
              <div className="bg-dark/50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block mb-1">Yield Strength</span>
                <p className="font-bold text-white">{currentDesign.analysis.yieldStrength} MPa</p>
              </div>
              <div className="bg-dark/50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block mb-1">Mass</span>
                <p className="font-bold text-white">{currentDesign.analysis.mass} kg</p>
              </div>
              <div className="bg-dark/50 p-3 rounded-lg">
                <span className="text-xs text-gray-500 block mb-1">Status</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="font-bold text-green-400 text-sm">Live</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {currentDesign.analysis.warnings?.length > 0 && (
            <div className="p-4 bg-yellow-900/20 rounded-xl border-2 border-yellow-500/50">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-5 h-5" />
                Design Warnings
              </h3>
              <ul className="space-y-2">
                {currentDesign.analysis.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-yellow-200 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
