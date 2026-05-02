import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();
  const cookieStore = await cookies();
  
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check cookie verification
    const verifiedToken = cookieStore.get("password_reset_verified")?.value;
    if (!verifiedToken) {
      return NextResponse.json({ error: "Please verify your email first" }, { status: 403 });
    }

    const [verifiedEmail] = Buffer.from(verifiedToken, "base64").toString().split(":");
    if (verifiedEmail?.toLowerCase() !== cleanEmail) {
      return NextResponse.json({ error: "Verification mismatch" }, { status: 403 });
    }

    // Find user using listUsers (getUserByEmail does NOT exist in supabase-js)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      return NextResponse.json({ error: "Failed to look up users" }, { status: 500 });
    }

    const user = users?.find(u => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update password and confirm email
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { 
      password,
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Clear the verification cookie
    cookieStore.delete("password_reset_verified");

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}