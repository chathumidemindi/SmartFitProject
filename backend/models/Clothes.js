const mongoose = require('mongoose');

const clothesSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Garment name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['men', 'women', 'unisex'],
    default: 'unisex'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  subcategory: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  images: {
    type: [String],
    default: []
  },
  color: {
    type: String,
    default: ''
  },
  colors: {
    type: [String],
    default: []
  },
  availableSizes: {
    type: [String],
    default: ['S', 'M', 'L', 'XL']
  },
  bodyTypesSuitable: {
    type: [String],
    default: []
  },
  recommendedSkinTones: {
    type: [String],
    default: []
  },
  styleTags: {
    type: [String],
    default: []
  },
  fitType: {
    type: String,
    enum: ['slim', 'regular', 'relaxed', 'oversized'],
    default: 'regular'
  },
  garmentLength: {
    type: String,
    enum: ['crop', 'regular', 'long'],
    default: 'regular'
  },
  sleeveType: {
    type: String,
    enum: ['sleeveless', 'short sleeve', 'half sleeve', 'long sleeve'],
    default: 'short sleeve'
  },
  neckType: {
    type: String,
    enum: ['round neck', 'v neck', 'square neck', 'boat neck', 'high neck', 'collar'],
    default: 'round neck'
  },
  pattern: {
    type: String,
    enum: ['plain', 'printed', 'floral', 'striped', 'checked'],
    default: 'plain'
  },
  fabric: {
    type: String,
    default: 'cotton'
  },
  stretch: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  occasion: {
    type: String,
    enum: ['casual', 'formal', 'office', 'party', 'traditional', 'sports'],
    default: 'casual'
  },
  season: {
    type: String,
    enum: ['summer', 'winter', 'spring', 'autumn', 'all season'],
    default: 'all season'
  },
  secondaryColor: {
    type: String,
    default: ''
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Clothes', clothesSchema);
