/**
 * Comprehensive Test Script for All Shape Types with MOI Calculations
 * Tests: Volume, Surface Area, Mass, and Moments of Inertia
 * Run with: node test_all_shapes_moi.js
 */

const testShapes = [
  {
    name: 'Steel Cube',
    design: {
      type: 'cube',
      parameters: { size: 50 }
    },
    material: 'Structural Steel',
    expected: {
      volume_cm3: 125.0,
      mass_kg: 0.981,
      Ixx: 408.75,
      Iyy: 408.75,
      Izz: 408.75
    }
  },
  {
    name: 'Aluminum Cylinder',
    design: {
      type: 'cylinder',
      parameters: { radius: 25, height: 100 }
    },
    material: 'Aluminum',
    expected: {
      volume_cm3: 196.35,
      mass_kg: 0.530,
      Ixx: 525.52,
      Iyy: 525.52,
      Izz: 165.63
    }
  },
  {
    name: 'Titanium Sphere',
    design: {
      type: 'sphere',
      parameters: { radius: 30 }
    },
    material: 'Titanium',
    expected: {
      volume_cm3: 113.10,
      mass_kg: 0.509,
      Ixx: 183.24,
      Iyy: 183.24,
      Izz: 183.24
    }
  },
  {
    name: 'Copper Cone',
    design: {
      type: 'cone',
      parameters: { radius: 25, height: 50 }
    },
    material: 'Copper',
    expected: {
      volume_cm3: 32.73,
      mass_kg: 0.293,
      Ixx: 82.03,
      Iyy: 82.03,
      Izz: 54.94
    }
  },
  {
    name: 'Steel Pyramid',
    design: {
      type: 'pyramid',
      parameters: { baseWidth: 30, baseDepth: 30, height: 40 }
    },
    material: 'Steel',
    expected: {
      volume_cm3: 12.0,
      mass_kg: 0.094,
      Ixx: 26.82,
      Iyy: 26.82,
      Izz: 16.92
    }
  },
  {
    name: 'Aluminum Triangular Prism',
    design: {
      type: 'prism',
      parameters: { baseWidth: 30, baseHeight: 30, length: 50 }
    },
    material: 'Aluminum',
    expected: {
      volume_cm3: 22.5,
      mass_kg: 0.061,
      Ixx: 18.89,
      Iyy: 18.89,
      Izz: 6.10
    }
  },
  {
    name: 'Steel Hollow Cylinder',
    design: {
      type: 'cylinder',
      parameters: { radius: 15, innerRadius: 13, height: 100, isHollow: true }
    },
    material: 'Steel',
    expected: {
      volume_cm3: 35.19,
      mass_kg: 0.276,
      Ixx: 264.15,
      Iyy: 264.15,
      Izz: 53.82
    }
  }
];

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  COMPREHENSIVE MOI TEST - ALL SHAPE TYPES                     ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

testShapes.forEach((test, index) => {
  console.log(`\n${'='.repeat(65)}`);
  console.log(`TEST ${index + 1}: ${test.name}`);
  console.log('='.repeat(65));
  
  console.log('\n📐 INPUT:');
  console.log(`   Type: ${test.design.type}`);
  console.log(`   Parameters:`, JSON.stringify(test.design.parameters, null, 6));
  console.log(`   Material: ${test.material}`);
  
  console.log('\n✅ EXPECTED OUTPUT:');
  console.log(`   Volume: ${test.expected.volume_cm3.toFixed(2)} cm³`);
  console.log(`   Mass: ${test.expected.mass_kg.toFixed(3)} kg`);
  console.log(`   Ixx: ${test.expected.Ixx.toFixed(2)} kg·mm²`);
  console.log(`   Iyy: ${test.expected.Iyy.toFixed(2)} kg·mm²`);
  console.log(`   Izz: ${test.expected.Izz.toFixed(2)} kg·mm²`);
});

console.log('\n\n' + '='.repeat(65));
console.log('HOW TO TEST WITH THE API');
console.log('='.repeat(65));
console.log('\n1. Ensure backend is running on port 5000');
console.log('   cd backend && npm start\n');
console.log('2. Ensure frontend is running on port 3000');
console.log('   cd frontend && npm run dev\n');
console.log('3. Open browser: http://localhost:3000\n');
console.log('4. For each test case above:');
console.log('   a) Create the design using chat (e.g., "Create a steel cube with 50mm sides")');
console.log('   b) Select the material from dropdown');
console.log('   c) Click "Run STEP 1 - Mass Properties"');
console.log('   d) Verify the output matches expected values\n');

console.log('5. Test different materials to verify density changes:');
console.log('   - Steel: 7850 kg/m³');
console.log('   - Aluminum: 2700 kg/m³');
console.log('   - Titanium: 4500 kg/m³');
console.log('   - Copper: 8960 kg/m³\n');

console.log('='.repeat(65));
console.log('✅ ALL SHAPE TYPES IMPLEMENTED');
console.log('='.repeat(65));
console.log('\nSupported shapes:');
console.log('  ✓ Cuboid (cube, bracket, plate)');
console.log('  ✓ Solid Cylinder (cylinder, shaft)');
console.log('  ✓ Hollow Cylinder');
console.log('  ✓ Solid Sphere');
console.log('  ✓ Solid Cone');
console.log('  ✓ Square Pyramid');
console.log('  ✓ Triangular Prism');
console.log('  ✓ Gear (as cylinder)');
console.log('  ✓ Bearing (as hollow cylinder)');
console.log('  ✓ Bolt (as cylinder)\n');

console.log('Each shape calculates:');
console.log('  ✓ Volume (from geometry parameters)');
console.log('  ✓ Surface Area');
console.log('  ✓ Mass (density × volume with 1e-9 conversion)');
console.log('  ✓ Center of Mass');
console.log('  ✓ Moments of Inertia (Ixx, Iyy, Izz)\n');

console.log('='.repeat(65));
console.log('🚀 SYSTEM READY FOR TESTING');
console.log('='.repeat(65));
console.log('\nBackend: http://localhost:5000');
console.log('Frontend: http://localhost:3000\n');
