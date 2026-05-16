import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const { email, full_name, phone, city, state } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user by email
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const user = users?.find(u => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update profile using admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      full_name,
      phone,
      email: cleanEmail,
      city,
      state,
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("[save-profile] Profile error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // The profiles table already has full_name, phone, and city updated in the upsert above.
    // There is no public.users table (it's auth.users), and email_verified/phone_verified are not valid columns.
    // So we don't need a separate update to a non-existent users table.

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error("[save-profile] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
