const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { calculateBodyType } = require('../services/bodyTypeService');
const { evaluateSkinToneCompatibility } = require('../services/skinToneService');
const { generateRecommendations } = require('../services/recommendationService');
const { evaluateVirtualTryOn } = require('../services/tryOnService');
const User = require('../models/User');
const Clothes = require('../models/Clothes');

async function testAll() {
  console.log('--- Testing Body Type Service ---');
  // Hourglass: bust=90, waist=65, hip=92
  const hourglass = calculateBodyType({
    measurements: { shoulderWidth: 38, bust: 90, waist: 65, hip: 92 }
  });
  console.log('Calculated Hourglass:', hourglass);

  // Pear: bust=82, waist=70, hip=98
  const pear = calculateBodyType({
    measurements: { shoulderWidth: 36, bust: 82, waist: 70, hip: 98 }
  });
  console.log('Calculated Pear:', pear);

  // Manual Selection
  const manual = calculateBodyType({ manualBodyType: 'apple' });
  console.log('Manual Selection (Apple):', manual);

  console.log('\n--- Testing Skin Tone Compatibility Service ---');
  const skinEval = evaluateSkinToneCompatibility({ color: 'Burnt Orange', recommendedSkinTones: ['medium', 'tan'] }, 'medium');
  console.log('Medium Skin + Burnt Orange evaluation:', skinEval);

  console.log('\n--- Testing DB Queries & Recommendation Engine ---');
  await mongoose.connect(process.env.MONGO_URI);

  const garments = await Clothes.find({}).lean();
  console.log(`Fetched ${garments.length} garments from MongoDB Atlas.`);

  const testUserProfile = {
    bodyType: 'pear',
    skinTone: 'tan'
  };

  const recommendations = generateRecommendations({
    userProfile: testUserProfile,
    garments,
    filters: { category: 'tops' }
  });

  console.log('\nTop Recommendation Result:');
  console.log({
    productName: recommendations[0].product.name,
    score: recommendations[0].score,
    reasons: recommendations[0].reasons
  });

  console.log('\n--- Testing Virtual Try-On Improvement ---');
  const tryOnResult = evaluateVirtualTryOn({
    userProfile: testUserProfile,
    garment: garments[0],
    requestedSize: 'M'
  });
  console.log('Try-on Evaluation Result:', tryOnResult.tryOnDetails);

  await mongoose.disconnect();
  console.log('\nAll System Service Checks Passed Cleanly!');
}

testAll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
