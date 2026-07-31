const mongoose = require('mongoose');

const bodyProfileSchema = new mongoose.Schema({
  genderPreference: {
    type: String,
    enum: ['male', 'female', 'unisex'],
    default: 'unisex'
  },
  measurements: {
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    shoulderWidth: { type: Number, default: 0 },
    shoulder: { type: Number, default: 0 },
    bust: { type: Number, default: 0 },
    chest: { type: Number, default: 0 },
    waist: { type: Number, default: 0 },
    hip: { type: Number, default: 0 }
  },
  bodyType: {
    type: String,
    required: true
  },
  calculatedBodyType: {
    type: String,
    default: null
  },
  selectedBodyType: {
    type: String,
    default: null
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  skinTone: {
    type: String,
    default: 'medium'
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  bodyProfile: {
    type: bodyProfileSchema,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
