import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/security";
import { withRateLimit } from "@/lib/api-utils";
import { createRouteLogger } from "@/lib/logger";

const logger = createRouteLogger("settings");

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { user, isAdmin: profile?.role === "admin" };
}

export const GET = withRateLimit(async function GET() {
  const { user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true });

  const settings: Record<string, string> = {};
  (rows || []).forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json({ settings });
});

export const PUT = withRateLimit(async function PUT(request: NextRequest) {
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
    logger.error({ err: error }, "Settings error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withRateLimit(async function POST(request: NextRequest) {
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

    const updates = Object.entries(settings)
      .filter(([key]) => key && typeof key === "string")
      .map(([key, value]) => ({
        key,
        value: String(value ?? ""),
        updated_at: new Date().toISOString(),
      }));

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: "No settings to update" });
    }

    const { error } = await supabase
      .from("site_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      logger.error({ err: error }, "Supabase upsert error");
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (error) {
    logger.error({ err: error }, "Settings bulk update error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
