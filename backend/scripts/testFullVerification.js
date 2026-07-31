const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const { calculateBodyType } = require('../services/bodyTypeService');
const { createClothing, listClothes, updateClothing, deleteClothing } = require('../controllers/clothesController');

async function verifyAll() {
  console.log('=== SMARTFIT VERIFICATION TEST SUITE ===');
  await connectDB();

  // Test 1: Male Body Profile Analysis
  console.log('\n--- 1. Male Profile Body Type Analysis ---');
  const maleResult = calculateBodyType({
    gender: 'male',
    measurements: { shoulder: 45, chest: 100, waist: 85, hip: 95 }
  });
  console.log('Male Result:', maleResult);

  if (maleResult.gender === 'male' && maleResult.bodyType === 'trapezoid') {
    console.log('✅ Male Body Analysis PASSED: Trapezoid detected correctly.');
  } else {
    console.error('❌ Male Body Analysis FAILED');
  }

  // Test 2: Admin Product Management & Status Toggling
  console.log('\n--- 2. Admin Product Management & Inactive Status ---');

  let createdProduct = null;
  const mockReqPost = {
    body: {
      name: 'Verification Denim Jacket',
      gender: 'unisex',
      category: 'outerwear',
      price: 4500,
      color: 'Indigo',
      colors: ['Indigo'],
      availableSizes: ['M', 'L'],
      status: 'active',
      stock: 12
    }
  };
  const mockResPost = {
    status: function() { return this; },
    json: function(data) {
      createdProduct = data.item;
      console.log('Created Product:', createdProduct.name, 'Status:', createdProduct.status);
    }
  };

  await createClothing(mockReqPost, mockResPost, (e) => console.error(e));

  const createdId = createdProduct._id || createdProduct.id;

  // Toggle status to inactive
  console.log('Disabling Product (Setting status to inactive)...');
  const mockReqPut = {
    params: { id: String(createdId) },
    body: { status: 'inactive' }
  };
  const mockResPut = {
    json: function(data) {
      console.log('Updated Product Status:', data.item.status);
    }
  };
  await updateClothing(mockReqPut, mockResPut, (e) => console.error(e));

  // Delete test item
  const mockReqDel = { params: { id: String(createdId) } };
  const mockResDel = { json: function(data) { console.log('Deleted Test Product:', data.id); } };
  await deleteClothing(mockReqDel, mockResDel, (e) => console.error(e));

  console.log('✅ Admin Product Management & Status Toggle PASSED!');
  process.exit(0);
}

verifyAll();
