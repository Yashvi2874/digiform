import { parseComponentDescription } from './nlpParser.js';

export function processUserMessage(message, context = {}) {
  const lowerMessage = message.toLowerCase();
  
  // Check if it's a design request
  if (isDesignRequest(lowerMessage)) {
    const design = parseComponentDescription(message);
    return {
      type: 'design_proposal',
      message: generateDesignProposal(design),
      design,
      needsApproval: true
    };
  }
  
  // Check if it's a modification request
  if (isModificationRequest(lowerMessage) && context.lastDesign) {
    const modifications = extractModifications(message, context.lastDesign);
    const updatedDesign = applyModifications(context.lastDesign, modifications);
    return {
      type: 'design_modification',
      message: generateModificationMessage(modifications),
      design: updatedDesign,
      needsApproval: true
    };
  }
  
  // Check if it's a question
  if (isQuestion(lowerMessage)) {
    return {
      type: 'answer',
      message: answerQuestion(message, context),
      needsApproval: false
    };
  }
  
  // General conversation
  return {
    type: 'conversation',
    message: generateConversationalResponse(message, context),
    needsApproval: false
  };
}

function isDesignRequest(message) {
  const designKeywords = [
    'design', 'create', 'make', 'build', 'generate',
    'gear', 'shaft', 'bearing', 'bracket', 'bolt', 'plate'
  ];
  return designKeywords.some(keyword => message.includes(keyword));
}

function isModificationRequest(message) {
  const modKeywords = [
    'change', 'modify', 'update', 'adjust', 'make it',
    'instead', 'different', 'bigger', 'smaller', 'thicker',
    'longer', 'shorter', 'wider', 'narrower'
  ];
  return modKeywords.some(keyword => message.includes(keyword));
}

function isQuestion(message) {
  const questionWords = ['what', 'how', 'why', 'when', 'where', 'can', 'could', 'would', 'should'];
  return questionWords.some(word => message.startsWith(word)) || message.includes('?');
}

function generateDesignProposal(design) {
  // Extract user-defined dimensions
  const userDimensions = [];
  if (design.parameters) {
    Object.entries(design.parameters).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0) {
        userDimensions.push(`• ${key}: ${value}mm`);
      }
    });
  }
  
  // Add feature checklist if available
  let featureInfo = '';
  if (design.featureChecklist && design.featureChecklist.length > 0) {
    featureInfo = `\n\n**Features Included:**
${design.featureChecklist.map(item => `✓ ${item.replace('✓ ', '')}`).join('\n')}`;
  }
  
  // Add properties if available
  let propertyInfo = '';
  if (design.properties) {
    propertyInfo = `\n\n**Engineering Properties:**
• Volume: ${design.properties.volume} mm³
• Mass: ${design.properties.mass} g
• Material: ${design.properties.material}`;
  }
  
  return `I've analyzed your requirements and created a design proposal based on your specifications:

**Component Type:** ${design.type}
**Material:** ${design.material}
**Complexity:** ${design.complexity}
**Application:** ${design.application}
${userDimensions.length > 0 ? `\n**Your Dimensions:**\n${userDimensions.join('\n')}` : ''}
${featureInfo}
${propertyInfo}

I've used the exact dimensions you specified. Would you like me to:
1. **Approve** this design and proceed to 3D visualization
2. **Modify** any parameters
3. **Ask questions** about specific aspects

Please confirm your approval or let me know what you'd like to change.`;
}

function extractModifications(message, currentDesign) {
  const modifications = {};
  const lowerMessage = message.toLowerCase();
  
  // Material changes
  const materials = ['steel', 'aluminum', 'titanium', 'brass', 'copper'];
  materials.forEach(material => {
    if (lowerMessage.includes(material)) {
      modifications.material = material.charAt(0).toUpperCase() + material.slice(1);
    }
  });
  
  // Size modifications
  if (lowerMessage.includes('bigger') || lowerMessage.includes('larger')) {
    modifications.scale = 1.5;
  } else if (lowerMessage.includes('smaller')) {
    modifications.scale = 0.7;
  }
  
  // Specific dimension changes
  const dimensionMatch = /(\d+)\s*mm/i.exec(message);
  if (dimensionMatch) {
    const value = parseFloat(dimensionMatch[1]);
    if (lowerMessage.includes('diameter') || lowerMessage.includes('radius')) {
      modifications.radius = value / 2;
    } else if (lowerMessage.includes('length')) {
      modifications.length = value;
    } else if (lowerMessage.includes('thickness')) {
      modifications.thickness = value;
    }
  }
  
  return modifications;
}

