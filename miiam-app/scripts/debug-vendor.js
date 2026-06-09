const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lpmhexjwctlpaxvvlofk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbWhleGp3Y3RscGF4dnZsb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjA3MjMsImV4cCI6MjA5MjQzNjcyM30.zFj-UxL-G6A5EralvbDAWTTgn7YznMRfD4-FwQ-rxbQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, shop_name, delivery_charge')
    .eq('id', 'ecfa7389-2bf1-450c-8288-7ac3ffc821e7');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('SAA delivery_charge:', JSON.stringify(data, null, 2));
  }
}

run();
