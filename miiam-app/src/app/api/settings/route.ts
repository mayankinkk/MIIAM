import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
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
      .single();

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
        .single();

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