import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpmhexjwctlpaxvvlofk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbWhleGp3Y3RscGF4dnZsb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjA3MjMsImV4cCI6MjA5MjQzNjcyM30.zFj-UxL-G6A5EralvbDAWTTgn7YznMRfD4-FwQ-rxbQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, owner_name, shop_name, type, city, pincode, status');
  if (error) {
    console.error('Error fetching vendors:', error);
  } else {
    console.log('Vendors list:');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
