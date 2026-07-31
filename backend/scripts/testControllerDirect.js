const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');
const Clothes = require('../models/Clothes');
const { createClothing, listClothes, updateClothing, deleteClothing } = require('../controllers/clothesController');

async function testDirect() {
  console.log('--- Testing Backend Controller Directly with MongoDB Atlas ---');
  await connectDB();

  // Mock Request & Response objects
  const reqPost = {
    body: {
      name: 'Direct Test Blazer',
      gender: 'men',
      category: 'outerwear',
      price: 3200,
      color: 'Black',
      colors: ['Black'],
      availableSizes: ['M', 'L'],
      image: '/images/products/men/shirts/shirtmen.jpg',
      status: 'active',
      stock: 10
    }
  };

  let createdItem = null;
  const resPost = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) {
      console.log('POST Response:', data);
      createdItem = data.item;
    }
  };

  await createClothing(reqPost, resPost, (err) => console.error(err));

  if (!createdItem) {
    console.error('❌ Failed to create clothing directly');
    process.exit(1);
  }

  const createdId = createdItem._id || createdItem.id;

  // Test Update
  const reqPut = {
    params: { id: String(createdId) },
    body: { name: 'Updated Direct Blazer', price: 3500 }
  };
  const resPut = {
    json: function(data) {
      console.log('PUT Response:', data);
    }
  };
  await updateClothing(reqPut, resPut, (err) => console.error(err));

  // Test Delete
  const reqDelete = {
    params: { id: String(createdId) }
  };
  const resDelete = {
    json: function(data) {
      console.log('DELETE Response:', data);
    }
  };
  await deleteClothing(reqDelete, resDelete, (err) => console.error(err));

  console.log('✅ Direct Controller Test Passed Successfully!');
  process.exit(0);
}

testDirect();
