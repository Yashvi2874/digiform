const text = "Create a cylinder with 25mm radius and 100mm height";

// Test radius regex
const radiusMatch = /\b(?:radius|r)\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
console.log('Radius match:', radiusMatch);

// Try simpler pattern
const radiusMatch2 = /(\d+\.?\d*)\s*(?:mm|cm)?\s+radius/i.exec(text);
console.log('Radius match 2:', radiusMatch2);

// Try pattern that looks for "radius" first
const radiusMatch3 = /radius\s*(?:of\s*)?(?:is\s*)?(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?/i.exec(text);
console.log('Radius match 3:', radiusMatch3);

// Try pattern that looks for number BEFORE radius
const radiusMatch4 = /(\d+\.?\d*)\s*(cm|mm|millimeter|centimeter|inch|in)?\s*radius/i.exec(text);
console.log('Radius match 4:', radiusMatch4);
