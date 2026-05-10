import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test 1: Check vendors table
    const { data: vendors, error: vendorsError } = await supabase
      .from("vendors")
      .select("id, shop_name")
      .limit(3);

    // Test 2: Check users table
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .limit(3);

    // Test 3: Check orders table
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status")
      .limit(3);

    // Test 4: Check riders table
    const { data: riders, error: ridersError } = await supabase
      .from("riders")
      .select("id, name")
      .limit(3);

    const results = {
      connected: true,
      tables: {
        vendors: { status: vendorsError ? "error" : "ok", count: vendors?.length || 0 },
        users: { status: usersError ? "error" : "ok", count: users?.length || 0 },
        orders: { status: ordersError ? "error" : "ok", count: orders?.length || 0 },
        riders: { status: ridersError ? "error" : "ok", count: riders?.length || 0 },
      },
      sampleData: {
        vendors: vendors || [],
        users: users || [],
        orders: orders || [],
        riders: riders || [],
      },
      errors: {
        vendors: vendorsError?.message,
        users: usersError?.message,
        orders: ordersError?.message,
        riders: ridersError?.message,
      },
    };

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }
}