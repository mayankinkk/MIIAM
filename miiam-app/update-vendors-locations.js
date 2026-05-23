const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lpmhexjwctlpaxvvlofk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbWhleGp3Y3RscGF4dnZsb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjA3MjMsImV4cCI6MjA5MjQzNjcyM30.zFj-UxL-G6A5EralvbDAWTTgn7YznMRfD4-FwQ-rxbQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const groceryProductsData = [
  { name: "Organic Apples (1kg)", category: "Fruits", price: 180, stock: 50, image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400" },
  { name: "Fresh Bananas (1 dozen)", category: "Fruits", price: 60, stock: 100, image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86279?w=400" },
  { name: "Organic Spinach (500g)", category: "Vegetables", price: 45, stock: 30, image_url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400" },
  { name: "Fresh Tomatoes (1kg)", category: "Vegetables", price: 50, stock: 40, image_url: "https://images.unsplash.com/photo-1546470427-227c7a715614?w=400" },
  { name: "Farm Fresh Eggs (12pcs)", category: "Dairy", price: 80, stock: 200, image_url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400" },
  { name: "Amul Milk (1L)", category: "Dairy", price: 45, stock: 150, image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
  { name: "Whole Wheat Bread", category: "Bakery", price: 40, stock: 60, image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
  { name: "Basmati Rice (5kg)", category: "Pulses", price: 450, stock: 25, image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { name: "Toor Dal (1kg)", category: "Pulses", price: 120, stock: 35, image_url: "https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=400" }
];

const pharmacyMedicinesData = [
  { name: "Dolo 650 (Strip of 15)", category: "Pain Relief", price: 35, stock: 100, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
  { name: "Crosin 500 (Strip of 10)", category: "Pain Relief", price: 25, stock: 150, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400" },
  { name: "Augmentin 625 (Strip of 6)", category: "Antibiotics", price: 180, stock: 30, requires_prescription: true, image_url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
  { name: "Centrum Multi-Vitamin (60 tablets)", category: "Vitamins", price: 450, stock: 40, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400" },
  { name: "Glucobay 50 (30 tablets)", category: "Diabetes", price: 280, stock: 25, requires_prescription: true, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" }
];

const flowerItemsData = [
  { name: "Classic Red Rose Bouquet (12 roses)", category: "Bouquets", price: 450, description: "Beautiful 12 red roses with decorative wrapper", image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400" },
  { name: "Mixed Flower Arrangement", category: "Arrangements", price: 680, description: "Assorted seasonal flowers in a vase", image_url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400" },
  { name: "Birthday Combo (Flowers + Cake)", category: "Combos", price: 890, description: "Rose bouquet with chocolate cake", image_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400" },
  { name: "Gift Hamper (Flowers + Chocolates)", category: "Hampers", price: 1200, description: "Premium flowers with assorted chocolates", image_url: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400" }
];

async function run() {
  console.log("1. Fetching all vendors...");
  const { data: vendors, error: fetchErr } = await supabase.from('vendors').select('*');
  if (fetchErr) {
    console.error("Error fetching vendors:", fetchErr);
    return;
  }

  console.log(`Found ${vendors.length} vendors.`);

  // Update existing food vendors
  for (const v of vendors) {
    let updateObj = {};
    if (v.shop_name === 'Biryani House' || v.shop_name === 'Pizza Hut' || v.shop_name === 'Domino\'s Pizza' || v.shop_name === 'McDonald\'s' || v.shop_name === 'KFC' || v.shop_name === 'Golden Dragon') {
      updateObj = { city: 'Delhi', pincode: '110001', type: 'food' };
    } else if (v.shop_name === 'Pizza Paradise') {
      updateObj = { city: 'Mumbai', pincode: '400001', type: 'food' };
    } else if (v.shop_name === 'Chinese Corner') {
      updateObj = { city: 'Bangalore', pincode: '560001', type: 'food' };
    } else if (v.shop_name === 'dy') {
      updateObj = { type: 'grocery' }; // Ensure dy is grocery
    }

    if (Object.keys(updateObj).length > 0) {
      console.log(`Updating location for ${v.shop_name}...`);
      const { error: updErr } = await supabase.from('vendors').update(updateObj).eq('id', v.id);
      if (updErr) console.error(`Error updating ${v.shop_name}:`, updErr);
    }
  }

  // Helper function to upsert a vendor
  async function ensureVendor(shopName, ownerName, type, city, pincode, address, phone) {
    const { data: existing } = await supabase.from('vendors').select('id').eq('shop_name', shopName).eq('pincode', pincode).maybeSingle();
    if (existing) {
      console.log(`Vendor ${shopName} already exists at ${pincode}.`);
      return existing.id;
    }
    console.log(`Creating vendor ${shopName} at ${pincode}...`);
    const { data, error } = await supabase.from('vendors').insert({
      shop_name: shopName,
      owner_name: ownerName,
      type: type,
      city: city,
      pincode: pincode,
      address: address,
      phone: phone,
      status: 'active'
    }).select('id').single();

    if (error) {
      console.error(`Error creating ${shopName}:`, error);
      return null;
    }
    return data.id;
  }

  // Ensure Delhi Category Vendors
  const delhiGroceryId = await ensureVendor('Delhi Daily Needs', 'Delhi Grocery Owner', 'grocery', 'Delhi', '110001', 'Delhi Central Market', '1111111111');
  const delhiPharmacyId = await ensureVendor('Delhi Medico', 'Delhi Pharmacist', 'pharmacy', 'Delhi', '110001', 'Delhi Med Center', '2222222222');
  const delhiFlowersId = await ensureVendor('Delhi Florist', 'Delhi Florist Owner', 'flowers', 'Delhi', '110001', 'Delhi Flower Market', '3333333333');

  // Ensure Gauripur Category Vendors
  const { data: dyVendor } = await supabase.from('vendors').select('id').eq('shop_name', 'dy').maybeSingle();
  const gauripurGroceryId = dyVendor ? dyVendor.id : await ensureVendor('dy', 'bjhg', 'grocery', 'Gauripur', '783331', 'dy store', '0000000000');
  const gauripurPharmacyId = await ensureVendor('Assam Pharmacy', 'Gauripur Pharmacist', 'pharmacy', 'Gauripur', '783331', 'Gauripur Bazaar', '4444444444');
  const gauripurFlowersId = await ensureVendor('Assam Blooms', 'Gauripur Florist Owner', 'flowers', 'Gauripur', '783331', 'Gauripur Main Rd', '5555555555');

  // Clean and repopulate products tables
  console.log("Cleaning products tables...");
  await supabase.from('grocery_products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('pharmacy_medicines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('flower_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Repopulating products with correct vendor_ids...");

  // Grocery
  if (delhiGroceryId) {
    for (const p of groceryProductsData) {
      await supabase.from('grocery_products').insert({ ...p, vendor_id: delhiGroceryId, is_active: true });
    }
  }
  if (gauripurGroceryId) {
    for (const p of groceryProductsData) {
      await supabase.from('grocery_products').insert({ ...p, name: `Gauripur ${p.name}`, vendor_id: gauripurGroceryId, is_active: true });
    }
  }

  // Pharmacy
  if (delhiPharmacyId) {
    for (const p of pharmacyMedicinesData) {
      await supabase.from('pharmacy_medicines').insert({ ...p, vendor_id: delhiPharmacyId, is_active: true });
    }
  }
  if (gauripurPharmacyId) {
    for (const p of pharmacyMedicinesData) {
      await supabase.from('pharmacy_medicines').insert({ ...p, name: `Gauripur ${p.name}`, vendor_id: gauripurPharmacyId, is_active: true });
    }
  }

  // Flowers
  if (delhiFlowersId) {
    for (const p of flowerItemsData) {
      await supabase.from('flower_items').insert({ ...p, vendor_id: delhiFlowersId, is_active: true });
    }
  }
  if (gauripurFlowersId) {
    for (const p of flowerItemsData) {
      await supabase.from('flower_items').insert({ ...p, name: `Gauripur ${p.name}`, vendor_id: gauripurFlowersId, is_active: true });
    }
  }

  console.log("Database update and seed completed successfully!");
}

run();
