require('dotenv').config({ path: '.env.local' });
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const payload = {
    owner_name: "Test Owner",
    phone: "1234567890",
    email: "test@example.com",
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
    status: "pending"
  };

  const res = await fetch(`${url}/rest/v1/vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
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
