import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/security";

// SQL to create all missing service tables
const MIGRATION_SQL = `
-- Service Categories Table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Items Table
CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Providers Table
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Bookings Table
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_type VARCHAR(50) NOT NULL,
  sub_service VARCHAR(100),
  user_name VARCHAR(100) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(20) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  amount DECIMAL(10, 2) NOT NULL,
  provider_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  provider_name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_service_bookings_user_id ON service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_scheduled_date ON service_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_service_type ON service_providers(service_type);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to service_bookings" ON service_bookings;
DROP POLICY IF EXISTS "Allow full access to service_providers" ON service_providers;
DROP POLICY IF EXISTS "Allow full access to service_categories" ON service_categories;
DROP POLICY IF EXISTS "Allow full access to service_items" ON service_items;

CREATE POLICY "Allow full access to service_bookings" ON service_bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to service_providers" ON service_providers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to service_categories" ON service_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to service_items" ON service_items FOR ALL USING (true) WITH CHECK (true);

INSERT INTO service_categories (name, icon, description, display_order) VALUES
  ('AC Repair', 'ac_unit', 'Air conditioning repair and maintenance', 1),
  ('Plumbing', 'plumbing', 'Pipe, tap and drainage services', 2),
  ('Electrical', 'electrical_services', 'Wiring and electrical repairs', 3),
  ('Cleaning', 'cleaning_services', 'Home and deep cleaning services', 4),
  ('Appliance', 'kitchen', 'Home appliance repair', 5),
  ('Pest Control', 'bug_report', 'Pest and termite control', 6)
ON CONFLICT (name) DO NOTHING;

NOTIFY pgrst, 'reload schema';
`;

export async function POST(request: NextRequest) {
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // Only allow admin users
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Extract project ref from Supabase URL
  // e.g. https://abcdefghij.supabase.co → abcdefghij
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

  if (!projectRef || projectRef === supabaseUrl) {
    return NextResponse.json({ error: "Cannot determine Supabase project ref from URL" }, { status: 500 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
  }

  // Call Supabase Management API to run SQL
  // This endpoint allows DDL (CREATE TABLE, etc.)
  const mgmtApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  try {
    const response = await fetch(mgmtApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The Management API uses the service role key as a Bearer token
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Supabase Management API error:", result);
      // Fall back: try each statement separately using the pg REST approach
      return NextResponse.json({
        error: "Management API failed",
        detail: result,
        sql: MIGRATION_SQL,
        instructions: "Please run the SQL manually in your Supabase dashboard → SQL Editor",
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Service tables created successfully! Bookings should work now.",
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Migration failed:", message);
    return NextResponse.json({
      error: message,
      sql: MIGRATION_SQL,
    }, { status: 500 });
  }
}

export async function GET() {
  // Health check — verify if service_bookings table exists
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("service_bookings").select("id").limit(1);
  return NextResponse.json({
    tableExists: !error,
    error: error?.message ?? null,
    hint: error ? "Run POST /api/admin/run-migration to create the table" : null,
  });
}
