import { parseComponentDescription } from './nlpParser.js';

export async function generateDesignFromNL(description) {
  // Use rule-based NLP parser instead of OpenAI
  const design = parseComponentDescription(description);
  return design;
}

export async function simulateComponent(design) {
  const { type, parameters, material = 'Steel' } = design;
  
  // Basic engineering calculations
  const materialProps = {
    'Steel': { yieldStrength: 250, density: 7850, elasticity: 200000 },
    'Aluminum': { yieldStrength: 95, density: 2700, elasticity: 69000 },
    'Titanium': { yieldStrength: 880, density: 4500, elasticity: 116000 }
  };

  const props = materialProps[material] || materialProps['Steel'];
  
  // Simplified stress analysis
  const volume = calculateVolume(type, parameters);
  const mass = volume * props.density / 1e9; // kg
  const assumedLoad = mass * 9.81 * 10; // N (10x weight as load)
  const area = calculateCrossSection(type, parameters);
  const stress = assumedLoad / area;
  const safetyFactor = (props.yieldStrength / stress).toFixed(2);
  const deformation = (stress * 100 / props.elasticity).toFixed(3);

  const warnings = [];
  if (safetyFactor < 2) warnings.push('Low safety factor - consider stronger material');
  if (stress > props.yieldStrength * 0.8) warnings.push('High stress levels detected');

  return {
    maxStress: stress.toFixed(2),
    safetyFactor,
    deformation,
    material,
    yieldStrength: props.yieldStrength,
    mass: mass.toFixed(3),
    warnings
  };
}

function calculateVolume(type, params) {
  switch (type.toLowerCase()) {
    case 'gear':
    case 'shaft':
      return Math.PI * Math.pow(params.radius || 25, 2) * (params.thickness || params.length || 10);
    case 'bracket':
      return (params.width || 50) * (params.height || 50) * (params.depth || 10);
    default:
      return 1000;
  }
}

function calculateCrossSection(type, params) {
  switch (type.toLowerCase()) {
    case 'gear':
    case 'shaft':
      return Math.PI * Math.pow(params.radius || 25, 2);
    case 'bracket':
      return (params.width || 50) * (params.depth || 10);
    default:
      return 100;
  }
}
