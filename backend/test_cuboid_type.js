/**
 * Test what type is assigned to cuboid requests
 */

import { parseComponentDescription } from './nlpParser.js';

const testInputs = [
  'Create a steel cube with 50mm sides',
  'Create a cuboid 60mm x 40mm x 30mm',
  'Create a rectangular block 80mm x 60mm x 20mm',
  'Create a solid box 50mm x 50mm x 50mm',
  'Create a steel plate 100mm x 50mm x 10mm',
  'Create a mounting bracket 80mm x 60mm x 8mm',
  'Make a cube',
  'Create a rectangular prism',
  'Create a solid cuboid'
];

console.log('Testing Type Detection for Cuboid Requests\n');
console.log('='.repeat(70));

testInputs.forEach(input => {
  const result = parseComponentDescription(input);
  console.log(`\nInput: "${input}"`);
  console.log(`Type: ${result.type}`);
  console.log(`Parameters:`, JSON.stringify(result.parameters, null, 2));
});

console.log('\n' + '='.repeat(70));
console.log('\nExpected Types:');
console.log('- "cube" or "plate" → Should be SOLID (no holes)');
console.log('- "bracket" → Should have mounting holes');
console.log('- "prism" → Triangular prism (different shape)');
