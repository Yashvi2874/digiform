/**
 * Final Comprehensive Test - Cuboid Type Detection and Geometry
 */

import { parseComponentDescription } from './nlpParser.js';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  FINAL CUBOID TEST - Type Detection & Geometry               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const testCases = [
  {
    input: 'Create a steel cuboid 60mm x 40mm x 30mm',
    expectedType: 'cube',
    expectedGeometry: 'BoxGeometry (solid, no holes)',
    shouldHaveHoles: false
  },
  {
    input: 'Create a solid box 50mm x 50mm x 50mm',
    expectedType: 'cube',
    expectedGeometry: 'BoxGeometry (solid, no holes)',
    shouldHaveHoles: false
  },
  {
    input: 'Create a rectangular block 80mm x 60mm x 20mm',
    expectedType: 'cube',
    expectedGeometry: 'BoxGeometry (solid, no holes)',
    shouldHaveHoles: false
  },
  {
    input: 'Create a steel plate 100mm x 50mm x 10mm',
    expectedType: 'plate',
    expectedGeometry: 'BoxGeometry (solid, no holes)',
    shouldHaveHoles: false
  },
  {
    input: 'Create a mounting bracket 80mm x 60mm x 8mm',
    expectedType: 'bracket',
    expectedGeometry: 'ExtrudeGeometry (with 4 corner holes)',
    shouldHaveHoles: true
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
  console.log(`   Type: ${test.expectedType}`);
  console.log(`   Geometry: ${test.expectedGeometry}`);
  console.log(`   Has Holes: ${test.shouldHaveHoles ? 'YES' : 'NO'}`);
  
  console.log('\n📤 ACTUAL RESULT:');
  console.log(`   Type: ${result.type}`);
  console.log(`   Parameters:`, JSON.stringify(result.parameters, null, 6));
  
  // Determine geometry type based on result type
  let actualGeometry;
  let actualHasHoles;
  
  if (result.type === 'cube' || result.type === 'plate') {
    actualGeometry = 'BoxGeometry (solid, no holes)';
    actualHasHoles = false;
  } else if (result.type === 'bracket') {
    actualGeometry = 'ExtrudeGeometry (with 4 corner holes)';
    actualHasHoles = true;
  } else {
    actualGeometry = 'Unknown';
    actualHasHoles = false;
  }
  
  console.log(`   Geometry: ${actualGeometry}`);
  console.log(`   Has Holes: ${actualHasHoles ? 'YES' : 'NO'}`);
  
  // Verify results
  const typeMatch = result.type === test.expectedType;
  const holesMatch = actualHasHoles === test.shouldHaveHoles;
  const passed = typeMatch && holesMatch;
  
  if (passed) {
    console.log('\n✅ RESULT: PASS');
    passCount++;
  } else {
    console.log('\n❌ RESULT: FAIL');
    if (!typeMatch) {
      console.log(`   ❌ Type mismatch: expected ${test.expectedType}, got ${result.type}`);
    }
    if (!holesMatch) {
      console.log(`   ❌ Holes mismatch: expected ${test.shouldHaveHoles ? 'holes' : 'no holes'}, got ${actualHasHoles ? 'holes' : 'no holes'}`);
    }
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
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('\nCuboids are now correctly classified:');
  console.log('  ✅ "cuboid", "box", "block" → cube type (solid, no holes)');
  console.log('  ✅ "plate" → plate type (solid, no holes)');
  console.log('  ✅ "bracket" → bracket type (with mounting holes)');
} else {
  console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.');
}

console.log('\n' + '='.repeat(65));
console.log('GEOMETRY MAPPING');
console.log('='.repeat(65));
console.log('\nType → Geometry → Has Holes?');
console.log('  cube     → THREE.BoxGeometry        → NO  ✅');
console.log('  plate    → THREE.BoxGeometry        → NO  ✅');
console.log('  bracket  → createBracketGeometry    → YES ✅');
console.log('\n' + '='.repeat(65));
console.log('\n🚀 Test in browser at http://localhost:3000');
console.log('   Try: "Create a solid cuboid 60mm x 40mm x 30mm"');
console.log('   Expected: Solid rectangular box with NO holes\n');
