require('dotenv').config({ path: '.env.local' });
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sign up a test user
  const email = `testvendor_${Date.now()}@example.com`;
  const resAuth = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
    body: JSON.stringify({ email, password: 'password123' })
  });
  const authData = await resAuth.json();
  
  if (!authData.session) {
    console.log('Signup might require email confirmation, cannot test RLS easily. Trying login with an existing user if possible.');
    return;
  }
  
  const token = authData.session.access_token;
  const userId = authData.user.id;
  console.log("Signed up & logged in user:", userId);

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

  const res = await fetch(`${url}/rest/v1/vendors`, {
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
