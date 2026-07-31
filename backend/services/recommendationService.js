const { evaluateSkinToneCompatibility } = require('./skinToneService');

/**
 * Body type → fit type compatibility map.
 * Each body type lists the fit types that work best.
 */
const BODY_FIT_COMPAT = {
  // Female
  hourglass:        ['slim', 'regular'],
  pear:             ['relaxed', 'regular', 'oversized'],
  apple:            ['relaxed', 'oversized', 'regular'],
  rectangle:        ['slim', 'regular', 'relaxed'],
  invertedTriangle: ['relaxed', 'regular'],
  spoon:            ['relaxed', 'regular', 'oversized'],
  diamond:          ['relaxed', 'oversized', 'regular'],
  athletic:         ['slim', 'regular', 'relaxed'],
  petite:           ['slim', 'regular'],
  // Male (plus oval which is shared)
  trapezoid:        ['slim', 'regular'],
  triangle:         ['relaxed', 'regular', 'oversized'],
  oval:             ['relaxed', 'oversized', 'regular'],
  slim:             ['slim', 'regular', 'relaxed'],
  broad:            ['relaxed', 'regular'],
  stocky:           ['relaxed', 'oversized', 'regular'],
};

/**
 * Body type → neck type compatibility map.
 */
const BODY_NECK_COMPAT = {
  hourglass:        ['v neck', 'square neck', 'round neck'],
  pear:             ['boat neck', 'round neck', 'square neck'],
  apple:            ['v neck', 'round neck'],
  rectangle:        ['boat neck', 'round neck', 'high neck'],
  invertedTriangle: ['v neck', 'round neck', 'collar'],
  spoon:            ['boat neck', 'round neck', 'square neck'],
  diamond:          ['v neck', 'round neck'],
  petite:           ['v neck', 'square neck', 'round neck', 'high neck'],
  trapezoid:        ['v neck', 'collar', 'round neck'],
  triangle:         ['round neck', 'collar'],
  oval:             ['v neck', 'round neck'],
  athletic:         ['boat neck', 'round neck', 'high neck', 'collar'],
  slim:             ['boat neck', 'round neck', 'high neck', 'collar'],
  broad:            ['v neck', 'round neck', 'collar'],
  stocky:           ['v neck', 'round neck'],
};

/**
 * Generate fashion-specific bullet explanations based on body shape and gender
 */
const getBodyShapeExplanation = (userBodyType, garment, genderPref) => {
  const isMale = (genderPref === 'male' || genderPref === 'men');
  const type = (userBodyType || '').toLowerCase().trim();
  const category = (garment.category || '').toLowerCase().trim();

  // Primary suitabiltiy reason
  const primaryReason = `✓ Suitable for ${type} body shape`;

  let fashionBenefit = '';

  if (isMale) {
    switch (type) {
      case 'trapezoid':
        fashionBenefit = category === 'tops' || category === 'outerwear'
          ? '✓ Shirt cut enhances shoulder structure'
          : '✓ Tailored fit complements balanced torso';
        break;
      case 'invertedtriangle':
      case 'broad':
        fashionBenefit = '✓ Accentuates upper chest and V-taper frame';
        break;
      case 'rectangle':
      case 'slim':
      case 'athletic':
        fashionBenefit = '✓ Adds structured definition to athletic torso';
        break;
      case 'triangle':
        fashionBenefit = '✓ Draws visual attention upward to balance waistline';
        break;
      case 'oval':
      case 'stocky':
        fashionBenefit = '✓ Provides clean vertical lines for a streamlined profile';
        break;
      default:
        fashionBenefit = '✓ Complements male body structure';
    }
  } else {
    switch (type) {
      case 'pear':
      case 'spoon':
        fashionBenefit = '✓ Creates balanced silhouette';
        break;
      case 'hourglass':
      case 'petite':
        fashionBenefit = '✓ Highlights natural waist definition';
        break;
      case 'apple':
      case 'diamond':
        fashionBenefit = '✓ Elongates torso with flattering drape';
        break;
      case 'invertedtriangle':
        fashionBenefit = '✓ Softens shoulder line and balances lower body';
        break;
      case 'rectangle':
      case 'athletic':
        fashionBenefit = '✓ Creates feminine curves and visual shape';
        break;
      default:
        fashionBenefit = '✓ Enhances natural body proportions';
    }
  }

  return { primaryReason, fashionBenefit };
};

