const SUPPORTED_SKIN_TONES = ['fair', 'light', 'medium', 'tan', 'deep', 'dark'];

/**
 * Maps expanded UI skin tones to the base 6 backend tones for backwards compatibility
 * and consistent color harmony scoring.
 */
const mapToBaseSkinTone = (skinTone) => {
  if (!skinTone) return 'medium';
  const tone = skinTone.toLowerCase().trim();
  const map = {
    'very fair': 'fair',
    'fair': 'fair',
    'light': 'light',
    'light medium': 'light',
    'medium': 'medium',
    'olive': 'medium',
    'tan': 'tan',
    'brown': 'deep',
    'dark brown': 'dark',
    'deep': 'dark'
  };
  return map[tone] || 'medium';
};
// Color harmony mappings for fashion recommendations
const SKIN_TONE_COLOR_MAP = {
  fair: ['soft pink', 'navy', 'emerald green', 'pastel blue', 'ruby red', 'lavender', 'black', 'grey'],
  light: ['pastel pink', 'light blue', 'beige', 'peach', 'navy', 'burgundy', 'soft yellow'],
  medium: ['olive green', 'burnt orange', 'warm brown', 'mustard', 'coral', 'navy', 'teal', 'cream'],
  tan: ['bright white', 'gold', 'coral', 'turquoise', 'emerald', 'warm yellow', 'olive', 'bronze'],
  deep: ['royal blue', 'fuchsia', 'bright white', 'emerald green', 'vibrant yellow', 'magenta', 'plum'],
  dark: ['bright white', 'canary yellow', 'cobalt blue', 'hot pink', 'tangerine', 'gold', 'crimson']
};

/**
 * Validate whether a given skin tone is within the supported classification
 */
const isValidSkinTone = (skinTone) => {
  if (!skinTone) return false;
  const tone = skinTone.toLowerCase().trim();
  if (['very fair', 'light medium', 'olive', 'brown', 'dark brown'].includes(tone)) return true;
  return SUPPORTED_SKIN_TONES.includes(tone);
};

/**
 * Return color suggestions for a skin tone
 */
const getRecommendedColors = (skinTone) => {
  const baseTone = mapToBaseSkinTone(skinTone);
  return SKIN_TONE_COLOR_MAP[baseTone] || SKIN_TONE_COLOR_MAP.medium;
};

/**
 * Evaluate color match score between user skin tone and garment
 * Returns score between 0 and 100 + reason string
 */
const evaluateSkinToneCompatibility = (garment, userSkinTone) => {
  const normalizedUserTone = mapToBaseSkinTone(userSkinTone);
  const garmentSkinTones = (garment.recommendedSkinTones || []).map(t => t.toLowerCase().trim());
  const garmentColor = (garment.color || '').toLowerCase().trim();

  // 1. Direct match in recommended skin tones list
  if (garmentSkinTones.includes(normalizedUserTone)) {
    return {
      score: 100,
      reason: `${garment.color || 'This'} color directly complements your ${normalizedUserTone} skin tone.`
    };
  }

  // 2. Check against skin tone color harmony rules
  const suggestedColors = getRecommendedColors(normalizedUserTone);
  const colorMatches = suggestedColors.some(c => garmentColor.includes(c) || c.includes(garmentColor));

  if (colorMatches) {
    return {
      score: 85,
      reason: `${garment.color || 'This'} is a high-harmony color for ${normalizedUserTone} skin tones.`
    };
  }

  // 3. Fallback neutral match
  const neutrals = ['black', 'white', 'grey', 'gray', 'denim', 'navy'];
  if (neutrals.some(n => garmentColor.includes(n))) {
    return {
      score: 70,
      reason: `${garment.color || 'Neutral'} is a versatile neutral shade that pairs well with ${normalizedUserTone} skin tones.`
    };
  }

  return {
    score: 50,
    reason: `${garment.color || 'This'} color is neutral for ${normalizedUserTone} skin tones.`
  };
};

module.exports = {
  SUPPORTED_SKIN_TONES,
  isValidSkinTone,
  getRecommendedColors,
  evaluateSkinToneCompatibility
};
