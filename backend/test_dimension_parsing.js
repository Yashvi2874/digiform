/**
 * Test Dimension Parsing - Verify User Dimensions Are Respected
 * Run with: node test_dimension_parsing.js
 */

import { parseComponentDescription } from './nlpParser.js';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  DIMENSION PARSING TEST - USER INPUT ACCURACY                ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const testCases = [
  {
    input: 'Create a cylinder with 25mm radius and 100mm height',
    expected: { type: 'cylinder', radius: 25, height: 100 }
  },
  {
    input: 'Create an aluminum cylinder with 25mm radius and 100mm height',
    expected: { type: 'cylinder', radius: 25, height: 100, material: 'Aluminum' }
  },
  {
    input: 'Make a steel cylinder with 50mm diameter and 200mm length',
    expected: { type: 'cylinder', radius: 25, height: 200, material: 'Steel' }
  },
  {
    input: 'Create a sphere with 30mm radius',
    expected: { type: 'sphere', radius: 30 }
  },
  {
    input: 'Create a sphere with 60mm diameter',
    expected: { type: 'sphere', radius: 30 }
  },
  {
    input: 'Create a cone with 25mm radius and 50mm height',
    expected: { type: 'cone', baseRadius: 25, height: 50 }
  },
  {
    input: 'Create a cube with 50mm sides',
    expected: { type: 'cube', width: 50, height: 50, depth: 50 }
  },
  {
    input: 'Create a steel shaft with 12mm radius and 150mm length',
    expected: { type: 'shaft', radius: 12, length: 150, material: 'Steel' }
  }
];

let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  console.log(`\n${'='.repeat(65)}`);
  console.log(`TEST ${index + 1}: ${test.input}`);
  console.log('='.repeat(65));
  
  const result = parseComponentDescription(test.input);
  
  console.log('\n📥 INPUT:');
  console.log(`   "${test.input}"`);
  
  console.log('\n✅ EXPECTED:');
  console.log(`   Type: ${test.expected.type}`);
  if (test.expected.radius !== undefined) {
    console.log(`   Radius: ${test.expected.radius}mm`);
  }
  if (test.expected.baseRadius !== undefined) {
    console.log(`   Base Radius: ${test.expected.baseRadius}mm`);
  }
  if (test.expected.height !== undefined) {
    console.log(`   Height: ${test.expected.height}mm`);
  }
  if (test.expected.length !== undefined) {
    console.log(`   Length: ${test.expected.length}mm`);
  }
  if (test.expected.width !== undefined) {
    console.log(`   Width: ${test.expected.width}mm`);
  }
  if (test.expected.depth !== undefined) {
    console.log(`   Depth: ${test.expected.depth}mm`);
  }
  if (test.expected.material) {
    console.log(`   Material: ${test.expected.material}`);
  }
  
  console.log('\n📤 ACTUAL RESULT:');
  console.log(`   Type: ${result.type}`);
  console.log(`   Parameters:`, JSON.stringify(result.parameters, null, 6));
  console.log(`   Material: ${result.material}`);
  
  // Verify results
  let passed = true;
  const errors = [];
  
  if (result.type !== test.expected.type) {
    passed = false;
    errors.push(`Type mismatch: expected ${test.expected.type}, got ${result.type}`);
  }
  
  if (test.expected.radius !== undefined && result.parameters.radius !== test.expected.radius) {
    passed = false;
    errors.push(`Radius mismatch: expected ${test.expected.radius}mm, got ${result.parameters.radius}mm`);
  }
  
  if (test.expected.baseRadius !== undefined && result.parameters.baseRadius !== test.expected.baseRadius) {
    passed = false;
    errors.push(`Base Radius mismatch: expected ${test.expected.baseRadius}mm, got ${result.parameters.baseRadius}mm`);
  }
  
  if (test.expected.height !== undefined && result.parameters.height !== test.expected.height) {
    passed = false;
    errors.push(`Height mismatch: expected ${test.expected.height}mm, got ${result.parameters.height}mm`);
  }
  
  if (test.expected.length !== undefined && result.parameters.length !== test.expected.length) {
    passed = false;
    errors.push(`Length mismatch: expected ${test.expected.length}mm, got ${result.parameters.length}mm`);
  }
  
  if (test.expected.width !== undefined && result.parameters.width !== test.expected.width) {
    passed = false;
    errors.push(`Width mismatch: expected ${test.expected.width}mm, got ${result.parameters.width}mm`);
  }
  
  if (test.expected.material && result.material !== test.expected.material) {
    passed = false;
    errors.push(`Material mismatch: expected ${test.expected.material}, got ${result.material}`);
  }
  
  if (passed) {
    console.log('\n✅ RESULT: PASS');
    passCount++;
  } else {
    console.log('\n❌ RESULT: FAIL');
    errors.forEach(err => console.log(`   ❌ ${err}`));
    failCount++;
  }
});

console.log('\n\n' + '='.repeat(65));
console.log('TEST SUMMARY');
console.log('='.repeat(65));
console.log(`Total Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 ALL TESTS PASSED! User dimensions are being respected correctly.');
} else {
  console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.');
}

console.log('\n' + '='.repeat(65));
console.log('NEXT STEPS');
console.log('='.repeat(65));
console.log('1. If all tests pass, the backend is correctly parsing dimensions');
console.log('2. Test in the browser at http://localhost:3000');
console.log('3. Try: "Create a cylinder with 25mm radius and 100mm height"');
console.log('4. Verify the 3D model shows correct dimensions');
console.log('5. Run mass properties and verify calculations use correct values\n');
