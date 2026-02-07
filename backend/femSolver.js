/**
 * Simplified FEM Solver for Static Structural Analysis
 * Linear elasticity with small deformation theory
 */

/**
 * Compute Von Mises stress from stress tensor components
 * @param {number} sx - Normal stress in X direction (Pa)
 * @param {number} sy - Normal stress in Y direction (Pa)
 * @param {number} sz - Normal stress in Z direction (Pa)
 * @param {number} txy - Shear stress XY (Pa)
 * @param {number} tyz - Shear stress YZ (Pa)
 * @param {number} tzx - Shear stress ZX (Pa)
 * @returns {number} Von Mises stress (Pa)
 */
export function computeVonMisesStress(sx, sy, sz, txy = 0, tyz = 0, tzx = 0) {
  // Von Mises stress formula:
  // σ_vm = sqrt(σ_x² + σ_y² + σ_z² - σ_x*σ_y - σ_y*σ_z - σ_z*σ_x + 3*(τ_xy² + τ_yz² + τ_zx²))
  
  const term1 = sx * sx + sy * sy + sz * sz;
  const term2 = sx * sy + sy * sz + sz * sx;
  const term3 = 3 * (txy * txy + tyz * tyz + tzx * tzx);
  
  return Math.sqrt(term1 - term2 + term3);
}

/**
 * Simplified beam bending analysis
 * Assumes cantilever beam with point load at free end
 * @param {object} params - Analysis parameters
 * @returns {object} Analysis results
 */
export function analyzeSimplifiedBeam(params) {
  const {
    length,        // mm
    width,         // mm
    height,        // mm
    force,         // N
    youngsModulus, // Pa
    poissonsRatio,
    yieldStrength  // Pa
  } = params;
  
  // Convert mm to m for calculations
  const L = length / 1000;  // m
  const b = width / 1000;   // m
  const h = height / 1000;  // m
  const F = force;          // N
  const E = youngsModulus;  // Pa
  
  // Second moment of area (rectangular cross-section)
  const I = (b * Math.pow(h, 3)) / 12;  // m^4
  
  // Maximum deflection (at free end for cantilever)
  const maxDeflection = (F * Math.pow(L, 3)) / (3 * E * I);  // m
  const maxDeflection_mm = maxDeflection * 1000;  // mm
  
  // Maximum bending moment (at fixed end)
  const M_max = F * L;  // N·m
  
  // Maximum bending stress (at fixed end, outer fiber)
  const sigma_max = (M_max * (h / 2)) / I;  // Pa
  const sigma_max_MPa = sigma_max / 1e6;  // MPa
  
  // Safety factor
  const safetyFactor = yieldStrength / sigma_max;
  
  // Reaction force at fixed support
  const reactionForce = F;  // N
  const reactionMoment = M_max;  // N·m
  
  return {
    maxVonMisesStress_Pa: sigma_max,
    maxVonMisesStress_MPa: sigma_max_MPa,
    maxDisplacement_m: maxDeflection,
    maxDisplacement_mm: maxDeflection_mm,
    safetyFactor: safetyFactor,
    reactionForces: {
      force_N: reactionForce,
      moment_Nm: reactionMoment
    },
    status: safetyFactor > 1 ? 'SAFE' : 'FAILURE'
  };
}

/**
 * Simplified stress analysis for general geometry
 * Uses engineering approximations based on geometry type
 * @param {object} params - Analysis parameters
 * @returns {object} Analysis results
 */
