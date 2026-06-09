const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  // First let's get any order ID to test with
  const { data: orders } = await supabase.from('orders').select('id').limit(1);
  if (!orders || orders.length === 0) {
    console.log('No orders found');
    return;
  }
  const id = orders[0].id;
  console.log('Testing with order ID:', id);

  const { data, error } = await supabase
    .from("orders")
    .select("*, vendor:vendors(*), riders:riders(*), items:order_items(*, menu_item:menu_items(*))")
    .eq("id", id)
    .single();
    
  console.log('Error:', error);
  console.log('Data:', data ? 'Got data' : 'Null data');
}
test();
