const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { error: e1 } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;' });
  const { error: e2 } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT false;' });
  console.log(e1 || e2 || 'done');
}
run();
