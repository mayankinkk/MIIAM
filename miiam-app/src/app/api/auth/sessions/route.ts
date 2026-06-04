import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseUserAgent } from "@/lib/device";

async function getRequestMeta(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
  const device = parseUserAgent(ua);
  return { ua, ip, device };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_sessions")
      .select("id, session_token, device_info, ip_address, user_agent, location_label, is_current, last_active_at, created_at, revoked_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("last_active_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ sessions: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meta = await getRequestMeta(req);
    const body = await req.json().catch(() => ({}));
    const sessionToken = body?.session_token || crypto.randomUUID();
    const isCurrent = !!body?.is_current;
    const locationLabel = body?.location_label || null;

    const { data, error } = await supabase
      .from("user_sessions")
      .upsert(
        {
          user_id: user.id,
          session_token: sessionToken,
          device_info: meta.device,
          ip_address: meta.ip,
          user_agent: meta.ua,
          location_label: locationLabel,
          is_current: isCurrent,
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "session_token" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("login_events").insert({
      user_id: user.id,
      event_type: "login",
      ip_address: meta.ip,
      user_agent: meta.ua,
      device_info: meta.device,
      location_label: locationLabel,
      success: true,
    });

    return NextResponse.json({ session: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
