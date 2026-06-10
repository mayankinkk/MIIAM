const supabaseUrl = 'https://lpmhexjwctlpaxvvlofk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbWhleGp3Y3RscGF4dnZsb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NjA3MjMsImV4cCI6MjA5MjQzNjcyM30.zFj-UxL-G6A5EralvbDAWTTgn7YznMRfD4-FwQ-rxbQ';

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/menu_items?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const data = await res.json();
    console.log('Single menu item details:');
    console.log(data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
