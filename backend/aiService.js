import { parseComponentDescription } from './nlpParser.js';

export async function generateDesignFromNL(description) {
  // Use rule-based NLP parser instead of OpenAI
  const design = parseComponentDescription(description);
  
  // Add enhanced geometry data from CAD engine
  try {
    const { spawn } = require('child_process');
    const path = require('path');
    
    // Call enhanced CAD engine for better geometry
    const pythonProcess = spawn('python', [
      '-c',
      `
import sys
import json
sys.path.append('${path.join(__dirname, '')}')
from enhanced_cad_engine import EnhancedCADEngine

engine = EnhancedCADEngine()
result = engine.process_description('''${description}''')
print(json.dumps(result))
      `
    ]);
    
    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    // Wait for process to complete (simplified approach)
    await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });
    
    if (output.trim()) {
      try {
        const cadResult = JSON.parse(output.trim());
        if (cadResult.success) {
          // Merge enhanced geometry with design
          design.geometry = cadResult.geometry;
          design.properties = cadResult.properties;
          design.featureChecklist = cadResult.feature_checklist;
        }
      } catch (e) {
        console.log('Enhanced CAD parsing failed, using basic design');
      }
    }
  } catch (error) {
    console.log('Enhanced CAD engine failed, using basic design:', error.message);
  }
  
  return design;
}

export async function simulateComponent(design) {
  const { type, parameters, material = 'Steel', loadConditions } = design;
  
  // Material properties database
  const materialProps = {
    'Steel': { yieldStrength: 250, density: 7850, elasticity: 200000 },
    'Aluminum': { yieldStrength: 95, density: 2700, elasticity: 69000 },
    'Titanium': { yieldStrength: 880, density: 4500, elasticity: 116000 },
    'Brass': { yieldStrength: 200, density: 8500, elasticity: 100000 },
    'Copper': { yieldStrength: 70, density: 8960, elasticity: 120000 }
  };

  const props = materialProps[material] || materialProps['Steel'];
  
  // Calculate volume and mass
  const volume = calculateVolume(type, parameters);
  const mass = volume * props.density / 1e9; // kg
  
  let stress, area;
  
  if (loadConditions && loadConditions.force && loadConditions.area) {
    // User-provided load conditions
    area = loadConditions.area; // mm²
    const force = loadConditions.force; // N
    
    // Calculate stress based on load type
    switch (loadConditions.loadType) {
      case 'axial':
        stress = force / area; // MPa (N/mm²)
        break;
      case 'shear':
        stress = force / area;
        break;
      case 'bending':
        // Simplified bending stress
        stress = (force / area) * 1.5; // Approximate factor
        break;
      case 'torsion':
        // Simplified torsional stress
        stress = (force / area) * 1.2; // Approximate factor
        break;
      default:
        stress = force / area;
    }
  } else {
    // Default calculation (10x weight as load)
    area = calculateCrossSection(type, parameters);
    const assumedLoad = mass * 9.81 * 10; // N
    stress = assumedLoad / area;
  }
  
  const safetyFactor = (props.yieldStrength / stress).toFixed(2);
  const deformation = (stress * 100 / props.elasticity).toFixed(3);

  const warnings = [];
  if (safetyFactor < 2) warnings.push('Low safety factor - consider stronger material or larger dimensions');
  if (stress > props.yieldStrength * 0.8) warnings.push('High stress levels detected - component may yield under load');
  if (deformation > 1) warnings.push('Significant deformation expected - consider stiffer design');

  // Generate stress distribution data for heatmap
  const stressDistribution = generateStressDistribution(stress, props.yieldStrength);

  return {
    maxStress: stress.toFixed(2),
    safetyFactor,
    deformation,
    material,
    yieldStrength: props.yieldStrength,
    mass: mass.toFixed(3),
    warnings,
    loadConditions: loadConditions || null,
    stressDistribution
  };
}

function generateStressDistribution(maxStress, yieldStrength) {
  // Generate stress values across the component
  // Higher stress at load points, lower at edges
  const distribution = [];
  const numPoints = 20;
  
  for (let i = 0; i < numPoints; i++) {
    // Simulate stress gradient from center (high) to edges (low)
    const position = i / numPoints;
    const stressFactor = Math.exp(-position * 2); // Exponential decay
    const localStress = maxStress * (0.3 + stressFactor * 0.7);
    const stressRatio = localStress / yieldStrength;
    
    distribution.push({
      position,
      stress: localStress,
      ratio: stressRatio,
      color: getStressColor(stressRatio)
    });
  }
  
  return distribution;
}

function getStressColor(ratio) {
  // Color mapping: green (safe) -> yellow (moderate) -> red (critical)
  if (ratio < 0.3) return '#00ff00'; // Green
  if (ratio < 0.5) return '#7fff00'; // Yellow-green
  if (ratio < 0.7) return '#ffff00'; // Yellow
  if (ratio < 0.85) return '#ff7f00'; // Orange
  return '#ff0000'; // Red
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
