import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lpmhexjwctlpaxvvlofk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbWhleGp3Y3RscGF4dnZsb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjA3MjMsImV4cCI6MjA5MjQzNjcyM30.zFj-UxL-G6A5EralvbDAWTTgn7YznMRfD4-FwQ-rxbQ";

const supabase = createClient(supabaseUrl, supabaseKey);

const groceryProducts = [
  { name: "Organic Apples (1kg)", category: "Fruits", price: 180, stock: 50, image_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400" },
  { name: "Fresh Bananas (1 dozen)", category: "Fruits", price: 60, stock: 100, image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86279?w=400" },
  { name: "Organic Spinach (500g)", category: "Vegetables", price: 45, stock: 30, image_url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400" },
  { name: "Fresh Tomatoes (1kg)", category: "Vegetables", price: 50, stock: 40, image_url: "https://images.unsplash.com/photo-1546470427-227c7a715614?w=400" },
  { name: "Farm Fresh Eggs (12pcs)", category: "Dairy", price: 80, stock: 200, image_url: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400" },
  { name: "Amul Milk (1L)", category: "Dairy", price: 45, stock: 150, image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
  { name: "Whole Wheat Bread", category: "Bakery", price: 40, stock: 60, image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
  { name: "Basmati Rice (5kg)", category: "Pulses", price: 450, stock: 25, image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
  { name: "Toor Dal (1kg)", category: "Pulses", price: 120, stock: 35, image_url: "https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=400" },
  { name: "Extra Virgin Olive Oil (1L)", category: "Oils", price: 350, stock: 20, image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
  { name: "Turmeric Powder (500g)", category: "Spices", price: 80, stock: 45, image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400" },
  { name: "Green Tea (100 bags)", category: "Beverages", price: 150, stock: 80, image_url: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400" },
];

const pharmacyMedicines = [
  { name: "Dolo 650 (Strip of 15)", category: "Pain Relief", price: 35, stock: 100, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
  { name: "Crosin 500 (Strip of 10)", category: "Pain Relief", price: 25, stock: 150, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400" },
  { name: "Augmentin 625 (Strip of 6)", category: "Antibiotics", price: 180, stock: 30, requires_prescription: true, image_url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
  { name: "Centrum Multi-Vitamin (60 tablets)", category: "Vitamins", price: 450, stock: 40, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400" },
  { name: "Glucobay 50 (30 tablets)", category: "Diabetes", price: 280, stock: 25, requires_prescription: true, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
  { name: "Telma 40 (30 tablets)", category: "Blood Pressure", price: 220, stock: 35, requires_prescription: true, image_url: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400" },
  { name: "Corex DX Syrup (100ml)", category: "Cold & Flu", price: 95, stock: 50, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
  { name: "Moisturizing Lotion (500ml)", category: "Skin Care", price: 250, stock: 45, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1571781565023-4d619426f83c?w=400" },
  { name: "ORS Powder (10 sachets)", category: "Baby Care", price: 35, stock: 80, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
  { name: "Combiflam (Strip of 10)", category: "Pain Relief", price: 20, stock: 120, requires_prescription: false, image_url: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=400" },
];

const flowerItems = [
  { name: "Classic Red Rose Bouquet (12 roses)", category: "Bouquets", price: 450, description: "Beautiful 12 red roses with decorative wrapper", image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400" },
  { name: "Mixed Flower Arrangement", category: "Arrangements", price: 680, description: "Assorted seasonal flowers in a vase", image_url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400" },
  { name: "Birthday Combo (Flowers + Cake)", category: "Combos", price: 890, description: "Rose bouquet with chocolate cake", image_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400" },
  { name: "Gift Hamper (Flowers + Chocolates)", category: "Hampers", price: 1200, description: "Premium flowers with assorted chocolates", image_url: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400" },
  { name: "Sympathy Lilies", category: "Sympathy", price: 550, description: "White lilies for condolences", image_url: "https://images.unsplash.com/photo-1522758971460-1d21eed7dc1d?w=400" },
  { name: "Tulip Bouquet (10 stems)", category: "Bouquets", price: 600, description: "Colorful tulips with wrapper", image_url: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400" },
  { name: "Sunflower Arrangement", category: "Arrangements", price: 480, description: "Bright sunflowers in a rustic vase", image_url: "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=400" },
  { name: "Corporate Bouquet", category: "Corporate", price: 800, description: "Professional arrangement for business", image_url: "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=400" },
];

const foodVendors = [
  { shop_name: "Pizza Hut", cuisine: "Pizza", address: "Connaught Place, Delhi", phone: "+919876543210", owner_name: "John Smith" },
  { shop_name: "Domino's Pizza", cuisine: "Pizza", address: "Karol Bagh, Delhi", phone: "+919876543211", owner_name: "Mike Johnson" },
  { shop_name: "McDonald's", cuisine: "Burgers", address: "Rajouri Garden, Delhi", phone: "+919876543212", owner_name: "Robert Brown" },
  { shop_name: "KFC", cuisine: "Burgers", address: "Nehru Place, Delhi", phone: "+919876543213", owner_name: "David Wilson" },
  { shop_name: "Biryani House", cuisine: "Biryani", address: "Lajpat Nagar, Delhi", phone: "+919876543214", owner_name: "Ahmed Khan" },
  { shop_name: "Golden Dragon", cuisine: "Chinese", address: "Saket, Delhi", phone: "+919876543215", owner_name: "Chen Wei" },
];

const menuItems = [
  { vendor_idx: 0, name: "Margherita Pizza (Medium)", category: "Pizza", price: 399 },
  { vendor_idx: 0, name: "Pepperoni Pizza (Large)", category: "Pizza", price: 599 },
  { vendor_idx: 0, name: "Garlic Breadsticks", category: "Sides", price: 149 },
  { vendor_idx: 1, name: "Cheese Pizza (Medium)", category: "Pizza", price: 349 },
  { vendor_idx: 1, name: "Chicken Dominator", category: "Pizza", price: 549 },
  { vendor_idx: 1, name: "Chocolate Lava Cake", category: "Desserts", price: 199 },
  { vendor_idx: 2, name: "McAloo Tikki Burger", category: "Burgers", price: 149 },
  { vendor_idx: 2, name: "Chicken McGrill", category: "Burgers", price: 249 },
  { vendor_idx: 2, name: "French Fries (Large)", category: "Sides", price: 120 },
  { vendor_idx: 3, name: "Zinger Burger", category: "Burgers", price: 299 },
  { vendor_idx: 3, name: "Chicken Wings (6 pcs)", category: "Sides", price: 249 },
  { vendor_idx: 3, name: "Popcorn Chicken", category: "Sides", price: 199 },
  { vendor_idx: 4, name: "Chicken Biryani (Half)", category: "Biryani", price: 199 },
  { vendor_idx: 4, name: "Chicken Biryani (Full)", category: "Biryani", price: 349 },
  { vendor_idx: 4, name: "Mutton Biryani (Full)", category: "Biryani", price: 449 },
  { vendor_idx: 5, name: "Veg Fried Rice", category: "Chinese", price: 199 },
  { vendor_idx: 5, name: "Chicken Manchurian", category: "Chinese", price: 249 },
  { vendor_idx: 5, name: "Spring Rolls (4 pcs)", category: "Chinese", price: 149 },
];

async function seedDatabase() {
  console.log("Starting database seeding...\n");

  console.log("Seeding grocery products...");
  for (const product of groceryProducts) {
    const { error } = await supabase.from("grocery_products").insert({
      ...product,
      is_active: true,
    });
    if (error) console.log(`  Error: ${error.message}`);
    else console.log(`  Added: ${product.name}`);
  }

  console.log("\nSeeding pharmacy medicines...");
  for (const medicine of pharmacyMedicines) {
    const { error } = await supabase.from("pharmacy_medicines").insert({
      ...medicine,
      is_active: true,
    });
    if (error) console.log(`  Error: ${error.message}`);
    else console.log(`  Added: ${medicine.name}`);
  }

  console.log("\nSeeding flower items...");
  for (const item of flowerItems) {
    const { error } = await supabase.from("flower_items").insert({
      ...item,
      is_active: true,
    });
    if (error) console.log(`  Error: ${error.message}`);
    else console.log(`  Added: ${item.name}`);
  }

  console.log("\nSeeding food vendors...");
  const vendorIds: string[] = [];
  for (const vendor of foodVendors) {
    const { data, error } = await supabase.from("vendors").insert({
      shop_name: vendor.shop_name,
      cuisine: vendor.cuisine,
      address: vendor.address,
      phone: vendor.phone,
      owner_name: vendor.owner_name,
    }).select().single();
    if (error) console.log(`  Error: ${error.message}`);
    else {
      console.log(`  Added vendor: ${vendor.shop_name}`);
      if (data) vendorIds.push(data.id);
    }
  }

  console.log("\nSeeding food menu items...");
  for (const item of menuItems) {
    const vendorId = vendorIds[item.vendor_idx];
    if (!vendorId) continue;
    const { error } = await supabase.from("menu_items").insert({
      vendor_id: vendorId,
      name: item.name,
      category: item.category,
      price: item.price,
    });
    if (error) console.log(`  Error: ${error.message}`);
    else console.log(`  Added: ${item.name}`);
  }

  console.log("\nDatabase seeding complete!");
  console.log("\nYou can also add more items through the admin dashboard:");
  console.log("- Grocery: /admin/grocery");
  console.log("- Pharmacy: /admin/pharmacy");
  console.log("- Flowers: /admin/flowers");
  console.log("- Food: Add vendors first at /admin/vendors");
}

seedDatabase().catch(console.error);