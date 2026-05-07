const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://localhost:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cGFiYXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg4Mzg2MjYsImV4cCI6MTk0Mjg1NDYyNn0.abc'); // This is a dummy key, we just need the syntax for URL to fail and show error if no anon key. 
// Actually we can just run a curl against the local supabase API to get the swagger JSON.
