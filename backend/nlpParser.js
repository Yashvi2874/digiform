export function parseComponentDescription(description) {
  const lower = description.toLowerCase();
  
  // Enhanced component type detection with better keyword matching
  let type = detectComponentType(lower);
  
  // Extract dimensions
  const dimensions = extractDimensions(description);
  
  // Detect material
  let material = detectMaterial(lower);
  
  // Determine complexity
  let complexity = detectComplexity(lower);
  
  // Build parameters based on type
  const parameters = buildParameters(type, dimensions, description);
  
  // Detect application
  let application = detectApplication(lower);
  
  return {
    type,
    description: description.trim(),
    complexity,
    parameters,
    material,
    application
  };
}

function detectComponentType(text) {
  // More comprehensive component type detection
  if (text.includes('gear')) return 'gear';
  if (text.includes('shaft') || text.includes('axle')) return 'shaft';
  if (text.includes('bearing')) return 'bearing';
  if (text.includes('bracket') || text.includes('mount') || text.includes('support')) return 'bracket';
  if (text.includes('plate') || text.includes('sheet')) return 'plate';
  if (text.includes('bolt') || text.includes('screw') || text.includes('fastener')) return 'bolt';
  if (text.includes('cube') || text.includes('cubic')) return 'cube';
  if (text.includes('prism') || text.includes('triangular') || text.includes('rectangular')) return 'prism';
  if (text.includes('cylinder') || text.includes('cylindrical')) return 'cylinder';
  if (text.includes('sphere') || text.includes('spherical') || text.includes('ball')) return 'sphere';
  if (text.includes('cone') || text.includes('conical')) return 'cone';
  if (text.includes('pyramid')) return 'pyramid';
  
  // Default to bracket for generic requests
  return 'bracket';
}

function detectMaterial(text) {
  if (text.includes('aluminum') || text.includes('aluminium')) return 'Aluminum';
  if (text.includes('titanium')) return 'Titanium';
  if (text.includes('brass')) return 'Brass';
  if (text.includes('copper')) return 'Copper';
  if (text.includes('plastic') || text.includes('polymer')) return 'Plastic';
  if (text.includes('wood')) return 'Wood';
  return 'Steel'; // Default
}

function detectComplexity(text) {
  if (text.includes('simple') || text.includes('basic')) return 'low';
  if (text.includes('complex') || text.includes('advanced') || text.includes('high-precision') || text.includes('intricate')) return 'high';
  return 'medium';
}

function detectApplication(text) {
  if (text.includes('high-torque') || text.includes('heavy-duty')) return 'High-torque application';
  if (text.includes('precision')) return 'Precision application';
  if (text.includes('automotive')) return 'Automotive';
  if (text.includes('aerospace')) return 'Aerospace';
  if (text.includes('medical')) return 'Medical device';
  if (text.includes('3d print') || text.includes('additive')) return '3D Printing';
  return 'General purpose';
}

