import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    // Require authenticated admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabaseAdmin = createAdminClient();
    const { email, fullName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
    }

    let userRecord = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!userRecord) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
        user_metadata: { email: email.toLowerCase(), full_name: fullName || email.split('@')[0] }
      });
      
      if (createError) {
        console.error("Create user error:", createError);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      userRecord = newUser?.user;
    }

    if (!userRecord) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const { data: sessionData, error: sessionError } = await (supabaseAdmin.auth.admin as any).createSession({
      userId: userRecord.id,
    });

    if (sessionError) {
      console.error("Create session error:", sessionError);
      return NextResponse.json({ 
        success: true, 
        userId: userRecord.id,
        email: userRecord.email 
      });
    }

    return NextResponse.json({
      success: true,
      userId: userRecord.id,
      email: userRecord.email,
    });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
