const { calculateBodyType } = require('../services/bodyTypeService');

console.log('--- Testing Body Analysis Gender Logic ---');

// Test Case 1: Male
const maleInput = {
  gender: 'male',
  measurements: { shoulder: 46, chest: 100, waist: 85, hip: 95 }
};
const maleResult = calculateBodyType(maleInput);
console.log('Male Result:', maleResult);

// Test Case 2: Female
const femaleInput = {
  gender: 'female',
  measurements: { shoulder: 38, bust: 86, waist: 65, hip: 92 }
};
const femaleResult = calculateBodyType(femaleInput);
console.log('Female Result:', femaleResult);

if (maleResult.gender === 'male' && ['trapezoid', 'rectangle', 'triangle', 'oval', 'invertedTriangle'].includes(maleResult.bodyType)) {
  console.log('✅ Male test passed!');
} else {
  console.error('❌ Male test failed!');
}

if (femaleResult.gender === 'female' && ['hourglass', 'pear', 'apple', 'rectangle', 'invertedTriangle'].includes(femaleResult.bodyType)) {
  console.log('✅ Female test passed!');
} else {
  console.error('❌ Female test failed!');
}
