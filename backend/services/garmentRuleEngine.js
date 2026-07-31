/**
 * Garment Rule Engine
 *
 * Automatically infers `bodyTypesSuitable` and `recommendedSkinTones`
 * from professional garment attributes entered by the admin.
 *
 * This keeps the admin workflow clean (no manual recommendation data)
 * while preserving full backward compatibility with the existing
 * recommendation service that reads those two arrays.
 */

// ──────────────────────────────────────────────
//  BODY TYPE INFERENCE
// ──────────────────────────────────────────────

/**
 * Female body-type suitability rules keyed by attribute values.
 * Each entry maps to an array of body types that benefit from that attribute.
 */
const FEMALE_FIT_RULES = {
  // Fit Type
  slim:      ['hourglass', 'rectangle', 'petite', 'athletic'],
  regular:   ['hourglass', 'pear', 'rectangle', 'invertedTriangle', 'spoon', 'athletic', 'petite'],
  relaxed:   ['pear', 'apple', 'rectangle', 'spoon', 'diamond', 'athletic'],
  oversized: ['apple', 'rectangle', 'diamond', 'athletic'],

  // Neck Type
  'v neck':      ['hourglass', 'apple', 'invertedTriangle', 'diamond', 'petite'],
  'round neck':  ['rectangle', 'pear', 'hourglass', 'spoon', 'athletic'],
  'square neck': ['hourglass', 'invertedTriangle', 'petite'],
  'boat neck':   ['pear', 'rectangle', 'spoon', 'athletic'],
  'high neck':   ['hourglass', 'invertedTriangle', 'petite'],
  'collar':      ['rectangle', 'pear', 'athletic', 'spoon'],

  // Garment Length
  crop:    ['hourglass', 'rectangle', 'petite', 'athletic'],
  long:    ['apple', 'pear', 'rectangle', 'diamond', 'spoon', 'athletic'],
  // 'regular' length is neutral – handled by fit type

  // Sleeve Type
  sleeveless:     ['hourglass', 'rectangle', 'petite', 'athletic'],
  'short sleeve': ['hourglass', 'pear', 'rectangle', 'apple', 'invertedTriangle', 'spoon', 'diamond', 'athletic', 'petite'],
  'half sleeve':  ['pear', 'apple', 'invertedTriangle', 'spoon', 'diamond'],
  'long sleeve':  ['apple', 'invertedTriangle', 'rectangle', 'diamond', 'athletic'],
};

const MALE_FIT_RULES = {
  // Fit Type
  slim:      ['trapezoid', 'invertedTriangle', 'rectangle', 'slim', 'athletic'],
  regular:   ['trapezoid', 'rectangle', 'triangle', 'invertedTriangle', 'slim', 'athletic', 'broad'],
  relaxed:   ['triangle', 'oval', 'rectangle', 'stocky', 'athletic'],
  oversized: ['oval', 'rectangle', 'triangle', 'stocky', 'athletic'],

  // Neck Type
  'v neck':      ['trapezoid', 'invertedTriangle', 'broad'],
  'round neck':  ['trapezoid', 'rectangle', 'triangle', 'oval', 'athletic', 'slim', 'stocky'],
  'collar':      ['trapezoid', 'invertedTriangle', 'rectangle', 'broad', 'athletic', 'slim'],
  'high neck':   ['trapezoid', 'invertedTriangle', 'broad'],

  // Garment Length
  crop:    ['trapezoid', 'rectangle', 'slim', 'athletic'],
  long:    ['oval', 'triangle', 'rectangle', 'stocky', 'athletic'],

  // Sleeve Type
  sleeveless:     ['trapezoid', 'invertedTriangle', 'broad'],
  'short sleeve': ['trapezoid', 'invertedTriangle', 'rectangle', 'broad', 'athletic', 'slim'],
  'half sleeve':  ['trapezoid', 'rectangle', 'triangle', 'slim', 'athletic'],
  'long sleeve':  ['oval', 'triangle', 'rectangle', 'invertedTriangle', 'stocky', 'athletic', 'broad'],
};

/**
 * Infer suitable body types from garment attributes.
 *
 * Strategy: collect votes from each attribute rule, then return every body type
 * that received at least 2 votes (i.e. multiple attributes agree on suitability).
 * If the result is empty (e.g. very generic garment), return a universal set.
 *
 * @param {Object} attrs
 * @param {string} [attrs.fitType]
 * @param {string} [attrs.neckType]
 * @param {string} [attrs.garmentLength]
 * @param {string} [attrs.sleeveType]
 * @param {string} [attrs.category]
 * @param {string} [attrs.gender]  'men' | 'women' | 'unisex'
 * @returns {string[]}
 */