function extractDimensions(text) {
  const dimensions = {};
  
  // Check for hollow/tube keyword
  dimensions.isHollow = /hollow|tube|pipe|tubular/i.test(text);
  
  // Extract wall thickness for hollow objects
  const wallThicknessMatch = /(?:wall\s*)?(?:thickness|thick)\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
  if (wallThicknessMatch) {
    let value = parseFloat(wallThicknessMatch[1]);
    const unit = wallThicknessMatch[2]?.toLowerCase();
    
    if (unit === 'cm' || unit === 'centimeter') {
      value *= 10;
    } else if (unit === 'inch' || unit === 'in') {
      value *= 25.4;
    }
    
    dimensions.wallThickness = value;
  }
  
  // Extract all values with units first
  const mmPattern = /(\d+\.?\d*)\s*(?:mm|millimeter)/gi;
  const cmPattern = /(\d+\.?\d*)\s*(?:cm|centimeter)/gi;
  const inchPattern = /(\d+\.?\d*)\s*(?:inch|in|")/gi;
  
  let match;
  const allValues = [];
  
  // Extract mm values
  mmPattern.lastIndex = 0;
  while ((match = mmPattern.exec(text)) !== null) {
    allValues.push({ 
      value: parseFloat(match[1]), 
      index: match.index,
      unit: 'mm'
    });
  }
  
  // Extract cm values and convert to mm
  cmPattern.lastIndex = 0;
  while ((match = cmPattern.exec(text)) !== null) {
    allValues.push({ 
      value: parseFloat(match[1]) * 10, 
      index: match.index,
      unit: 'cm',
      originalValue: parseFloat(match[1])
    });
  }
  
  // Extract inch values and convert to mm
  inchPattern.lastIndex = 0;
  while ((match = inchPattern.exec(text)) !== null) {
    allValues.push({ 
      value: parseFloat(match[1]) * 25.4, 
      index: match.index,
      unit: 'inch',
      originalValue: parseFloat(match[1])
    });
  }
  
  // Sort by index to maintain order
  allValues.sort((a, b) => a.index - b.index);
  dimensions.allValues = allValues.map(v => v.value);
  dimensions.allMatches = allValues;
  
  // Check for dimension patterns (WxHxD or W by H)
  const dimensionPattern = /(\d+\.?\d*)\s*(?:cm|mm)?\s*(?:x|by)\s*(\d+\.?\d*)\s*(?:cm|mm)?\s*(?:(?:x|by)\s*(\d+\.?\d*)\s*(?:cm|mm)?)?/gi;
  dimensionPattern.lastIndex = 0;
  const dimMatch = dimensionPattern.exec(text);
  if (dimMatch) {
    // Check if units are specified
    const hasUnit = /(?:cm|mm)/.test(dimMatch[0]);
    const isCm = /cm/.test(dimMatch[0]);
    const multiplier = isCm ? 10 : 1;
    
    dimensions.width = parseFloat(dimMatch[1]) * multiplier;
    dimensions.height = parseFloat(dimMatch[2]) * multiplier;
    if (dimMatch[3]) dimensions.depth = parseFloat(dimMatch[3]) * multiplier;
  }
  
  // Extract teeth count for gears
  const teethMatch = /(\d+)\s*teeth/i.exec(text);
  if (teethMatch) {
    dimensions.teeth = parseInt(teethMatch[1]);
  }
  
  // Extract RADIUS with unit support
  const radiusMatch = /(?:radius|r)\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
  if (radiusMatch) {
    let value = parseFloat(radiusMatch[1]);
    const unit = radiusMatch[2]?.toLowerCase();
    
    if (unit === 'cm' || unit === 'centimeter') {
      value *= 10; // Convert cm to mm
    } else if (unit === 'inch' || unit === 'in') {
      value *= 25.4; // Convert inch to mm
    }
    
    dimensions.radius = value;
  }
  
  // Extract DIAMETER with unit support
  const diameterMatch = /(?:diameter|dia\.?|d|ø)\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
  if (diameterMatch) {
    let value = parseFloat(diameterMatch[1]);
    const unit = diameterMatch[2]?.toLowerCase();
    
    if (unit === 'cm' || unit === 'centimeter') {
      value *= 10; // Convert cm to mm
    } else if (unit === 'inch' || unit === 'in') {
      value *= 25.4; // Convert inch to mm
    }
    
    dimensions.diameter = value;
  }
  
  // Extract LENGTH with unit support
  const lengthMatch = /(?:length|long)\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
  if (lengthMatch) {
    let value = parseFloat(lengthMatch[1]);
    const unit = lengthMatch[2]?.toLowerCase();
    
    if (unit === 'cm' || unit === 'centimeter') {
      value *= 10;
    } else if (unit === 'inch' || unit === 'in') {
      value *= 25.4;
    }
    
    dimensions.length = value;
  }
  
  // Extract THICKNESS with unit support
  const thicknessMatch = /(?:thickness|thick)\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
  if (thicknessMatch) {
    let value = parseFloat(thicknessMatch[1]);
    const unit = thicknessMatch[2]?.toLowerCase();
    
    if (unit === 'cm' || unit === 'centimeter') {
      value *= 10;
    } else if (unit === 'inch' || unit === 'in') {
      value *= 25.4;
    }
    
    dimensions.thickness = value;
  }
  
  // Extract WIDTH with unit support
  const widthMatch = /(?:width|wide)\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
  if (widthMatch) {
    let value = parseFloat(widthMatch[1]);
    const unit = widthMatch[2]?.toLowerCase();
    
    if (unit === 'cm' || unit === 'centimeter') {
      value *= 10;
    } else if (unit === 'inch' || unit === 'in') {
      value *= 25.4;
    }
    
    dimensions.width = value;
  }
  
  // Extract HEIGHT with unit support
  const heightMatch = /(?:height|tall)\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
  if (heightMatch) {
    let value = parseFloat(heightMatch[1]);
    const unit = heightMatch[2]?.toLowerCase();
    
    if (unit === 'cm' || unit === 'centimeter') {
      value *= 10;
    } else if (unit === 'inch' || unit === 'in') {
      value *= 25.4;
    }
    
    dimensions.height = value;
  }
  
  return dimensions;
}

function buildParameters(type, dimensions, description) {
  const params = {};
  
  switch (type) {
    case 'gear':
      // Prioritize explicitly named dimensions
      if (dimensions.radius) {
        // Radius explicitly specified
        params.radius = dimensions.radius;
      } else if (dimensions.diameter) {
        // Diameter specified, convert to radius
        params.radius = dimensions.diameter / 2;
      } else if (dimensions.allValues && dimensions.allValues.length > 0) {
        // Use first value as diameter, convert to radius
        params.radius = dimensions.allValues[0] / 2;
      } else {
        // Default
        params.radius = 25;
      }
      
      if (dimensions.thickness) {
        params.thickness = dimensions.thickness;
      } else if (dimensions.allValues && dimensions.allValues.length > 1) {
        params.thickness = dimensions.allValues[1];
      } else {
        params.thickness = 10;
      }
      
      params.teeth = dimensions.teeth || 20;
      params.module = params.radius * 2 / params.teeth;
      break;
      
    case 'shaft':
      if (dimensions.radius) {
        // Radius explicitly specified
        params.radius = dimensions.radius;
      } else if (dimensions.diameter) {
        // Diameter specified
        params.radius = dimensions.diameter / 2;
      } else if (dimensions.allValues && dimensions.allValues.length > 0) {
        params.radius = dimensions.allValues[0] / 2;
      } else {
        params.radius = 12.5;
      }
      
      if (dimensions.length) {
        params.length = dimensions.length;
      } else if (dimensions.allValues && dimensions.allValues.length > 1) {
        params.length = dimensions.allValues[1];
      } else {
        params.length = 100;
      }
      break;
      
    case 'bearing':
      if (dimensions.diameter) {
        params.outerRadius = dimensions.diameter / 2;
      } else if (dimensions.allValues.length > 0) {
        params.outerRadius = dimensions.allValues[0] / 2;
      } else {
        params.outerRadius = 30;
      }
      
      params.innerRadius = params.outerRadius * 0.5;
      
      if (dimensions.thickness) {
        params.thickness = dimensions.thickness;
      } else if (dimensions.allValues.length > 1) {
        params.thickness = dimensions.allValues[1];
      } else {
        params.thickness = 10;
      }
      break;
      
    case 'bracket':
    case 'plate':
      // Prioritize explicitly named dimensions
      if (dimensions.width) {
        params.width = dimensions.width;
      } else if (dimensions.allValues.length > 0) {
        params.width = dimensions.allValues[0];
      } else {
        params.width = 50;
      }
      
      if (dimensions.height) {
        params.height = dimensions.height;
      } else if (dimensions.allValues.length > 1) {
        params.height = dimensions.allValues[1];
      } else {
        params.height = 50;
      }
      
      if (dimensions.depth) {
        params.depth = dimensions.depth;
      } else if (dimensions.thickness) {
        params.depth = dimensions.thickness;
      } else if (dimensions.allValues.length > 2) {
        params.depth = dimensions.allValues[2];
      } else {
        params.depth = 10;
      }
      break;
      
    case 'bolt':
      if (dimensions.diameter) {
        params.radius = dimensions.diameter / 2;
      } else if (dimensions.allValues.length > 0) {
        params.radius = dimensions.allValues[0] / 2;
      } else {
        params.radius = 4;
      }
      
      if (dimensions.length) {
        params.length = dimensions.length;
      } else if (dimensions.allValues.length > 1) {
        params.length = dimensions.allValues[1];
      } else {
        params.length = 30;
      }
      
      params.headRadius = params.radius * 1.5;
      params.headHeight = params.radius * 0.8;
      break;
      
    case 'cube':
      // Check if multiple dimensions are specified (making it a rectangular box)
      if (dimensions.width && dimensions.height) {
        // User specified width and height - create rectangular box
        params.width = dimensions.width;
        params.height = dimensions.height;
        params.depth = dimensions.depth || dimensions.width; // Use depth if specified, otherwise match width
      } else if (dimensions.allValues.length >= 2) {
        // "X by Y" pattern - create rectangular box
        params.width = dimensions.allValues[0];
        params.height = dimensions.allValues[1];
        params.depth = dimensions.allValues[2] || dimensions.allValues[0]; // Use third value or match first
      } else if (dimensions.width) {
        // Only one dimension - true cube
        params.width = dimensions.width;
        params.height = dimensions.width;
        params.depth = dimensions.width;
      } else if (dimensions.allValues.length > 0) {
        // Only one value - true cube
        const cubeSize = dimensions.allValues[0];
        params.width = cubeSize;
        params.height = cubeSize;
        params.depth = cubeSize;
      } else {
        // Default cube
        params.width = 50;
        params.height = 50;
        params.depth = 50;
      }
      
      params.size = params.width; // Keep for backward compatibility
      break;
      
    case 'prism':
      if (dimensions.width) {
        params.baseWidth = dimensions.width;
      } else if (dimensions.allValues.length > 0) {
        params.baseWidth = dimensions.allValues[0];
      } else {
        params.baseWidth = 30;
      }
      
      if (dimensions.height) {
        params.baseHeight = dimensions.height;
      } else if (dimensions.allValues.length > 1) {
        params.baseHeight = dimensions.allValues[1];
      } else {
        params.baseHeight = 30;
      }
      
      if (dimensions.length) {
        params.length = dimensions.length;
      } else if (dimensions.depth) {
        params.length = dimensions.depth;
      } else if (dimensions.allValues.length > 2) {
        params.length = dimensions.allValues[2];
      } else {
        params.length = 50;
      }
      break;
      
    case 'cylinder':
      if (dimensions.diameter) {
        params.radius = dimensions.diameter / 2;
      } else if (dimensions.allValues.length > 0) {
        params.radius = dimensions.allValues[0] / 2;
      } else {
        params.radius = 25;
      }
      
      if (dimensions.length) {
        params.height = dimensions.length;
      } else if (dimensions.height) {
        params.height = dimensions.height;
      } else if (dimensions.allValues.length > 1) {
        params.height = dimensions.allValues[1];
      } else {
        params.height = 50;
      }
      
      // Handle hollow cylinder
      if (dimensions.isHollow) {
        params.isHollow = true;
        
        // Calculate inner radius based on wall thickness
        if (dimensions.wallThickness) {
          params.wallThickness = dimensions.wallThickness;
          params.innerRadius = params.radius - dimensions.wallThickness;
        } else {
          // Default wall thickness is 10% of outer radius
          params.wallThickness = params.radius * 0.1;
          params.innerRadius = params.radius * 0.9;
        }
        
        // Ensure inner radius is positive
        if (params.innerRadius <= 0) {
          params.innerRadius = params.radius * 0.5;
          params.wallThickness = params.radius * 0.5;
        }
      }
      break;
      
    case 'sphere':
      if (dimensions.diameter) {
        params.radius = dimensions.diameter / 2;
      } else if (dimensions.allValues.length > 0) {
        params.radius = dimensions.allValues[0] / 2;
      } else {
        params.radius = 25;
      }
      break;
      
    case 'cone':
      if (dimensions.diameter) {
        params.baseRadius = dimensions.diameter / 2;
      } else if (dimensions.allValues.length > 0) {
        params.baseRadius = dimensions.allValues[0] / 2;
      } else {
        params.baseRadius = 25;
      }
      
      params.topRadius = dimensions.topDiameter ? dimensions.topDiameter / 2 : 0;
      
      if (dimensions.length) {
        params.height = dimensions.length;
      } else if (dimensions.height) {
        params.height = dimensions.height;
      } else if (dimensions.allValues.length > 1) {
        params.height = dimensions.allValues[1];
      } else {
        params.height = 50;
      }
      break;
      
    case 'pyramid':
      if (dimensions.width) {
        params.baseWidth = dimensions.width;
      } else if (dimensions.allValues.length > 0) {
        params.baseWidth = dimensions.allValues[0];
      } else {
        params.baseWidth = 30;
      }
      
      if (dimensions.depth) {
        params.baseDepth = dimensions.depth;
      } else if (dimensions.allValues.length > 1) {
        params.baseDepth = dimensions.allValues[1];
      } else {
        params.baseDepth = 30;
      }
      
      if (dimensions.height) {
        params.height = dimensions.height;
      } else if (dimensions.length) {
        params.height = dimensions.length;
      } else if (dimensions.allValues.length > 2) {
        params.height = dimensions.allValues[2];
      } else {
        params.height = 40;
      }
      break;
      
    default:
      // Generic solid - try to extract 3D dimensions
      if (dimensions.width) {
        params.width = dimensions.width;
      } else if (dimensions.allValues.length > 0) {
        params.width = dimensions.allValues[0];
      } else {
        params.width = 50;
      }
      
      if (dimensions.height) {
        params.height = dimensions.height;
      } else if (dimensions.allValues.length > 1) {
        params.height = dimensions.allValues[1];
      } else {
        params.height = 50;
      }
      
      if (dimensions.depth) {
        params.depth = dimensions.depth;
      } else if (dimensions.allValues.length > 2) {
        params.depth = dimensions.allValues[2];
      } else {
        params.depth = 10;
      }
  }
  
  return params;
}