function applyModifications(design, modifications) {
  const updated = { 
    ...design,
    type: design.type,
    description: design.description,
    material: design.material,
    complexity: design.complexity,
    parameters: { ...design.parameters }
  };
  
  if (modifications.material) {
    updated.material = modifications.material;
  }
  
  if (modifications.scale) {
    updated.parameters = Object.entries(updated.parameters).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'number' ? value * modifications.scale : value;
      return acc;
    }, {});
  }
  
  if (modifications.radius !== undefined) {
    updated.parameters.radius = modifications.radius;
  }
  if (modifications.length !== undefined) {
    updated.parameters.length = modifications.length;
  }
  if (modifications.thickness !== undefined) {
    updated.parameters.thickness = modifications.thickness;
  }
  
  updated.description = `Modified ${design.type} - ${Object.keys(modifications).join(', ')} changed`;
  
  return updated;
}

function generateModificationMessage(modifications) {
  const changes = [];
  
  if (modifications.material) {
    changes.push(`Changed material to ${modifications.material}`);
  }
  if (modifications.scale) {
    changes.push(`Scaled dimensions by ${modifications.scale}x`);
  }
  if (modifications.radius) {
    changes.push(`Updated radius to ${modifications.radius}mm`);
  }
  if (modifications.length) {
    changes.push(`Updated length to ${modifications.length}mm`);
  }
  if (modifications.thickness) {
    changes.push(`Updated thickness to ${modifications.thickness}mm`);
  }
  
  return `I've updated the design with the following changes:\n\n${changes.map(c => `• ${c}`).join('\n')}\n\nDoes this look better?`;
}

function answerQuestion(question, context) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('material') || lowerQuestion.includes('what material')) {
    return `I can work with several materials:
• **Steel** - Strong, durable, cost-effective (Yield: 250 MPa)
• **Aluminum** - Lightweight, corrosion-resistant (Yield: 95 MPa)
• **Titanium** - High strength-to-weight ratio (Yield: 880 MPa)
• **Brass** - Good machinability, decorative (Yield: 200 MPa)
• **Copper** - Excellent conductivity (Yield: 70 MPa)

Which material would you like to use?`;
  }
  
  if (lowerQuestion.includes('export') || lowerQuestion.includes('download')) {
    return `You can export your design in multiple formats:
• **STL** - For 3D printing
• **GLB** - For web, AR/VR, Blender
• **OBJ** - Universal 3D format
• **STEP** - For CAD software (SolidWorks, Fusion 360)

Just click the export button in the Analysis panel!`;
  }
  
  if (lowerQuestion.includes('simulation') || lowerQuestion.includes('analysis')) {
    return `To run a simulation:
1. Approve your design first
2. Click "Run Simulation" in the Analysis panel
3. Enter the load conditions (force and area)
4. I'll calculate stress, safety factors, and show a heatmap

The simulation will help you understand if your design can handle the expected loads.`;
  }
  
  return `I'm here to help you design industrial components! You can:
• Describe a component you need
• Ask me to modify existing designs
• Request simulations and analysis
• Export your designs in various formats

What would you like to do?`;
}

function generateConversationalResponse(message, context) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! I'm your DigiForm AI assistant. I can help you design industrial components like gears, shafts, bearings, and brackets. What would you like to create today?`;
  }
  
  if (lowerMessage.includes('thank')) {
    return `You're welcome! Is there anything else you'd like me to help you with?`;
  }
  
  if (lowerMessage.includes('help')) {
    return `I can help you with:
• **Designing components** - Just describe what you need
• **Modifying designs** - Tell me what to change
• **Running simulations** - Analyze stress and safety
• **Exporting models** - Download in STL, GLB, OBJ, or STEP

Try saying something like "Design a gear with 20 teeth, 50mm diameter"`;
  }
  
  return `I understand you want to work on something. Could you describe the component you'd like to design, or ask me a specific question about the design process?`;
}
