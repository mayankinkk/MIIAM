import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();
  
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log("[create-user] email:", cleanEmail);

    let userId = null;

    // Find existing user using listUsers (getUserByEmail does NOT exist in supabase-js)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error("[create-user] listUsers error:", listError);
      return NextResponse.json({ error: "Failed to look up users" }, { status: 500 });
    }

    const existingUser = users?.find(u => u.email?.toLowerCase() === cleanEmail);

    if (existingUser) {
      // User exists - update password and confirm email
      console.log("[create-user] Found existing user:", existingUser.id);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        email: cleanEmail,
        password,
        email_confirm: true,
      });

      if (updateError) {
        console.error("[create-user] Update error:", updateError);
        return NextResponse.json({ error: updateError.message || "Failed to update account" }, { status: 500 });
      }

      userId = existingUser.id;
      console.log("[create-user] Updated existing user:", userId);
    } else {
      // User doesn't exist - create new with confirmed email
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { email: cleanEmail },
      });

      if (createError) {
        console.error("[create-user] Create error:", createError);
        return NextResponse.json({ error: createError.message || "Failed to create account" }, { status: 500 });
      }

      userId = newUser.user.id;
      console.log("[create-user] Created new user:", userId);
    }

    if (!userId) {
      return NextResponse.json({ error: "Failed to create or find user" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId,
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("[create-user] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}