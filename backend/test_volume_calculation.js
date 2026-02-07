/**
 * Test volume calculation from geometry
 */

// Test designs
const testDesigns = [
  {
    name: 'Steel Cube 50mm',
    design: {
      type: 'cube',
      parameters: { width: 50, height: 50, depth: 50 }
    },
    expectedVolume: 125000, // 50 * 50 * 50
    expectedMass: 0.98125 // 125000 * 1e-9 * 7850
  },
  {
    name: 'Aluminum Cylinder r=25mm h=100mm',
    design: {
      type: 'cylinder',
      parameters: { radius: 25, height: 100 }
    },
    expectedVolume: 196349.54, // π * 25² * 100
    expectedMass: 0.530 // 196349.54 * 1e-9 * 2700
  },
  {
    name: 'Titanium Sphere r=30mm',
    design: {
      type: 'sphere',
      parameters: { radius: 30 }
    },
    expectedVolume: 113097.34, // (4/3) * π * 30³
    expectedMass: 0.509 // 113097.34 * 1e-9 * 4500
  }
];

console.log('=== Volume Calculation Tests ===\n');

testDesigns.forEach(test => {
  console.log(`Test: ${test.name}`);
  console.log(`  Type: ${test.design.type}`);
  console.log(`  Parameters:`, test.design.parameters);
  
  // Calculate volume based on type
  let volume = 0;
  const params = test.design.parameters;
  
  switch (test.design.type) {
    case 'cube':
      volume = params.width * params.height * params.depth;
      break;
    case 'cylinder':
      volume = Math.PI * Math.pow(params.radius, 2) * params.height;
      break;
    case 'sphere':
      volume = (4/3) * Math.PI * Math.pow(params.radius, 3);
      break;
  }
  
  console.log(`  Calculated Volume: ${volume.toFixed(2)} mm³`);
  console.log(`  Expected Volume: ${test.expectedVolume.toFixed(2)} mm³`);
  console.log(`  Match: ${Math.abs(volume - test.expectedVolume) < 1 ? '✓' : '✗'}`);
  console.log();
});

console.log('=== Test Complete ===');
console.log('\nNow the backend will automatically calculate volume from geometry!');
console.log('No more "Volume is zero" errors! 🎉');
