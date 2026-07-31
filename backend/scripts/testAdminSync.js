const API_BASE = 'http://localhost:5000/api/clothes';

async function testAdminProductSync() {
  console.log('--- Testing Admin Product Synchronization with MongoDB Atlas ---');

  try {
    // 1. Create a product
    const newProductPayload = {
      name: 'Test Admin Blazer',
      gender: 'men',
      category: 'outerwear',
      price: 2500,
      color: 'Navy',
      colors: ['Navy', 'Black'],
      availableSizes: ['M', 'L', 'XL'],
      image: '/images/products/men/shirts/shirtmen.jpg',
      status: 'active',
      stock: 15
    };

    console.log('1. Posting new product to POST /api/clothes...');
    const createRes = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProductPayload)
    });
    const createData = await createRes.json();
    console.log('Created Item Response:', createData);

    const createdId = createData.item ? (createData.item._id || createData.item.id) : null;

    if (!createdId) {
      throw new Error('Failed to create product');
    }

    // 2. Fetch all products from GET /api/clothes
    console.log('2. Fetching all products from GET /api/clothes...');
    const listRes = await fetch(API_BASE);
    const listData = await listRes.json();
    const items = Array.isArray(listData) ? listData : (listData.items || []);
    const found = items.find(p => String(p._id) === String(createdId) || String(p.id) === String(createdId));
    console.log('Found newly added product in GET list?', Boolean(found));

    // 3. Update the product via PUT /api/clothes/:id
    console.log(`3. Updating product ${createdId} via PUT /api/clothes/${createdId}...`);
    const updateRes = await fetch(`${API_BASE}/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Admin Blazer', price: 2800 })
    });
    const updateData = await updateRes.json();
    console.log('Update Response:', updateData);

    // 4. Delete the test product via DELETE /api/clothes/:id
    console.log(`4. Deleting test product ${createdId} via DELETE /api/clothes/${createdId}...`);
    const deleteRes = await fetch(`${API_BASE}/${createdId}`, {
      method: 'DELETE'
    });
    const deleteData = await deleteRes.json();
    console.log('Delete Response:', deleteData);

    console.log('✅ Admin Product Synchronization test completed successfully!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testAdminProductSync();
