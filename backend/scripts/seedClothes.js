const path = require('path');
const { readFile } = require('fs/promises');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Clothes = require('../models/Clothes');

const extractColorFromName = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('linen') || lower.includes('beige')) return 'Beige';
  if (lower.includes('earth') || lower.includes('brown')) return 'Brown';
  if (lower.includes('orange')) return 'Burnt Orange';
  if (lower.includes('black')) return 'Black';
  if (lower.includes('blue') || lower.includes('denim')) return 'Blue';
  if (lower.includes('white')) return 'White';
  if (lower.includes('green')) return 'Green';
  return 'Multicolor';
};

const normalizeGender = (g = '') => {
  const lower = g.toLowerCase().trim();
  if (lower === 'men' || lower === 'male') return 'male';
  if (lower === 'women' || lower === 'female') return 'female';
  return 'unisex';
};

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected.');

    const clothesJsonPath = path.join(__dirname, '..', 'data', 'clothes.json');
    const rawData = await readFile(clothesJsonPath, 'utf-8');
    const clothesList = JSON.parse(rawData);

    console.log(`Seeding ${clothesList.length} garments into MongoDB Atlas...`);

    let migratedCount = 0;

    for (const item of clothesList) {
      const gender = normalizeGender(item.gender);
      const bodyTypesSuitable = item.bodyTypesSuitable || item.bodyTypes || [];
      const recommendedSkinTones = item.recommendedSkinTones || item.skinTones || [];
      const color = item.color || extractColorFromName(item.name);

      const clothingDoc = {
        id: item.id,
        name: item.name,
        category: item.category,
        description: `Premium ${gender} ${item.category} designed for stylish comfort and custom fit.`,
        price: item.price,
        color,
        availableSizes: item.availableSizes || ['S', 'M', 'L', 'XL'],
        image: item.image,
        bodyTypesSuitable,
        recommendedSkinTones,
        styleTags: item.styleTags || item.tags || [],
        gender
      };

      await Clothes.findOneAndUpdate(
        { id: item.id },
        clothingDoc,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      migratedCount++;
    }

    console.log(`Data Migration Successful! ${migratedCount} clothes documents seeded into MongoDB Atlas.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

seed();
