import React from 'react';
import { Weight, Zap, Box, Target, Gauge } from 'lucide-react';

/**
 * Displays mass properties with proper formatting and units
 * STEP 1 Results: Volume, Mass, Surface Area, COM, MOI
 * 
 * UNIT-SAFE IMPLEMENTATION:
 * - Material density in kg/m³
 * - CAD geometry in millimeters (mm)
 * - Volume in mm³
 * - Mass calculated using: mass_kg = density_kg_per_m3 × volume_m3 = density × volume_mm3 × 1e-9
 */
export default function MassPropertiesDisplay({ massProperties, status = 'PENDING', material = null }) {
  if (!massProperties) {
    return (
      <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
        <p className="text-gray-400">No mass properties computed yet. Run STEP 1 to calculate.</p>
      </div>
    );
  }

  const {
    volume_mm3 = 0,
    surface_area_mm2 = 0,
    mass_kg = 0,
    center_of_mass = { x_mm: 0, y_mm: 0, z_mm: 0 },
    moments_of_inertia = { Ixx_kg_mm2: 0, Iyy_kg_mm2: 0, Izz_kg_mm2: 0 }
  } = massProperties;

  // Format large numbers with commas
  const formatNumber = (value, decimals = 2) => {
    if (!value || !Number.isFinite(Number(value))) return '0.00';
    return parseFloat(value).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const statusColor = status === 'COMPLETE' ? 'text-green-400' : 'text-yellow-400';
  const statusIcon = status === 'COMPLETE' ? '✓' : '⏳';

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-semibold">STEP 1: MASS PROPERTIES</span>
        </div>
        <span className={`font-bold ${statusColor}`}>{statusIcon} {status}</span>
      </div>

      {/* Geometry Properties */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-200">
          <Box className="w-4 h-4 text-blue-400" />
          Geometry Properties
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Volume</p>
            <p className="text-lg font-bold text-blue-300">
              {formatNumber(volume_mm3 * 1e-3, 3)} <span className="text-xs text-gray-500">cm³</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Surface Area</p>
            <p className="text-lg font-bold text-blue-300">
              {formatNumber(surface_area_mm2 * 1e-2, 2)} <span className="text-xs text-gray-500">cm²</span>
            </p>
          </div>
        </div>
      </div>

      {/* Inertial Properties */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-200">
          <Weight className="w-4 h-4 text-green-400" />
          Inertial Properties
        </h4>
        <div className="space-y-3">
          <div className="p-3 bg-gray-900/50 rounded">
            <p className="text-xs text-gray-400 mb-1">Mass</p>
            <p className="text-lg font-bold text-green-400">
              {formatNumber(mass_kg, 3)} <span className="text-xs text-gray-500">kg</span>
            </p>
          </div>

          <div className="p-3 bg-gray-900/50 rounded">
            <p className="text-xs text-gray-400 mb-2">Center of Mass (X, Y, Z)</p>
            <div className="flex gap-4 text-sm">
              <span className="text-purple-300">
                X: <span className="font-semibold">{formatNumber(center_of_mass.x_mm, 2)}</span> <span className="text-xs text-gray-500">mm</span>
              </span>
              <span className="text-purple-300">
                Y: <span className="font-semibold">{formatNumber(center_of_mass.y_mm, 2)}</span> <span className="text-xs text-gray-500">mm</span>
              </span>
              <span className="text-purple-300">
                Z: <span className="font-semibold">{formatNumber(center_of_mass.z_mm, 2)}</span> <span className="text-xs text-gray-500">mm</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Moments of Inertia */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-200">
          <Gauge className="w-4 h-4 text-orange-400" />
          Moments of Inertia
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-900/50 rounded text-center">
            <p className="text-xs text-gray-400 mb-1">Ixx</p>
            <p className="text-sm font-bold text-orange-300">
              {formatNumber(moments_of_inertia.Ixx_kg_mm2, 0)}
            </p>
            <p className="text-xs text-gray-500">kg·mm²</p>
          </div>
          <div className="p-3 bg-gray-900/50 rounded text-center">
            <p className="text-xs text-gray-400 mb-1">Iyy</p>
            <p className="text-sm font-bold text-orange-300">
              {formatNumber(moments_of_inertia.Iyy_kg_mm2, 0)}
            </p>
            <p className="text-xs text-gray-500">kg·mm²</p>
          </div>
          <div className="p-3 bg-gray-900/50 rounded text-center">
            <p className="text-xs text-gray-400 mb-1">Izz</p>
            <p className="text-sm font-bold text-orange-300">
              {formatNumber(moments_of_inertia.Izz_kg_mm2, 0)}
            </p>
            <p className="text-xs text-gray-500">kg·mm²</p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
        <p className="text-sm text-green-300">
          ✓ STEP 1 Complete - Ready for STEP 2 Advanced Simulations
        </p>
      </div>
    </div>
  );
}
