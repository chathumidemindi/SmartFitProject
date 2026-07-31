const { calculateBodyType } = require('../services/bodyTypeService');
const { generateRecommendations } = require('../services/recommendationService');
const path = require('path');
const { readFile } = require('fs/promises');

async function runTests() {
  console.log('--- STARTING RECOMMENDATION & BODY TYPE ENGINE TESTS ---\n');

  // Test 1: Male Body Type Calculation
  console.log('Test 1: Male Body Type Calculation (Chest: 104, Waist: 84, Shoulder: 46, Hip: 96)');
  const maleCalc = calculateBodyType({
    measurements: { chest: 104, waist: 84, shoulder: 46, hip: 96 },
    gender: 'male'
  });
  console.log('Result:', JSON.stringify(maleCalc, null, 2));
  if (maleCalc.bodyType === 'trapezoid' && maleCalc.gender === 'male') {
    console.log('✅ TEST 1 PASSED: Male Trapezoid correctly identified.\n');
  } else {
    console.error('❌ TEST 1 FAILED:', maleCalc);
  }

  // Test 2: Female Body Type Calculation
  console.log('Test 2: Female Body Type Calculation (Bust: 85, Waist: 75, Hip: 105)');
  const femaleCalc = calculateBodyType({
    measurements: { bust: 85, waist: 75, hip: 105 },
    gender: 'female'
  });
  console.log('Result:', JSON.stringify(femaleCalc, null, 2));
  if (femaleCalc.bodyType === 'spoon' && femaleCalc.gender === 'female') {
    console.log('✅ TEST 2 PASSED: Female Spoon correctly identified.\n');
  } else {
    console.error('❌ TEST 2 FAILED:', femaleCalc);
  }

  // Test 2b: Female Petite
  console.log('Test 2b: Female Petite Calculation (Height: 155, Bust: 85, Waist: 70, Hip: 85)');
  const petiteCalc = calculateBodyType({
    measurements: { height: 155, bust: 85, waist: 70, hip: 85 },
    gender: 'female'
  });
  console.log('Result:', JSON.stringify(petiteCalc, null, 2));
  if (petiteCalc.bodyType === 'petite' && petiteCalc.gender === 'female') {
    console.log('✅ TEST 2b PASSED: Female Petite correctly identified.\n');
  } else {
    console.error('❌ TEST 2b FAILED:', petiteCalc);
  }

  // Test 2c: Male Stocky
  console.log('Test 2c: Male Stocky Calculation (Height: 170, Weight: 85, Chest: 110, Waist: 110, Hip: 105)');
  const stockyCalc = calculateBodyType({
    measurements: { height: 170, weight: 85, chest: 110, waist: 110, hip: 105 },
    gender: 'male'
  });
  console.log('Result:', JSON.stringify(stockyCalc, null, 2));
  if (stockyCalc.bodyType === 'stocky' && stockyCalc.gender === 'male') {
    console.log('✅ TEST 2c PASSED: Male Stocky correctly identified.\n');
  } else {
    console.error('❌ TEST 2c FAILED:', stockyCalc);
  }

  // Load garments sample
  const dataPath = path.join(__dirname, '..', 'data', 'clothes.json');
  const rawData = await readFile(dataPath, 'utf-8');
  const garments = JSON.parse(rawData);

  // Test 3: Male Gender Filtering in Recommendations
  console.log('Test 3: Male User Recommendation Filtering (genderPreference: "male")');
  const maleRecs = generateRecommendations({
    userProfile: {
      genderPreference: 'male',
      bodyType: 'trapezoid',
      skinTone: 'medium'
    },
    garments,
    filters: { category: 'tops' }
  });

  const returnedGendersMale = maleRecs.map(r => r.product.gender);
  console.log('Male user returned garment genders:', returnedGendersMale);
  const maleHasOnlyMaleOrUnisex = maleRecs.every(r => r.product.gender === 'male' || r.product.gender === 'unisex');
  if (maleHasOnlyMaleOrUnisex && maleRecs.length > 0) {
    console.log('✅ TEST 3 PASSED: Only male & unisex items returned for male user.');
    console.log('Sample top recommendation reason:', maleRecs[0].reasons);
    console.log('Sample breakdown:', maleRecs[0].breakdown, '\n');
  } else {
    console.error('❌ TEST 3 FAILED:', returnedGendersMale);
  }

  // Test 4: Female Gender Filtering in Recommendations
  console.log('Test 4: Female User Recommendation Filtering (genderPreference: "female")');
  const femaleRecs = generateRecommendations({
    userProfile: {
      genderPreference: 'female',
      bodyType: 'pear',
      skinTone: 'medium'
    },
    garments
  });

  const returnedGendersFemale = femaleRecs.map(r => r.product.gender);
  console.log('Female user returned garment genders:', returnedGendersFemale);
  const femaleHasOnlyFemaleOrUnisex = femaleRecs.every(r => r.product.gender === 'female' || r.product.gender === 'unisex');
  if (femaleHasOnlyFemaleOrUnisex && femaleRecs.length > 0) {
    console.log('✅ TEST 4 PASSED: Only female & unisex items returned for female user.');
    console.log('Sample top recommendation reason:', femaleRecs[0].reasons);
    console.log('Sample breakdown:', femaleRecs[0].breakdown, '\n');
  } else {
    console.error('❌ TEST 4 FAILED:', returnedGendersFemale);
  }

  console.log('--- ALL TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
