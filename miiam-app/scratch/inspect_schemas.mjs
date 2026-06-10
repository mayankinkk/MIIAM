import fs from 'fs';

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
  const tables = ['menu_items', 'grocery_products', 'pharmacy_medicines', 'flower_items'];
  for (const table of tables) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        console.log(`Table ${table} row:`, rows[0]);
      } else {
        console.error(`Failed to query ${table}:`, res.statusText);
      }
    } catch (err) {
      console.error(`Error querying ${table}:`, err);
    }
  }
}

run();
