const fs = require('fs');

const envContent = fs.readFileSync('/home/mayank/Downloads/MIIAM Final UI/miiam-app/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/vendors?select=id,shop_name,email,user_id`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const vendors = await res.json();
    console.log('--- VENDORS IN DB ---');
    console.log(vendors);
  } catch (err) {
    console.error('Error fetching vendors:', err);
  }
}

run();
