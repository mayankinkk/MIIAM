import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    const { email, fullName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
    }

    let user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
        user_metadata: { email: email.toLowerCase(), full_name: fullName || email.split('@')[0] }
      });
      
      if (createError) {
        console.error("Create user error:", createError);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      user = newUser?.user;
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    // Create session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      userId: user.id,
    });

    if (sessionError) {
      console.error("Create session error:", sessionError);
      return NextResponse.json({ 
        success: true, 
        userId: user.id,
        email: user.email 
      });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
        expires_at: sessionData.session.expires_at,
      }
    });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}