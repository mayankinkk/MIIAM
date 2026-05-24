import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { rows } = await query("SELECT * FROM site_settings ORDER BY key ASC");

  const settings: Record<string, string> = {};
  (rows || []).forEach((row: any) => {
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

    const { rows: existingRows } = await query("SELECT id FROM site_settings WHERE key = $1", [key]);
    const existing = existingRows[0];

    let result;
    if (existing) {
      const { rows } = await query(
        "UPDATE site_settings SET value = $1, updated_at = $2 WHERE key = $3 RETURNING *",
        [value, new Date().toISOString(), key]
      );
      result = rows[0];
    } else {
      const { rows } = await query(
        "INSERT INTO site_settings (key, value) VALUES ($1, $2) RETURNING *",
        [key, value]
      );
      result = rows[0];
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
      const { rows: existingRows } = await query("SELECT id FROM site_settings WHERE key = $1", [update.key]);
      const existing = existingRows[0];

      if (existing) {
        await query(
          "UPDATE site_settings SET value = $1, updated_at = $2 WHERE key = $3",
          [update.value, update.updated_at, update.key]
        );
      } else {
        await query(
          "INSERT INTO site_settings (key, value) VALUES ($1, $2)",
          [update.key, update.value]
        );
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Settings bulk update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}