/**
 * Evaluate fit type compatibility score for a body type.
 * Returns 0-100.
 */
const evaluateFitCompatibility = (userBodyType, garment) => {
  const bt = (userBodyType || '').toLowerCase().trim();
  const fitType = (garment.fitType || 'regular').toLowerCase().trim();
  const neckType = (garment.neckType || '').toLowerCase().trim();

  let fitScore = 50; // baseline
  let reason = '';

  // Fit type match
  const compatFits = BODY_FIT_COMPAT[bt] || ['regular'];
  if (compatFits.includes(fitType)) {
    fitScore += 30;
    reason = `✓ ${fitType.charAt(0).toUpperCase() + fitType.slice(1)} Fit complements your ${bt} body shape`;
  } else {
    reason = `✓ ${fitType.charAt(0).toUpperCase() + fitType.slice(1)} Fit is compatible with your figure`;
  }

  // Neck type bonus
  const compatNecks = BODY_NECK_COMPAT[bt] || [];
  if (neckType && compatNecks.includes(neckType)) {
    fitScore += 20;
  }

  return { score: Math.min(100, fitScore), reason };
};

/**
 * Color-warmth classification for scoring against skin tone groups.
 */
const WARM_COLORS = ['red', 'orange', 'yellow', 'coral', 'peach', 'gold', 'rust', 'mustard', 'burgundy', 'maroon', 'brown', 'tan', 'camel', 'khaki', 'olive', 'terracotta', 'salmon', 'amber', 'bronze', 'copper'];
const COOL_COLORS = ['blue', 'navy', 'purple', 'violet', 'lavender', 'teal', 'emerald', 'mint', 'cobalt', 'indigo', 'magenta', 'plum', 'turquoise', 'aqua', 'mauve', 'silver', 'pink'];
const NEUTRAL_COLORS = ['black', 'white', 'grey', 'gray', 'beige', 'cream', 'ivory', 'charcoal', 'nude', 'taupe', 'denim'];

const WARM_SKIN = ['medium', 'tan', 'deep', 'dark'];
const COOL_SKIN = ['fair', 'light', 'medium'];

const classifyColorTemp = (color) => {
  if (!color) return 'neutral';
  const c = color.toLowerCase().trim();
  if (WARM_COLORS.some(w => c.includes(w))) return 'warm';
  if (COOL_COLORS.some(w => c.includes(w))) return 'cool';
  if (NEUTRAL_COLORS.some(w => c.includes(w))) return 'neutral';
  return 'neutral';
};

/**
 * Score how well the garment color suits the user's skin tone.
 * Uses both the recommendedSkinTones array AND color-warmth rules.
 */
const evaluateColorScore = (garment, userSkinTone) => {
  const tone = (userSkinTone || 'medium').toLowerCase().trim();
  const garmentColor = (garment.color || '').toLowerCase().trim();
  const recommended = (garment.recommendedSkinTones || []).map(t => t.toLowerCase().trim());

  // Direct match in recommended skin tones
  if (recommended.includes(tone)) {
    return {
      score: 100,
      reason: `✓ ${garment.color || 'This color'} complements your ${tone} skin tone`
    };
  }

  // Color-warmth matching
  const temp = classifyColorTemp(garmentColor);
  if (temp === 'neutral') {
    return {
      score: 80,
      reason: `✓ ${garment.color || 'Neutral color'} is versatile for all skin tones`
    };
  }
  if (temp === 'warm' && WARM_SKIN.includes(tone)) {
    return {
      score: 85,
      reason: `✓ Warm ${garment.color || 'color'} harmonizes with your ${tone} skin tone`
    };
  }
  if (temp === 'cool' && COOL_SKIN.includes(tone)) {
    return {
      score: 85,
      reason: `✓ Cool ${garment.color || 'color'} harmonizes with your ${tone} skin tone`
    };
  }

  return {
    score: 50,
    reason: `✓ ${garment.color || 'This color'} is wearable with ${tone} skin tone`
  };
};