const inferBodyTypes = (attrs = {}) => {
  const gender = (attrs.gender || 'unisex').toLowerCase().trim();
  const isMale = gender === 'men' || gender === 'male';
  const isFemale = gender === 'women' || gender === 'female';

  const allFemale = ['hourglass', 'pear', 'apple', 'rectangle', 'invertedTriangle', 'spoon', 'diamond', 'oval', 'athletic', 'petite'];
  const allMale = ['trapezoid', 'rectangle', 'triangle', 'oval', 'invertedTriangle', 'athletic', 'slim', 'broad', 'stocky'];

  const resolve = (ruleMap, allTypes) => {
    const votes = {};
    allTypes.forEach(t => { votes[t] = 0; });

    const keys = [
      (attrs.fitType || '').toLowerCase().trim(),
      (attrs.neckType || '').toLowerCase().trim(),
      (attrs.garmentLength || '').toLowerCase().trim(),
      (attrs.sleeveType || '').toLowerCase().trim(),
    ].filter(Boolean);

    keys.forEach(key => {
      const matches = ruleMap[key];
      if (matches) {
        matches.forEach(bt => { votes[bt] = (votes[bt] || 0) + 1; });
      }
    });

    // Require at least 2 attribute-votes for inclusion
    const threshold = Math.min(2, keys.length);
    let result = Object.entries(votes)
      .filter(([, count]) => count >= threshold)
      .map(([bt]) => bt);

    // Fallback: if nothing passed the threshold, return all with at least 1 vote
    if (result.length === 0) {
      result = Object.entries(votes)
        .filter(([, count]) => count >= 1)
        .map(([bt]) => bt);
    }

    // Ultimate fallback: return all body types (universal fit)
    if (result.length === 0) {
      result = [...allTypes];
    }

    return result;
  };

  if (isMale) {
    return resolve(MALE_FIT_RULES, allMale);
  }
  if (isFemale) {
    return resolve(FEMALE_FIT_RULES, allFemale);
  }

  // Unisex: merge both sets, deduplicate
  const female = resolve(FEMALE_FIT_RULES, allFemale);
  const male = resolve(MALE_FIT_RULES, allMale);
  return [...new Set([...female, ...male])];
};

// ──────────────────────────────────────────────
//  SKIN TONE INFERENCE
// ──────────────────────────────────────────────

const WARM_COLORS = [
  'red', 'orange', 'yellow', 'coral', 'peach', 'gold', 'rust',
  'mustard', 'terracotta', 'salmon', 'burgundy', 'maroon',
  'burnt orange', 'amber', 'bronze', 'copper', 'warm',
  'brown', 'tan', 'camel', 'khaki', 'olive',
];

const COOL_COLORS = [
  'blue', 'navy', 'purple', 'violet', 'lavender', 'teal',
  'emerald', 'mint', 'cobalt', 'indigo', 'magenta', 'plum',
  'turquoise', 'aqua', 'periwinkle', 'mauve', 'cool',
  'silver', 'ice', 'slate',
];

const NEUTRAL_COLORS = [
  'black', 'white', 'grey', 'gray', 'beige', 'cream', 'ivory',
  'charcoal', 'off-white', 'nude', 'taupe', 'neutral',
  'denim', 'stone',
];

const WARM_SKIN_TONES = ['medium', 'tan', 'deep'];
const COOL_SKIN_TONES = ['fair', 'light', 'medium'];
const ALL_SKIN_TONES  = ['fair', 'light', 'medium', 'tan', 'deep', 'dark'];

/**
 * Classify a single color string into warm / cool / neutral.
 */
const classifyColor = (color) => {
  if (!color) return 'neutral';
  const c = color.toLowerCase().trim();
  if (WARM_COLORS.some(w => c.includes(w))) return 'warm';
  if (COOL_COLORS.some(w => c.includes(w))) return 'cool';
  if (NEUTRAL_COLORS.some(w => c.includes(w))) return 'neutral';
  // Green can be warm or cool depending on shade; default to neutral
  if (c.includes('green')) return 'neutral';
  if (c.includes('pink')) return 'cool';
  return 'neutral';
};

/**
 * Infer recommended skin tones from garment colors.
 *
 * @param {string} primaryColor
 * @param {string} [secondaryColor]
 * @returns {string[]}
 */
const inferSkinTones = (primaryColor, secondaryColor) => {
  const primary = classifyColor(primaryColor);
  const secondary = secondaryColor ? classifyColor(secondaryColor) : null;

  const tonesSet = new Set();

  const addTones = (classification) => {
    if (classification === 'warm') {
      WARM_SKIN_TONES.forEach(t => tonesSet.add(t));
    } else if (classification === 'cool') {
      COOL_SKIN_TONES.forEach(t => tonesSet.add(t));
    } else {
      ALL_SKIN_TONES.forEach(t => tonesSet.add(t));
    }
  };

  addTones(primary);
  if (secondary) addTones(secondary);

  return [...tonesSet];
};

module.exports = {
  inferBodyTypes,
  inferSkinTones,
};
