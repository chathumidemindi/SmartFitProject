const Clothes = require('../models/Clothes');
const User = require('../models/User');
const { evaluateVirtualTryOn } = require('../services/tryOnService');
const { inferBodyTypes, inferSkinTones } = require('../services/garmentRuleEngine');

exports.listClothes = async (req, res, next) => {
  try {
    const { gender = 'all', category, bodyType, skinTone, includeInactive } = req.query;
    console.log('[clothesController] listClothes received query parameters:', req.query);

    let query = {};

    if (includeInactive !== 'true') {
      query.status = 'active';
    }

    if (gender !== 'all') {
      const targetGender = gender.toLowerCase();
      if (targetGender === 'women' || targetGender === 'female') {
        query.$or = [{ gender: 'women' }, { gender: 'female' }, { gender: 'unisex' }];
      } else if (targetGender === 'men' || targetGender === 'male') {
        query.$or = [{ gender: 'men' }, { gender: 'male' }, { gender: 'unisex' }];
      } else {
        query.$or = [{ gender }, { gender: 'unisex' }];
      }
    }
    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }
    if (bodyType) {
      query.bodyTypesSuitable = { $in: [bodyType.toLowerCase()] };
    }
    if (skinTone) {
      query.recommendedSkinTones = { $in: [skinTone.toLowerCase()] };
    }

    const items = await Clothes.find(query).lean();
    console.log(`[clothesController] MongoDB collection name: ${Clothes.collection.name}`);
    console.log(`[clothesController] number of documents returned: ${items.length}`);
    res.json({ success: true, message: 'Clothes fetched successfully', data: items || [] });
  } catch (error) {
    next(error);
  }
};

