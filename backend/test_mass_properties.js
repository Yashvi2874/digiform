/**
 * Test script for mass properties calculation
 * Run with: node test_mass_properties.js
 */

// Test data
const testDesign = {
  type: 'cube',
  volume: 125000, // 50mm x 50mm x 50mm = 125,000 mm³
  surfaceArea: 15000,
  centerOfMass: { x: 0, y: 0, z: 0 },
  inertia: { Ixx: 1000, Iyy: 1000, Izz: 1000 }
};

const testMaterial = 'Structural Steel';
const expectedDensity = 7850; // kg/m³

// Calculate expected mass
const volume_m3 = testDesign.volume * 1e-9;
const expectedMass = expectedDensity * volume_m3;

console.log('=== Mass Properties Calculation Test ===\n');
console.log('Input:');
console.log(`  Volume: ${testDesign.volume.toLocaleString()} mm³`);
console.log(`  Material: ${testMaterial}`);
console.log(`  Density: ${expectedDensity.toLocaleString()} kg/m³`);
console.log('\nCalculation:');
console.log(`  Volume in m³: ${testDesign.volume} × 1e-9 = ${volume_m3} m³`);
console.log(`  Mass: ${expectedDensity} × ${volume_m3} = ${expectedMass} kg`);
console.log('\nExpected Output:');
console.log(`  Material: ${testMaterial}`);
console.log(`  Density: ${expectedDensity.toLocaleString()} kg/m³`);
console.log(`  Volume: ${testDesign.volume.toLocaleString()} mm³`);
console.log(`  Mass: ${expectedMass.toFixed(3)} kg`);
console.log(`  Center of Mass: (0.00, 0.00, 0.00) mm`);
console.log('\n=== Test Complete ===');
console.log('\nTo test with the API:');
console.log('1. Start the backend: npm start');
console.log('2. Send POST request to http://localhost:5000/api/simulate');
console.log('3. Body: { "design": {...}, "simulationType": "mass_properties", "material": "Structural Steel" }');
