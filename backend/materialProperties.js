/**
 * Material Properties Database
 * All properties in SI units
 */

export const materialProperties = {
  'Structural Steel': {
    density: 7850,              // kg/m³
    youngsModulus: 200e9,       // Pa (200 GPa)
    poissonsRatio: 0.3,         // dimensionless
    yieldStrength: 250e6,       // Pa (250 MPa)
    ultimateStrength: 400e6,    // Pa (400 MPa)
    color: '#8b9dc3'
  },
  'Steel': {
    density: 7850,
    youngsModulus: 200e9,
    poissonsRatio: 0.3,
    yieldStrength: 250e6,
    ultimateStrength: 400e6,
    color: '#8b9dc3'
  },
  'Aluminum': {
    density: 2700,              // kg/m³
    youngsModulus: 69e9,        // Pa (69 GPa)
    poissonsRatio: 0.33,        // dimensionless
    yieldStrength: 95e6,        // Pa (95 MPa)
    ultimateStrength: 310e6,    // Pa (310 MPa)
    color: '#c0c0c0'
  },
  'Titanium': {
    density: 4500,              // kg/m³
    youngsModulus: 116e9,       // Pa (116 GPa)
    poissonsRatio: 0.32,        // dimensionless
    yieldStrength: 880e6,       // Pa (880 MPa)
    ultimateStrength: 950e6,    // Pa (950 MPa)
    color: '#878681'
  },
  'Copper': {
    density: 8960,              // kg/m³
    youngsModulus: 130e9,       // Pa (130 GPa)
    poissonsRatio: 0.34,        // dimensionless
    yieldStrength: 70e6,        // Pa (70 MPa)
    ultimateStrength: 220e6,    // Pa (220 MPa)
    color: '#b87333'
  },
  'Brass': {
    density: 8470,              // kg/m³
    youngsModulus: 100e9,       // Pa (100 GPa)
    poissonsRatio: 0.34,        // dimensionless
    yieldStrength: 200e6,       // Pa (200 MPa)
    ultimateStrength: 380e6,    // Pa (380 MPa)
    color: '#b5a642'
  },
  'Plastic': {
    density: 1200,              // kg/m³
    youngsModulus: 2.5e9,       // Pa (2.5 GPa)
    poissonsRatio: 0.4,         // dimensionless
    yieldStrength: 50e6,        // Pa (50 MPa)
    ultimateStrength: 60e6,     // Pa (60 MPa)
    color: '#ffffff'
  },
  'Composite': {
    density: 1600,              // kg/m³
    youngsModulus: 70e9,        // Pa (70 GPa)
    poissonsRatio: 0.3,         // dimensionless
    yieldStrength: 600e6,       // Pa (600 MPa)
    ultimateStrength: 800e6,    // Pa (800 MPa)
    color: '#444444'
  },
  'Cast Iron': {
    density: 7200,              // kg/m³
    youngsModulus: 170e9,       // Pa (170 GPa)
    poissonsRatio: 0.28,        // dimensionless
    yieldStrength: 300e6,       // Pa (300 MPa)
    ultimateStrength: 400e6,    // Pa (400 MPa)
    color: '#555555'
  },
  'Stainless Steel': {
    density: 7750,              // kg/m³
    youngsModulus: 193e9,       // Pa (193 GPa)
    poissonsRatio: 0.31,        // dimensionless
    yieldStrength: 215e6,       // Pa (215 MPa)
    ultimateStrength: 505e6,    // Pa (505 MPa)
    color: '#aaaaaa'
  },
  'Magnesium': {
    density: 1800,              // kg/m³
    youngsModulus: 45e9,        // Pa (45 GPa)
    poissonsRatio: 0.35,        // dimensionless
    yieldStrength: 160e6,       // Pa (160 MPa)
    ultimateStrength: 240e6,    // Pa (240 MPa)
    color: '#cccccc'
  }
};

/**
 * Get material properties by name
 * @param {string} materialName - Name of the material
 * @returns {object|null} Material properties or null if not found
 */
export function getMaterialProperties(materialName) {
  return materialProperties[materialName] || null;
}

/**
 * Get all available material names
 * @returns {string[]} Array of material names
 */
export function getAvailableMaterials() {
  return Object.keys(materialProperties);
}

/**
 * Validate if material exists
 * @param {string} materialName - Name of the material
 * @returns {boolean} True if material exists
 */
export function isMaterialValid(materialName) {
  return materialName in materialProperties;
}

/**
 * Format material properties for display
 * @param {string} materialName - Name of the material
 * @returns {object} Formatted properties with units
 */
export function formatMaterialProperties(materialName) {
  const props = getMaterialProperties(materialName);
  if (!props) return null;
  
  return {
    material: materialName,
    density: {
      value: props.density,
      unit: 'kg/m³',
      display: `${props.density.toLocaleString()} kg/m³`
    },
    youngsModulus: {
      value: props.youngsModulus,
      unit: 'Pa',
      valueGPa: props.youngsModulus / 1e9,
      display: `${(props.youngsModulus / 1e9).toFixed(1)} GPa`
    },
    poissonsRatio: {
      value: props.poissonsRatio,
      unit: 'dimensionless',
      display: props.poissonsRatio.toFixed(2)
    },
    yieldStrength: {
      value: props.yieldStrength,
      unit: 'Pa',
      valueMPa: props.yieldStrength / 1e6,
      display: `${(props.yieldStrength / 1e6).toFixed(0)} MPa`
    },
    ultimateStrength: {
      value: props.ultimateStrength,
      unit: 'Pa',
      valueMPa: props.ultimateStrength / 1e6,
      display: `${(props.ultimateStrength / 1e6).toFixed(0)} MPa`
    }
  };
}
