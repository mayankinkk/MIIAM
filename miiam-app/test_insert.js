require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  // First login as some user or just fetch a user token if we can't login, we can use service role key
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: users } = await adminSupabase.auth.admin.listUsers();
  if (users.users.length === 0) return console.log("No users found");
  
  const user = users.users[0];
  console.log("Testing with user:", user.id);

  // But we need anon client with the user's JWT to test RLS properly... 
  // Wait, let's just use service_role to insert first to see if there's any DB schema error!
  const payload = {
    owner_name: "Test Owner",
    phone: "1234567890",
    email: user.email,
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
    user_id: user.id,
    status: "pending"
  };

  const { data, error } = await adminSupabase.from("vendors").insert(payload);
  console.log("Insert result:", { data, error });
}
main();
