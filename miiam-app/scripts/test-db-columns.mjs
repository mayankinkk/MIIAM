import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpmhexjwctlpaxvvlofk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbWhleGp3Y3RscGF4dnZsb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjA3MjMsImV4cCI6MjA5MjQzNjcyM30.zFj-UxL-G6A5EralvbDAWTTgn7YznMRfD4-FwQ-rxbQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .limit(1);
  if (error) {
    console.error('Error fetching vendor:', error);
  } else {
    console.log('Single vendor details:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

run();
