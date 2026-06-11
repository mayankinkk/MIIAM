import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  try {
    const { email, full_name, phone, city, state } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Only allow updating own profile
    if (cleanEmail !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: "Cannot update another user's profile" }, { status: 403 });
    }

    const profileData: Record<string, any> = {
      id: user.id,
      full_name,
      phone,
      email: cleanEmail,
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    if (city) profileData.city = city;
    if (state) profileData.state = state;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profileData);

    if (profileError) {
      console.error("[save-profile] Profile error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    console.error("[save-profile] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