/**
 * Occasion scoring — casual is universally compatible;
 * specific occasions get a baseline.
 */
const evaluateOccasionScore = (garment) => {
  const occasion = (garment.occasion || 'casual').toLowerCase().trim();
  // All occasions are valid; casual/office are most universally worn
  if (occasion === 'casual' || occasion === 'office') {
    return { score: 90, reason: `✓ Suitable for ${occasion} wear` };
  }
  if (occasion === 'formal' || occasion === 'party') {
    return { score: 75, reason: `✓ Suitable for ${occasion} occasions` };
  }
  return { score: 70, reason: `✓ Suitable for ${occasion} occasions` };
};

/**
 * Style tags scoring.
 */
const evaluateStyleScore = (garment, preferredStyle, preferredCategory) => {
  const styleTags = (garment.styleTags || []).map(t => t.toLowerCase().trim());
  const garmentCategory = (garment.category || '').toLowerCase().trim();

  let score = 70; // baseline
  let matched = false;

  if (preferredCategory && (garmentCategory.includes(preferredCategory) || preferredCategory.includes(garmentCategory))) {
    score += 15;
    matched = true;
  }

  if (preferredStyle && styleTags.includes(preferredStyle)) {
    score += 15;
    matched = true;
  }

  // If no filter specified, give a decent baseline
  if (!preferredCategory && !preferredStyle) {
    score = 80;
  }

  return { score: Math.min(100, score), matched };
};

/**
 * Generate hybrid gender-aware clothing recommendations for a user profile
 * 
 * Weights:
 * - Body Shape Suitability: 40%
 * - Skin Tone / Color:      20%
 * - Fit Compatibility:       15%
 * - Color Harmony:           10%
 * - Occasion:                10%
 * - Style Tags:               5%
 * 
 * @param {Object} params
 * @param {Object} params.userProfile - User bodyProfile object
 * @param {Array} params.garments - Array of Clothes documents
 * @param {Object} [params.filters] - Query filters (category, styleTag, genderPreference)
 */
