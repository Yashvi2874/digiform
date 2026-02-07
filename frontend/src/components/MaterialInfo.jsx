import React from 'react';
import { Package, Info } from 'lucide-react';

/**
 * Displays material confirmation and allows material selection
 */
export default function MaterialInfo({ 
  material = 'Structural Steel',
  density = 7850,
  isDefault = false,
  onMaterialChange = () => {}
}) {
  const materials = [
    { name: 'Structural Steel', density: 7850 },
    { name: 'Aluminum', density: 2700 },
    { name: 'Titanium', density: 4500 },
    { name: 'Copper', density: 8960 },
    { name: 'Cast Iron', density: 7200 },
    { name: 'Stainless Steel', density: 7750 },
    { name: 'Magnesium', density: 1800 },
    { name: 'Brass', density: 8470 },
    { name: 'Plastic', density: 1200 },
    { name: 'Composite', density: 1600 }
  ];

  return (
    <div className="space-y-4">
      {/* Material Display */}
      <div className="p-4 bg-gradient-to-r from-primary/20 to-purple-500/20 border-2 border-primary/50 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Current Material</p>
              <p className="text-xl font-bold text-primary">
                {material}
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Density: <span className="font-semibold">{density}</span> kg/m³
                {isDefault && <span className="text-xs text-gray-500 ml-2">(Default)</span>}
              </p>
            </div>
          </div>
          <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
        </div>
      </div>

      {/* Material Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Select Material
        </label>
        <div className="grid grid-cols-2 gap-2">
          {materials.map((mat) => (
            <button
              key={mat.name}
              onClick={() => onMaterialChange(mat.name)}
              className={`p-2 rounded-lg text-sm transition-all border-2 ${
                material === mat.name
                  ? 'bg-primary/20 border-primary text-primary font-semibold'
                  : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="font-medium">{mat.name}</div>
              <div className="text-xs text-gray-400">{mat.density} kg/m³</div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Text */}
      <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-gray-400">
        <p>
          Material density is used in mass properties calculation (STEP 1). 
          Changing material will require recomputing mass properties.
        </p>
      </div>
    </div>
  );
}
