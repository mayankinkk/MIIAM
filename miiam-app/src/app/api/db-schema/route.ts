import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const requiredTables = [
  "users",
  "profiles",
  "vendors",
  "menu_items",
  "orders",
  "order_items",
  "riders",
  "reviews",
  "notifications",
  "addresses",
  "coupons",
  "promo_codes",
  "banners",
  "categories",
  "cuisines",
  "user_push_tokens",
  "pending_notifications",
  "job_applications",
  "service_bookings",
];

export async function GET() {
  try {
    const supabase = await createClient();
    const results: Record<string, any> = {};
    let allTablesExist = true;

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("count")
          .limit(1)
          .single();

        results[table] = {
          exists: !error,
          count: data?.count || 0,
          error: error?.message,
        };

        if (error) allTablesExist = false;
      } catch (err: any) {
        results[table] = {
          exists: false,
          error: err.message,
        };
        allTablesExist = false;
      }
    }

    // Check RLS policies
    const rlsStatus: Record<string, boolean> = {};
    for (const table of requiredTables.slice(0, 5)) {
      try {
        const { data } = await supabase.rpc('get_rls_status', { table_name: table });
        rlsStatus[table] = data;
      } catch {
        rlsStatus[table] = false;
      }
    }

    return NextResponse.json({
      success: allTablesExist,
      databaseConnected: true,
      tables: results,
      rlsEnabled: rlsStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        databaseConnected: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}