export function analyzeStructure(params) {
  const {
    geometry,      // { type, parameters }
    material,      // { youngsModulus, poissonsRatio, yieldStrength, density }
    constraints,   // Array of constraint definitions
    loads          // Array of load definitions
  } = params;
  
  // Validate inputs
  if (!geometry || !material || !constraints || !loads) {
    throw new Error('Missing required parameters for structural analysis');
  }
  
  if (constraints.length === 0) {
    throw new Error('At least one fixed constraint is required');
  }
  
  if (loads.length === 0) {
    throw new Error('At least one load is required');
  }
  
  // Extract geometry parameters
  const { type, parameters: geomParams } = geometry;
  
  // Calculate total applied force
  let totalForce = 0;
  loads.forEach(load => {
    if (load.type === 'force') {
      totalForce += Math.abs(load.magnitude);
    } else if (load.type === 'pressure') {
      // Estimate area and convert pressure to force
      const area = estimateArea(type, geomParams);
      totalForce += Math.abs(load.magnitude * 1e6 * area);  // MPa to Pa, then * area
    }
  });
  
  // Perform analysis based on geometry type
  let results;
  
  switch (type.toLowerCase()) {
    case 'cube':
    case 'plate':
    case 'bracket':
    case 'beam':
      // Treat as beam in bending
      const beamLength = geomParams.depth || geomParams.length || geomParams.width || geomParams.size || 50;
      const beamWidth = geomParams.width || geomParams.size || 50;
      const beamHeight = geomParams.height || geomParams.thickness || geomParams.size || 50;
      
      results = analyzeSimplifiedBeam({
        length: beamLength,
        width: beamWidth,
        height: beamHeight,
        force: totalForce,
        youngsModulus: material.youngsModulus,
        poissonsRatio: material.poissonsRatio,
        yieldStrength: material.yieldStrength
      });
      break;
      
    case 'cylinder':
    case 'shaft':
      // Treat as beam in bending
      const radius = geomParams.radius || 25;
      const length = geomParams.height || geomParams.length || 100;
      results = analyzeSimplifiedBeam({
        length: length,
        width: radius * 2,
        height: radius * 2,
        force: totalForce,
        youngsModulus: material.youngsModulus,
        poissonsRatio: material.poissonsRatio,
        yieldStrength: material.yieldStrength
      });
      break;
      
    default:
      // Generic analysis
      results = analyzeSimplifiedBeam({
        length: 50,
        width: 10,
        height: 50,
        force: totalForce,
        youngsModulus: material.youngsModulus,
        poissonsRatio: material.poissonsRatio,
        yieldStrength: material.yieldStrength
      });
  }
  
  // Generate stress distribution (simplified)
  const stressDistribution = generateStressDistribution(
    type,
    geomParams,
    results.maxVonMisesStress_Pa,
    constraints,
    loads
  );
  
  // Generate displacement field (simplified)
  const displacementField = generateDisplacementField(
    type,
    geomParams,
    results.maxDisplacement_mm,
    constraints,
    loads
  );
  
  return {
    success: true,
    results: {
      maxVonMisesStress_MPa: results.maxVonMisesStress_MPa,
      maxDisplacement_mm: results.maxDisplacement_mm,
      safetyFactor: results.safetyFactor,
      status: results.status,
      reactionForces: results.reactionForces,
      stressDistribution: stressDistribution,
      displacementField: displacementField,
      analysisType: 'Linear Static',
      assumptions: [
        'Small deformation theory',
        'Linear elastic material',
        'Isotropic homogeneous material',
        'No contact or plasticity'
      ]
    }
  };
}

/**
 * Estimate surface area for pressure load conversion
 */
function estimateArea(type, params) {
  switch (type.toLowerCase()) {
    case 'cube':
    case 'plate':
    case 'bracket':
      const w = params.width || params.size || 50;
      const d = params.depth || params.thickness || 10;
      return (w * d) / 1e6;  // mm² to m²
      
    case 'cylinder':
    case 'shaft':
      const r = params.radius || 25;
      return (Math.PI * r * r) / 1e6;  // mm² to m²
      
    default:
      return 0.001;  // 1000 mm² default
  }
}

/**
 * Generate simplified stress distribution
 * Returns array of stress values at key points
 */
function generateStressDistribution(type, params, maxStress, constraints, loads) {
  // Simplified: linear distribution from constraint (0) to load point (max)
  const numPoints = 20;
  const distribution = [];
  
  for (let i = 0; i < numPoints; i++) {
    const ratio = i / (numPoints - 1);
    const stress = maxStress * ratio;  // Linear distribution
    distribution.push({
      position: ratio,
      stress_Pa: stress,
      stress_MPa: stress / 1e6
    });
  }
  
  return distribution;
}

/**
 * Generate simplified displacement field
 * Returns array of displacement values at key points
 */
function generateDisplacementField(type, params, maxDisplacement, constraints, loads) {
  // Simplified: quadratic distribution from constraint (0) to load point (max)
  const numPoints = 20;
  const field = [];
  
  for (let i = 0; i < numPoints; i++) {
    const ratio = i / (numPoints - 1);
    const displacement = maxDisplacement * ratio * ratio;  // Quadratic distribution
    field.push({
      position: ratio,
      displacement_mm: displacement,
      displacement_m: displacement / 1000
    });
  }
  
  return field;
}

/**
 * Validate analysis inputs
 */
export function validateAnalysisInputs(params) {
  const errors = [];
  
  if (!params.geometry) {
    errors.push('Geometry is required');
  }
  
  if (!params.material) {
    errors.push('Material properties are required');
  }
  
  if (!params.constraints || params.constraints.length === 0) {
    errors.push('At least one fixed constraint is required');
  }
  
  if (!params.loads || params.loads.length === 0) {
    errors.push('At least one load is required');
  }
  
  // Validate material properties
  if (params.material) {
    if (!params.material.youngsModulus || params.material.youngsModulus <= 0) {
      errors.push('Valid Young\'s Modulus is required');
    }
    if (!params.material.yieldStrength || params.material.yieldStrength <= 0) {
      errors.push('Valid Yield Strength is required');
    }
  }
  
  // Validate loads
  if (params.loads) {
    params.loads.forEach((load, index) => {
      if (!load.magnitude || load.magnitude === 0) {
        errors.push(`Load ${index + 1}: Magnitude must be non-zero`);
      }
      if (!load.direction || load.direction.length !== 3) {
        errors.push(`Load ${index + 1}: Direction vector [x, y, z] is required`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}
