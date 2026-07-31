/**
 * Evaluate Virtual Try-On suitability for a selected garment given a user profile
 * 
 * @param {Object} userProfile - User bodyProfile object { bodyType, skinTone, measurements }
 * @param {Object} garment - Selected garment object
 * @param {String} [requestedSize] - Requested garment size ("S", "M", "L", "XL")
 */
const evaluateVirtualTryOn = ({ userProfile, garment, requestedSize }) => {
  if (!userProfile) {
    throw new Error('User body profile is required for virtual try-on simulation.');
  }
  if (!garment) {
    throw new Error('Garment item is required for virtual try-on simulation.');
  }

  const userBodyType = (userProfile.bodyType || 'rectangle').toLowerCase().trim();
  const suitableBodyTypes = (garment.bodyTypesSuitable || garment.bodyTypes || []).map(b => b.toLowerCase().trim());
  const availableSizes = garment.availableSizes || ['S', 'M', 'L', 'XL'];

  // Check size availability
  const selectedSize = requestedSize || availableSizes[0] || 'M';
  const isSizeAvailable = availableSizes.includes(selectedSize);

  // Check body type suitability
  const isBodyTypeSuitable = suitableBodyTypes.includes(userBodyType) || suitableBodyTypes.includes('all');

  let fitFeedback = 'Good fit';
  if (!isBodyTypeSuitable) {
    fitFeedback = `This garment is optimized for ${suitableBodyTypes.join(', ')} body shapes, but can still be worn with styling tweaks.`;
  } else {
    fitFeedback = `Ideal fit for your ${userBodyType} body profile in size ${selectedSize}.`;
  }

  return {
    success: true,
    garmentId: garment.id || garment._id,
    garmentName: garment.name,
    garmentImage: garment.image,
    userProfile: {
      bodyType: userProfile.bodyType,
      skinTone: userProfile.skinTone
    },
    tryOnDetails: {
      selectedSize,
      isSizeAvailable,
      availableSizes,
      isBodyTypeSuitable,
      fitFeedback
    }
  };
};

module.exports = {
  evaluateVirtualTryOn
};
