require('dotenv').config({ path: '.env.local' });
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Sign up a new user
  const email = `testvendor_${Date.now()}@example.com`;
  let res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
    body: JSON.stringify({ email, password: 'password123' })
  });
  const authData = await res.json();
  if (authData.error) return console.log('Signup error:', authData.error);
  
  const token = authData.access_token;
  const userId = authData.user.id;
  console.log("Signed up user:", userId);

  // 2. Insert vendor
  const payload = {
    owner_name: "Test Owner",
    phone: "1234567890",
    email: email,
    shop_name: "Test Shop",
    type: "food",
    cuisine: "Test",
    address: "Test",
    city: "Test",
    state: "Test",
    pincode: "123456",
    description: "Test",
    is_pure_veg: false,
    gst_number: "",
    fssai_number: "",
    pan_number: "",
    min_order_amount: 0,
    delivery_charge: 0,
    delivery_time_min: 30,
    delivery_time_max: 45,
    user_id: userId,
    status: "pending"
  };

  res = await fetch(`${url}/rest/v1/vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  if (res.ok) {
    console.log("Vendor inserted successfully!");
  } else {
    const errorBody = await res.text();
    console.log("Vendor insert failed:", res.status, errorBody);
  }
}
main();
