const FEMALE_BODY_TYPES = ['hourglass', 'pear', 'apple', 'rectangle', 'invertedTriangle', 'spoon', 'diamond', 'oval', 'athletic', 'petite'];
const MALE_BODY_TYPES = ['trapezoid', 'rectangle', 'triangle', 'oval', 'invertedTriangle', 'athletic', 'slim', 'broad', 'stocky'];
const VALID_BODY_TYPES = Array.from(new Set([...FEMALE_BODY_TYPES, ...MALE_BODY_TYPES]));

/**
 * Calculate body shape and confidence score based on physical measurements and gender
 * @param {Object} params
 * @param {Object} [params.measurements] - { height, shoulderWidth, shoulder, bust, chest, waist, hip }
 * @param {String} [params.manualBodyType] - Optional manual override body type
 * @param {String} [params.gender] - Gender context ('male', 'female', 'unisex')
 * @param {String} [params.genderPreference] - Fallback for gender context
 */
const calculateBodyType = ({
  measurements = {},
  manualBodyType = null,
  gender = null,
  genderPreference = 'female'
}) => {
  const rawGender = (gender || genderPreference || 'female').toLowerCase().trim();
  const normalizedGender = (rawGender === 'male' || rawGender === 'men') ? 'male' : 'female';

  // Manual selection override
  if (manualBodyType && VALID_BODY_TYPES.includes(manualBodyType)) {
    return {
      bodyType: manualBodyType,
      confidence: 100,
      gender: normalizedGender,
      method: 'manual',
      ratios: null
    };
  }

  const {
    shoulderWidth = 0,
    shoulder = 0,
    bust = 0,
    chest = 0,
    waist = 0,
    hip = 0
  } = measurements;

  const actualShoulder = shoulderWidth || shoulder;
  const upperMeasurement = chest || bust || actualShoulder;

  // Validate measurements presence
  if (!upperMeasurement || !waist || !hip) {
    throw new Error('Valid upper body (bust/chest/shoulder), waist, and hip measurements are required for automatic body type calculation.');
  }

  if (normalizedGender === 'male') {
    return calculateMaleBodyType({
      shoulder: actualShoulder,
      chest: chest || bust,
      waist,
      hip,
      height: measurements.height,
      weight: measurements.weight
    });
  }

  return calculateFemaleBodyType({
    shoulder: actualShoulder,
    bust: bust || chest,
    waist,
    hip,
    height: measurements.height,
    weight: measurements.weight
  });
};

/**
 * Male Body Type Calculator
 * Proportional logic based on fashion standard ratios and BMI.
 */
const calculateMaleBodyType = ({ shoulder, chest, waist, hip, height, weight }) => {
  const primaryUpper = chest || shoulder || waist; 
  const chestWaistRatio = primaryUpper / waist;
  const waistChestRatio = waist / primaryUpper;
  const waistHipRatio = waist / hip;
  const bmi = (weight && height) ? weight / ((height / 100) ** 2) : 22;

  let bodyType = 'rectangle';
  let confidence = 85;

  if (chestWaistRatio >= 1.35) {
    bodyType = 'invertedTriangle';
    confidence = 95;
  } else if (chestWaistRatio >= 1.20 && chestWaistRatio < 1.35) {
    if (bmi < 22) {
      bodyType = 'athletic';
      confidence = 90;
    } else {
      bodyType = 'trapezoid';
      confidence = 92;
    }
  } else if (waistChestRatio >= 1.02) {
    if (waistHipRatio >= 1.02) {
      bodyType = 'oval';
      confidence = 90;
    } else if (bmi > 28) {
      bodyType = 'stocky';
      confidence = 85;
    } else {
      bodyType = 'triangle';
      confidence = 88;
    }
  } else if (chestWaistRatio >= 1.08 && chestWaistRatio < 1.20) {
    if (bmi > 26) {
      bodyType = 'broad';
      confidence = 85;
    } else if (bmi < 20) {
      bodyType = 'slim';
      confidence = 88;
    } else {
      bodyType = 'trapezoid';
      confidence = 85;
    }
  } else {
    // Proportions are relatively straight
    if (bmi < 19) {
      bodyType = 'slim';
      confidence = 88;
    } else if (bmi > 28) {
      bodyType = 'stocky';
      confidence = 85;
    } else {
      bodyType = 'rectangle';
      confidence = 90;
    }
  }

  return {
    bodyType,
    confidence,
    gender: 'male',
    method: 'calculated',
    ratios: {
      chestWaistRatio: Number(chestWaistRatio.toFixed(2)),
      waistHipRatio: Number(waistHipRatio.toFixed(2)),
      chestHipRatio: Number((primaryUpper / hip).toFixed(2)),
      bmi: Number(bmi.toFixed(1))
    }
  };
};

