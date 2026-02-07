/**
 * Debug Dimension Parsing
 */

import { parseComponentDescription } from './nlpParser.js';

const testInput = 'Create a cylinder with 25mm radius and 100mm height';

console.log('Testing:', testInput);
console.log('\n');

const result = parseComponentDescription(testInput);

console.log('Full Result:');
console.log(JSON.stringify(result, null, 2));
