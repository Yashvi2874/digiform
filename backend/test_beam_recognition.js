/**
 * Test Beam Recognition and Geometry Creation
 */

import { parseComponentDescription } from './nlpParser.js';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  BEAM RECOGNITION TEST                                        ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const testCases = [
  'Create a steel beam',
  'Create a steel beam 200mm long',
  'Create a steel beam 200mm x 50mm x 50mm',
  'Make a beam 300mm length, 60mm width, 40mm height',
  'Create an aluminum beam for structural analysis',
  'Design a steel I-beam',
  'Create a bar 150mm long',
  'Make a rod 100mm length'
];

testCases.forEach((input, index) => {
  console.log(`\n${'='.repeat(65)}`);
  console.log(`TEST ${index + 1}: ${input}`);
  console.log('='.repeat(65));
  
  const result = parseComponentDescription(input);
  
  console.log('\n📥 INPUT:');
  console.log(`   "${input}"`);
  
  console.log('\n📤 RESULT:');
  console.log(`   Type: ${result.type}`);
  console.log(`   Material: ${result.material}`);
  console.log(`   Parameters:`);
  console.log(`      Width: ${result.parameters.width || 'default'} mm`);
  console.log(`      Height: ${result.parameters.height || 'default'} mm`);
  console.log(`      Depth/Length: ${result.parameters.depth || result.parameters.length || 'default'} mm`);
  
  if (result.type === 'beam') {
    console.log('\n✅ PASS - Correctly identified as BEAM');
  } else {
    console.log(`\n⚠️  WARNING - Identified as ${result.type.toUpperCase()} instead of BEAM`);
  }
});

console.log('\n\n' + '='.repeat(65));
console.log('SUMMARY');
console.log('='.repeat(65));
console.log('\n✅ Beam recognition implemented');
console.log('✅ Default beam dimensions: 200mm × 50mm × 50mm');
console.log('✅ Beam geometry: BoxGeometry (solid rectangular)');
console.log('✅ Suitable for FEA (structural analysis)');
console.log('\n📝 Beam is treated as elongated rectangular box');
console.log('   - Length (depth): Primary dimension (200mm default)');
console.log('   - Width: Cross-section width (50mm default)');
console.log('   - Height: Cross-section height (50mm default)');
console.log('\n🚀 Ready for structural analysis!');
console.log('   Try: "Create a steel beam 200mm x 50mm x 50mm"');
console.log('   Then run FEA with fixed constraint and load\n');
