const { calculateBodyType } = require('../services/bodyTypeService');

/**
 * Controller endpoint for body type detection
 * POST /api/body/analyze
 * Body: { measurements: { height, shoulderWidth, bust, chest, waist, hip }, manualBodyType, genderPreference, gender }
 */
exports.analyzeBody = (req, res, next) => {
  try {
    const { measurements, manualBodyType, gender, genderPreference } = req.body;

    if (!manualBodyType && (!measurements || Object.keys(measurements).length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Please provide physical measurements (bust/chest, waist, hip) or select a manualBodyType.',
        data: null
      });
      return;
    }

    const result = calculateBodyType({
      measurements,
      manualBodyType,
      gender: gender || genderPreference || 'female',
      genderPreference: gender || genderPreference || 'female'
    });

    res.json({
      success: true,
      message: 'Body analyzed successfully',
      data: {
        gender: result.gender,
        bodyType: result.bodyType,
        confidence: result.confidence,
        ratios: result.ratios,
        method: result.method || 'calculated'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};
