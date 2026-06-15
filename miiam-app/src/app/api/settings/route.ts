import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/security";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { user, isAdmin: profile?.role === "admin" };
}

export async function GET() {
  const { user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true });

  const settings: Record<string, string> = {};
  (rows || []).forEach((row: any) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const { user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    let result;
    if (existing) {
      const { data } = await supabase
        .from("site_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key)
        .select()
        .single();
      result = data;
    } else {
      const { data } = await supabase
        .from("site_settings")
        .insert({ key, value })
        .select()
        .single();
      result = data;
    }

    return NextResponse.json({ success: true, setting: result });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Settings object required" }, { status: 400 });
    }

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", update.key)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ value: update.value, updated_at: update.updated_at })
          .eq("key", update.key);
      } else {
        await supabase
          .from("site_settings")
          .insert({ key: update.key, value: update.value });
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Settings bulk update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
