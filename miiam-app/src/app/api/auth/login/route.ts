import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW = 10 * 60 * 1000;

async function checkLoginRateLimit(supabase: ReturnType<typeof createAdminClient>, email: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - LOGIN_RATE_LIMIT_WINDOW).toISOString();
  const { count } = await supabase
    .from("login_events")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .eq("success", false)
    .gte("created_at", windowStart);
  return (count || 0) < LOGIN_RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabaseAdmin = createAdminClient();

    // Check rate limit before attempting login
    if (!(await checkLoginRateLimit(supabaseAdmin, cleanEmail))) {
      return NextResponse.json({ error: "Too many failed attempts. Please try again after 10 minutes." }, { status: 429 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      // Record failed attempt
      await supabaseAdmin.from("login_events").insert({
        email: cleanEmail,
        success: false,
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      userId: data.user.id,
      email: data.user.email,
    });
  } catch (error: any) {
    console.error("[login] error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