const generateRecommendations = ({ userProfile = {}, garments = [], filters = {} }) => {
  if (!userProfile || (!userProfile.bodyType && !userProfile.genderPreference)) {
    throw new Error('User profile with a valid body type or gender preference is required for recommendations.');
  }

  const userGenderPref = (
    filters.genderPreference ||
    userProfile.genderPreference ||
    userProfile.gender ||
    'unisex'
  ).toLowerCase().trim();

  const userBodyType = (
    userProfile.selectedBodyType ||
    userProfile.calculatedBodyType ||
    userProfile.bodyType ||
    'rectangle'
  ).toLowerCase().trim();
  const userSkinTone = (userProfile.skinTone || 'medium').toLowerCase().trim();
  const preferredCategory = (filters.category || userProfile.preferredCategory || '').toLowerCase().trim();
  const preferredStyle = (filters.styleTag || userProfile.preferredStyle || '').toLowerCase().trim();

  // --- Gender Filtering ---
  // male user -> men's + unisex
  // female user -> women's + unisex
  // unisex user -> all
  const filteredGarments = garments.filter(garment => {
    const rawGarmentGender = (garment.gender || 'unisex').toLowerCase().trim();
    const garmentGender = (rawGarmentGender === 'men' || rawGarmentGender === 'male')
      ? 'male'
      : (rawGarmentGender === 'women' || rawGarmentGender === 'female')
        ? 'female'
        : 'unisex';

    if (userGenderPref === 'male') {
      return garmentGender === 'male' || garmentGender === 'unisex';
    }
    if (userGenderPref === 'female') {
      return garmentGender === 'female' || garmentGender === 'unisex';
    }
    // unisex user gets all products
    return true;
  });

  console.log(`[RecommendationEngine] Scoring ${filteredGarments.length} gender-filtered garments for ${userBodyType} / ${userSkinTone}`);

  const scoredRecommendations = filteredGarments.map(garment => {
    const reasons = [];

    // --- 1. Body Shape Suitability Score (40%) ---
    let bodyScore = 40;
    const suitableBodyTypes = (garment.bodyTypesSuitable || garment.bodyTypes || []).map(b => b.toLowerCase().trim());
    const { primaryReason, fashionBenefit } = getBodyShapeExplanation(userBodyType, garment, userGenderPref);

    if (suitableBodyTypes.includes(userBodyType)) {
      bodyScore = 100;
      reasons.push(primaryReason);
      if (fashionBenefit) reasons.push(fashionBenefit);
    } else if (suitableBodyTypes.includes('all') || suitableBodyTypes.includes('universal') || suitableBodyTypes.length === 0) {
      bodyScore = 75;
      reasons.push(`✓ Versatile fit suitable for ${userBodyType} body shape`);
    } else {
      bodyScore = 40;
      reasons.push(`✓ Compatible fit for ${userBodyType} body shape`);
    }

    // --- 2. Skin Tone Compatibility Score (20%) ---
    const skinToneEval = evaluateSkinToneCompatibility(garment, userSkinTone);
    const skinScore = skinToneEval.score;
    if (skinToneEval.reason) {
      const cleanReason = skinToneEval.reason.startsWith('✓')
        ? skinToneEval.reason
        : `✓ ${skinToneEval.reason}`;
      reasons.push(cleanReason);
    } else {
      reasons.push(`✓ Color matches ${userSkinTone} skin tone`);
    }

    // --- 3. Fit Compatibility Score (15%) ---
    const fitEval = evaluateFitCompatibility(userBodyType, garment);
    const fitScore = fitEval.score;
    if (fitEval.reason) reasons.push(fitEval.reason);

    // --- 4. Color Harmony Score (10%) ---
    const colorEval = evaluateColorScore(garment, userSkinTone);
    const colorScore = colorEval.score;
    // Color reason added only if distinct from skin tone reason
    if (colorEval.reason && !reasons.some(r => r.includes('skin tone') && r.includes(garment.color || ''))) {
      reasons.push(colorEval.reason);
    }

    // --- 5. Occasion Score (10%) ---
    const occasionEval = evaluateOccasionScore(garment);
    const occasionScore = occasionEval.score;
    reasons.push(occasionEval.reason);

    // --- 6. Style Tags Score (5%) ---
    const styleEval = evaluateStyleScore(garment, preferredStyle, preferredCategory);
    const styleScore = styleEval.score;
    if (styleEval.matched && preferredCategory) {
      reasons.push(`✓ Matches requested '${garment.category}' category`);
    }

    // --- Weighted Final Score ---
    // 40% Body + 20% Skin + 15% Fit + 10% Color + 10% Occasion + 5% Style = 100%
    const score = Math.round(
      (bodyScore * 0.40) +
      (skinScore * 0.20) +
      (fitScore * 0.15) +
      (colorScore * 0.10) +
      (occasionScore * 0.10) +
      (styleScore * 0.05)
    );

    // Debug logging
    console.log(`[RecommendationEngine] ${garment.name}: body=${bodyScore} skin=${skinScore} fit=${fitScore} color=${colorScore} occasion=${occasionScore} style=${styleScore} → TOTAL=${score}%`);

    return {
      product: garment,
      score,
      breakdown: {
        bodyScore,
        skinScore,
        fitScore,
        colorScore,
        occasionScore,
        styleScore
      },
      reasons
    };
  });

  // Sort descending by score
  scoredRecommendations.sort((a, b) => b.score - a.score);

  // Apply threshold: show products >= 60%, but never return empty if products exist
  const MIN_THRESHOLD = 60;
  const MIN_FALLBACK = 5;
  const aboveThreshold = scoredRecommendations.filter(r => r.score >= MIN_THRESHOLD);

  if (aboveThreshold.length > 0) {
    console.log(`[RecommendationEngine] Returning ${aboveThreshold.length} products above ${MIN_THRESHOLD}% threshold`);
    return aboveThreshold;
  }

  // Fallback: return top 5 regardless of score
  const fallback = scoredRecommendations.slice(0, MIN_FALLBACK);
  console.log(`[RecommendationEngine] No products above ${MIN_THRESHOLD}%. Returning top ${fallback.length} as fallback.`);
  return fallback;
};

module.exports = {
  generateRecommendations
};
