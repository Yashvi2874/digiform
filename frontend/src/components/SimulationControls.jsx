import React, { useState } from 'react';
import { Zap, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

/**
 * STEP 2 Simulation control buttons
 * Disabled until STEP 1 (mass properties) is complete
 */
export default function SimulationControls({ 
  step1Complete = false, 
  onRunStructural = () => {},
  onRunDeflection = () => {},
  loading = false,
  loadingType = null,
  error = null
}) {
  const buttons = [
    {
      id: 'structural',
      label: 'Run Structural & Stress Analysis',
      description: 'Von Mises stress and strain analysis',
      onClick: onRunStructural,
      icon: '⚙️'
    },
    {
      id: 'deflection',
      label: 'Run Deflection Analysis',
      description: 'Displacement under load',
      onClick: onRunDeflection,
      icon: '📏'
    }
  ];

  return (
    <div className="space-y-4">
      {/* STEP 2 Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-semibold">STEP 2: ADVANCED SIMULATIONS</span>
        </div>
        {step1Complete ? (
          <span className="text-green-400 font-bold">✓ Available</span>
        ) : (
          <span className="text-yellow-400 font-bold">⏳ Requires STEP 1</span>
        )}
      </div>

      {/* Status Alert */}
      {!step1Complete && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-300">STEP 1 Required</p>
            <p className="text-sm text-yellow-200">
              Run mass properties calculation first to unlock advanced simulations
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-sm text-red-300">
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Simulation Buttons */}
      <div className="grid grid-cols-1 gap-3">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={button.onClick}
            disabled={!step1Complete || loading}
            className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
              step1Complete && !loading
                ? 'border-primary/50 bg-gray-800/50 hover:bg-gray-800 hover:border-primary cursor-pointer'
                : 'border-gray-700 bg-gray-900/50 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{button.icon}</span>
              <div className="text-left">
                <p className="font-semibold text-gray-200">{button.label}</p>
                <p className="text-xs text-gray-400">{button.description}</p>
              </div>
            </div>
            
            {loading && loadingType === button.id ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : step1Complete ? (
              <div className="text-primary">→</div>
            ) : (
              <div className="text-gray-600">✕</div>
            )}
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg text-sm text-blue-300">
        <p>
          <span className="font-semibold">Workflow:</span> Complete STEP 1 (mass properties) to enable STEP 2 simulations. 
          Each simulation requires the computed mass data for accurate results.
        </p>
      </div>
    </div>
  );
}