/**
 * Female Body Type Calculator
 * Proportional logic based on fashion standard ratios.
 */
const calculateFemaleBodyType = ({ shoulder, bust, waist, hip, height, weight }) => {
  const waistBustRatio = waist / bust;
  const waistHipRatio = waist / hip;
  const bustHipRatio = bust / hip;
  const upperBody = shoulder > 0 ? Math.max(shoulder, bust) : bust;
  const upperHipRatio = upperBody / hip;
  const shoulderWaistRatio = shoulder / waist;

  let bodyType = 'rectangle';
  let confidence = 85;

  if (waist >= bust && waist >= hip) {
    // Apple, Diamond, Oval
    if (shoulder > 0 && shoulder < bust) {
      bodyType = 'diamond';
      confidence = 90;
    } else if (upperHipRatio >= 0.95) {
      bodyType = 'apple';
      confidence = 88;
    } else {
      bodyType = 'oval';
      confidence = 85;
    }
  } else if (waistBustRatio <= 0.78 && waistHipRatio <= 0.78) {
    // Hourglass variants
    if (bustHipRatio >= 0.90 && bustHipRatio <= 1.10) {
      bodyType = 'hourglass';
      confidence = 95;
    } else if (bustHipRatio < 0.90) {
      bodyType = 'spoon';
      confidence = 92;
    } else {
      bodyType = 'hourglass'; // Bust larger than hips but waist is very small
      confidence = 90;
    }
  } else if (hip / upperBody >= 1.05) {
    // Pear variants
    if (hip / upperBody >= 1.12 && waistHipRatio <= 0.80) {
      bodyType = 'spoon';
      confidence = 90;
    } else {
      bodyType = 'pear';
      confidence = 92;
    }
  } else if (upperHipRatio >= 1.05) {
    // Inverted Triangle or Athletic
    if (shoulder > bust && waistBustRatio > 0.75 && shoulderWaistRatio >= 1.20) {
      bodyType = 'athletic';
      confidence = 88;
    } else {
      bodyType = 'invertedTriangle';
      confidence = 92;
    }
  } else if (height > 0 && height <= 160) {
    // Petite as a fallback if proportions are balanced but height is short
    bodyType = 'petite';
    confidence = 85;
  } else {
    // Rectangle or Athletic
    if (shoulderWaistRatio >= 1.25) {
      bodyType = 'athletic';
      confidence = 85;
    } else {
      bodyType = 'rectangle';
      confidence = 90;
    }
  }

  return {
    bodyType,
    confidence,
    gender: 'female',
    method: 'calculated',
    ratios: {
      waistBustRatio: Number(waistBustRatio.toFixed(2)),
      waistHipRatio: Number(waistHipRatio.toFixed(2)),
      bustHipRatio: Number(bustHipRatio.toFixed(2))
    }
  };
};

module.exports = {
  FEMALE_BODY_TYPES,
  MALE_BODY_TYPES,
  VALID_BODY_TYPES,
  calculateBodyType
};
