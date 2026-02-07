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
  
  // Match patterns like "50mm", "50 mm", "2.5cm", "100x50mm"
  const mmPattern = /(\d+\.?\d*)\s*mm/gi;
  const cmPattern = /(\d+\.?\d*)\s*cm/gi;
  const inchPattern = /(\d+\.?\d*)\s*(?:inch|in|")/gi;
  const dimensionPattern = /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(?:x\s*(\d+\.?\d*))?\s*mm/gi;
  
  // Extract all mm values
  let match;
  const mmValues = [];
  while ((match = mmPattern.exec(text)) !== null) {
    mmValues.push(parseFloat(match[1]));
  }
  
  // Extract cm values and convert to mm
  while ((match = cmPattern.exec(text)) !== null) {
    mmValues.push(parseFloat(match[1]) * 10);
  }
  
  // Extract inch values and convert to mm
  while ((match = inchPattern.exec(text)) !== null) {
    mmValues.push(parseFloat(match[1]) * 25.4);
  }
  
  // Check for dimension patterns (WxHxD)
  const dimMatch = dimensionPattern.exec(text);
  if (dimMatch) {
    dimensions.width = parseFloat(dimMatch[1]);
    dimensions.height = parseFloat(dimMatch[2]);
    if (dimMatch[3]) dimensions.depth = parseFloat(dimMatch[3]);
  }
  
  // Extract teeth count for gears
  const teethMatch = /(\d+)\s*teeth/i.exec(text);
  if (teethMatch) {
    dimensions.teeth = parseInt(teethMatch[1]);
  }
  
  // Extract diameter
  const diameterMatch = /(?:diameter|dia\.?|d)\s*(?:of\s*)?(\d+\.?\d*)\s*mm/i.exec(text);
  if (diameterMatch) {
    dimensions.diameter = parseFloat(diameterMatch[1]);
  }
  
  // Extract length
  const lengthMatch = /(?:length|long)\s*(?:of\s*)?(\d+\.?\d*)\s*mm/i.exec(text);
  if (lengthMatch) {
    dimensions.length = parseFloat(lengthMatch[1]);
  }
  
  // Extract thickness
  const thicknessMatch = /(?:thickness|thick)\s*(?:of\s*)?(\d+\.?\d*)\s*mm/i.exec(text);
  if (thicknessMatch) {
    dimensions.thickness = parseFloat(thicknessMatch[1]);
  }
  
  // Store all extracted values
  dimensions.allValues = mmValues;
  
  return dimensions;
}

function buildParameters(type, dimensions, description) {
  const params = {};
  
  switch (type) {
    case 'gear':
      params.radius = dimensions.diameter ? dimensions.diameter / 2 : dimensions.allValues[0] / 2 || 25;
      params.thickness = dimensions.thickness || dimensions.allValues[1] || 10;
      params.teeth = dimensions.teeth || 20;
      params.module = params.radius * 2 / params.teeth;
      break;
      
    case 'shaft':
      params.radius = dimensions.diameter ? dimensions.diameter / 2 : dimensions.allValues[0] / 2 || 12.5;
      params.length = dimensions.length || dimensions.allValues[1] || 100;
      break;
      
    case 'bearing':
      params.outerRadius = dimensions.diameter ? dimensions.diameter / 2 : dimensions.allValues[0] / 2 || 30;
      params.innerRadius = params.outerRadius * 0.5;
      params.thickness = dimensions.thickness || dimensions.allValues[1] || 10;
      break;
      
    case 'bracket':
    case 'plate':
      params.width = dimensions.width || dimensions.allValues[0] || 50;
      params.height = dimensions.height || dimensions.allValues[1] || 50;
      params.depth = dimensions.depth || dimensions.thickness || dimensions.allValues[2] || 10;
      break;
      
    case 'bolt':
      params.radius = dimensions.diameter ? dimensions.diameter / 2 : dimensions.allValues[0] / 2 || 4;
      params.length = dimensions.length || dimensions.allValues[1] || 30;
      params.headRadius = params.radius * 1.5;
      params.headHeight = params.radius * 0.8;
      break;
      
    case 'cube':
      // For cube, use the first dimension value for all sides
      const cubeSize = dimensions.allValues[0] || 50;
      params.size = cubeSize;
      params.width = cubeSize;
      params.height = cubeSize;
      params.depth = cubeSize;
      break;
      
    case 'prism':
      // For prism, need base dimensions and height
      params.baseWidth = dimensions.width || dimensions.allValues[0] || 30;
      params.baseHeight = dimensions.height || dimensions.allValues[1] || 30;
      params.length = dimensions.length || dimensions.depth || dimensions.allValues[2] || 50;
      break;
      
    case 'cylinder':
      params.radius = dimensions.diameter ? dimensions.diameter / 2 : dimensions.allValues[0] / 2 || 25;
      params.height = dimensions.length || dimensions.height || dimensions.allValues[1] || 50;
      break;
      
    case 'sphere':
      params.radius = dimensions.diameter ? dimensions.diameter / 2 : dimensions.allValues[0] / 2 || 25;
      break;
      
    case 'cone':
      params.baseRadius = dimensions.diameter ? dimensions.diameter / 2 : dimensions.allValues[0] / 2 || 25;
      params.topRadius = dimensions.topDiameter ? dimensions.topDiameter / 2 : 0; // Default to point
      params.height = dimensions.length || dimensions.height || dimensions.allValues[1] || 50;
      break;
      
    case 'pyramid':
      params.baseWidth = dimensions.width || dimensions.allValues[0] || 30;
      params.baseDepth = dimensions.depth || dimensions.allValues[1] || 30;
      params.height = dimensions.height || dimensions.length || dimensions.allValues[2] || 40;
      break;
      
    default:
      // Generic solid - try to extract 3D dimensions
      params.width = dimensions.width || dimensions.allValues[0] || 50;
      params.height = dimensions.height || dimensions.allValues[1] || 50;
      params.depth = dimensions.depth || dimensions.allValues[2] || 10;
  }
  
  return params;
}