exports.getClothingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let item = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Clothes.findById(id).lean();
    }
    if (!item) {
      item = await Clothes.findOne({ id }).lean();
    }

    if (!item || item.status === 'inactive') {
      res.status(404).json({ success: false, message: 'Item not found', data: null });
      return;
    }

    res.json({ success: true, message: 'Item fetched successfully', data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clothes
 * Create new garment product in MongoDB Atlas
 */
exports.createClothing = async (req, res, next) => {
  try {
    const data = req.body;
    if (data.images && data.images.length > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 images allowed' });
    }
    const rawGender = (data.gender || 'unisex').toLowerCase().trim();
    const finalGender = (rawGender === 'men' || rawGender === 'male') ? 'men' : (rawGender === 'women' || rawGender === 'female') ? 'women' : 'unisex';

    const payload = {
      id: data.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: data.name || '',
      category: data.category || 'tops',
      subcategory: data.subcategory || '',
      description: data.description || '',
      price: Number(data.price) || 0,
      colors: data.colors || (data.color ? [data.color] : []),
      color: (data.colors && data.colors.length > 0) ? data.colors[0] : (data.color || ''),
      availableSizes: data.availableSizes || ['S', 'M', 'L', 'XL'],
      images: data.images || (data.image ? [data.image] : []),
      image: (data.images && data.images.length > 0) ? data.images[0] : (data.image || ''),
      styleTags: data.styleTags || [],
      stock: Number(data.stock) || 0,
      gender: finalGender,
      status: data.status || 'active',
      // New garment attributes
      fitType: data.fitType || 'regular',
      garmentLength: data.garmentLength || 'regular',
      sleeveType: data.sleeveType || 'short sleeve',
      neckType: data.neckType || 'round neck',
      pattern: data.pattern || 'plain',
      fabric: data.fabric || 'cotton',
      stretch: data.stretch || 'medium',
      occasion: data.occasion || 'casual',
      season: data.season || 'all season',
      secondaryColor: data.secondaryColor || ''
    };

    // Auto-generate recommendation attributes from garment metadata
    // If admin explicitly provides them (backward compat), keep those values
    if (data.bodyTypesSuitable && data.bodyTypesSuitable.length > 0) {
      payload.bodyTypesSuitable = data.bodyTypesSuitable;
    } else {
      payload.bodyTypesSuitable = inferBodyTypes({
        fitType: payload.fitType,
        neckType: payload.neckType,
        garmentLength: payload.garmentLength,
        sleeveType: payload.sleeveType,
        category: payload.category,
        gender: payload.gender
      });
    }

    if (data.recommendedSkinTones && data.recommendedSkinTones.length > 0) {
      payload.recommendedSkinTones = data.recommendedSkinTones;
    } else {
      payload.recommendedSkinTones = inferSkinTones(payload.color, payload.secondaryColor);
    }

    const newItem = await Clothes.create(payload);
    res.status(201).json({ success: true, message: 'Product created successfully', data: newItem });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/clothes/:id
 * Update garment product in MongoDB Atlas
 */
exports.updateClothing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.images && data.images.length > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 images allowed' });
    }
    
    // Only map allowed schema fields for updates
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.category !== undefined) updates.category = data.category;
    if (data.subcategory !== undefined) updates.subcategory = data.subcategory;
    if (data.description !== undefined) updates.description = data.description;
    if (data.price !== undefined) updates.price = Number(data.price);
    
    // Arrays and backward compatible mapping
    if (data.colors !== undefined) {
      updates.colors = data.colors;
      updates.color = data.colors[0] || '';
    } else if (data.color !== undefined) {
      updates.color = data.color;
      updates.colors = data.color ? [data.color] : [];
    }

    if (data.availableSizes !== undefined) updates.availableSizes = data.availableSizes;
    
    if (data.images !== undefined) {
      updates.images = data.images;
      updates.image = data.images[0] || '';
    } else if (data.image !== undefined) {
      updates.image = data.image;
      updates.images = data.image ? [data.image] : [];
    }

    if (data.styleTags !== undefined) updates.styleTags = data.styleTags;
    if (data.stock !== undefined) updates.stock = Number(data.stock);
    if (data.status !== undefined) updates.status = data.status;
    
    if (data.gender !== undefined) {
      const rawGender = String(data.gender).toLowerCase().trim();
      updates.gender = (rawGender === 'men' || rawGender === 'male') ? 'men' : (rawGender === 'women' || rawGender === 'female') ? 'women' : 'unisex';
    }

    // New garment attribute fields
    if (data.fitType !== undefined) updates.fitType = data.fitType;
    if (data.garmentLength !== undefined) updates.garmentLength = data.garmentLength;
    if (data.sleeveType !== undefined) updates.sleeveType = data.sleeveType;
    if (data.neckType !== undefined) updates.neckType = data.neckType;
    if (data.pattern !== undefined) updates.pattern = data.pattern;
    if (data.fabric !== undefined) updates.fabric = data.fabric;
    if (data.stretch !== undefined) updates.stretch = data.stretch;
    if (data.occasion !== undefined) updates.occasion = data.occasion;
    if (data.season !== undefined) updates.season = data.season;
    if (data.secondaryColor !== undefined) updates.secondaryColor = data.secondaryColor;

    // If admin explicitly provides bodyTypesSuitable/recommendedSkinTones, keep them (backward compat).
    // Otherwise, re-infer from garment attributes when any relevant attribute changes.
    if (data.bodyTypesSuitable !== undefined && data.bodyTypesSuitable.length > 0) {
      updates.bodyTypesSuitable = data.bodyTypesSuitable;
    } else {
      // Fetch existing doc to merge with incoming changes for inference
      let existing = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        existing = await Clothes.findById(id).lean();
      }
      if (!existing) {
        existing = await Clothes.findOne({ id }).lean();
      }
      if (existing) {
        const merged = { ...existing, ...updates };
        updates.bodyTypesSuitable = inferBodyTypes({
          fitType: merged.fitType,
          neckType: merged.neckType,
          garmentLength: merged.garmentLength,
          sleeveType: merged.sleeveType,
          category: merged.category,
          gender: merged.gender
        });
      }
    }

    if (data.recommendedSkinTones !== undefined && data.recommendedSkinTones.length > 0) {
      updates.recommendedSkinTones = data.recommendedSkinTones;
    } else {
      // Re-infer skin tones from color
      let existing = null;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        existing = await Clothes.findById(id).lean();
      }
      if (!existing) {
        existing = await Clothes.findOne({ id }).lean();
      }
      if (existing) {
        const merged = { ...existing, ...updates };
        updates.recommendedSkinTones = inferSkinTones(merged.color, merged.secondaryColor);
      }
    }

    let item = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Clothes.findByIdAndUpdate(id, updates, { new: true });
    }
    if (!item) {
      item = await Clothes.findOneAndUpdate({ id }, updates, { new: true });
    }

    if (!item) {
      res.status(404).json({ success: false, message: 'Garment not found', data: null });
      return;
    }

    res.json({ success: true, message: 'Product updated successfully', data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/clothes/:id
 * Delete garment product from MongoDB Atlas
 */
exports.deleteClothing = async (req, res, next) => {
  try {
    const { id } = req.params;

    let item = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Clothes.findByIdAndDelete(id);
    }
    if (!item) {
      item = await Clothes.findOneAndDelete({ id });
    }

    if (!item) {
      res.status(404).json({ success: false, message: 'Garment not found', data: null });
      return;
    }

    res.json({ success: true, message: 'Garment deleted successfully', data: { id } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/clothes/:id/try-on
 * Virtual Try-On evaluation endpoint using saved user body profile
 */
exports.tryOnGarment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, bodyProfile: inlineProfile, size } = req.body;

    let garment = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      garment = await Clothes.findById(id).lean();
    }
    if (!garment) {
      garment = await Clothes.findOne({ id }).lean();
    }

    if (!garment || garment.status === 'inactive') {
      res.status(404).json({ success: false, message: 'Garment item not found', data: null });
      return;
    }

    let userProfile = inlineProfile;
    if (userId) {
      let user = null;
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: userId });
      }
      if (user && user.bodyProfile) {
        userProfile = user.bodyProfile;
      }
    }

    if (!userProfile) {
      res.status(400).json({
        success: false,
        message: 'User body profile is required for virtual try-on evaluation.',
        data: null
      });
      return;
    }

    const result = evaluateVirtualTryOn({
      userProfile,
      garment,
      requestedSize: size
    });

    res.json({ success: true, message: 'Try-on evaluation successful', data: result });
  } catch (error) {
    next(error);
  }
};
