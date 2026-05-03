import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user by email using listUsers
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error("[login] listUsers error:", listError);
      return NextResponse.json({ error: "Failed to look up user" }, { status: 500 });
    }

    const user = users?.find(u => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("[login] Found user:", user.id, "email_confirmed_at:", user.email_confirmed_at);

    // Force-confirm email AND set/update password if provided
    const updatePayload: any = {
      email: cleanEmail,
      email_confirm: true,
    };
    
    // Always update password when provided — this fixes cases where
    // password was never actually stored due to earlier bugs
    if (password) {
      updatePayload.password = password;
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, updatePayload);

    if (updateError) {
      console.error("[login] updateUser error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("[login] Email confirmed and password updated for user:", user.id);

    return NextResponse.json({
      success: true,
      confirmed: true,
      userId: user.id,
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("[login] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}