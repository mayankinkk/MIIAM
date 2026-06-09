const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lpmhexjwctlpaxvvlofk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbWhleGp3Y3RscGF4dnZsb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjA3MjMsImV4cCI6MjA5MjQzNjcyM30.zFj-UxL-G6A5EralvbDAWTTgn7YznMRfD4-FwQ-rxbQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: gp } = await supabase.from('grocery_products').select('id, name, vendor_id').limit(5);
  console.log('Grocery Products:');
  console.log(gp);

  const { data: pm } = await supabase.from('pharmacy_medicines').select('id, name, vendor_id').limit(5);
  console.log('Pharmacy Medicines:');
  console.log(pm);

  const { data: fi } = await supabase.from('flower_items').select('id, name, vendor_id').limit(5);
  console.log('Flower Items:');
  console.log(fi);
}

run();
