export function parseComponentDescription(description) {
  const lower = description.toLowerCase();
  
  // Detect component type
  let type = 'bracket';
  if (lower.includes('gear')) type = 'gear';
  else if (lower.includes('shaft')) type = 'shaft';
  else if (lower.includes('bearing')) type = 'bearing';
  else if (lower.includes('bracket') || lower.includes('mount')) type = 'bracket';
  else if (lower.includes('plate')) type = 'plate';
  else if (lower.includes('bolt') || lower.includes('screw')) type = 'bolt';
  
  // Extract dimensions
  const dimensions = extractDimensions(description);
  
  // Detect material
  let material = 'Steel';
  if (lower.includes('aluminum') || lower.includes('aluminium')) material = 'Aluminum';
  else if (lower.includes('titanium')) material = 'Titanium';
  else if (lower.includes('brass')) material = 'Brass';
  else if (lower.includes('copper')) material = 'Copper';
  
  // Determine complexity
  let complexity = 'medium';
  if (lower.includes('simple') || lower.includes('basic')) complexity = 'low';
  else if (lower.includes('complex') || lower.includes('advanced') || lower.includes('high-precision')) complexity = 'high';
  
  // Build parameters based on type
  const parameters = buildParameters(type, dimensions, description);
  
  // Detect application
  let application = 'General purpose';
  if (lower.includes('high-torque') || lower.includes('heavy-duty')) application = 'High-torque application';
  else if (lower.includes('precision')) application = 'Precision application';
  else if (lower.includes('automotive')) application = 'Automotive';
  else if (lower.includes('aerospace')) application = 'Aerospace';
  
  return {
    type,
    description: description.trim(),
    complexity,
    parameters,
    material,
    application
  };
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
      
    default:
      params.width = dimensions.width || dimensions.allValues[0] || 50;
      params.height = dimensions.height || dimensions.allValues[1] || 50;
      params.depth = dimensions.depth || dimensions.allValues[2] || 10;
  }
  
  return params;
}
