const User = require('../models/User');
const Clothes = require('../models/Clothes');
const { generateRecommendations } = require('../services/recommendationService');
const path = require('path');
const { readFile } = require('fs/promises');

// Fallback helper if DB is empty
const loadFallbackClothes = async () => {
  try {
    const clothesPath = path.join(__dirname, '..', 'data', 'clothes.json');
    const data = await readFile(clothesPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

/**
 * POST /api/recommendations OR POST /api/recommendations/:userId
 * Generates gender-filtered clothing recommendations with scores and explanations
 */
exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.body.userId;
    const {
      genderPreference: rawGenderPref,
      category: rawCategory,
      styleTag,
      bodyProfile: inlineBodyProfile,
      bodyType: inlineBodyType,
      skinTone: inlineSkinTone,
      user: nestedUser,
      clothing: nestedClothing
    } = req.body;

    // Handle nested format { user: {...}, clothing: {...} } from TryOn page
    const userGender = nestedUser?.gender || rawGenderPref;
    const userBodyType = nestedUser?.bodyType || inlineBodyType;
    const userSkinTone = nestedUser?.skinTone || inlineSkinTone;
    const category = nestedClothing?.category || rawCategory;

    let userProfile = inlineBodyProfile ? { ...inlineBodyProfile } : null;

    // Fetch user profile from DB if valid userId provided
    if (userId && userId !== 'guest' && userId !== 'demo') {
      let user = null;
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: userId.toLowerCase().trim() });
      }

      if (user && user.bodyProfile) {
        userProfile = { ...user.bodyProfile.toObject() };
      }
    }

    // Build or override userProfile with payload values
    if (!userProfile) {
      userProfile = {
        genderPreference: userGender || 'female',
        bodyType: userBodyType || ((userGender === 'male' || userGender === 'men') ? 'trapezoid' : 'hourglass'),
        skinTone: userSkinTone || 'medium'
      };
    }

    if (userGender) {
      const lowerG = String(userGender).toLowerCase().trim();
      userProfile.genderPreference = (lowerG === 'men' || lowerG === 'male') ? 'male' : (lowerG === 'women' || lowerG === 'female') ? 'female' : 'unisex';
    }

    if (userBodyType) {
      userProfile.bodyType = userBodyType;
    }

    if (userSkinTone) {
      userProfile.skinTone = userSkinTone;
    }

    if (!userProfile.bodyType) {
      userProfile.bodyType = userProfile.genderPreference === 'male' ? 'trapezoid' : 'hourglass';
    }

    // Fetch clothing items strictly from MongoDB Atlas
    let garments = await Clothes.find({ status: 'active' }).lean();
    if (!garments) {
      garments = [];
    }

    // Generate gender-filtered and scored recommendations
    const recommendations = generateRecommendations({
      userProfile,
      garments,
      filters: {
        category,
        styleTag,
        genderPreference: userProfile.genderPreference,
        targetProductId: nestedClothing?.productId
      }
    });

    res.json({
      success: true,
      message: 'Recommendations generated successfully',
      data: {
        count: recommendations.length,
        recommendations
      }
    });
  } catch (error) {
    next(error);
  }
};
