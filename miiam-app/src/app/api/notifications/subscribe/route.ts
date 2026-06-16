import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/security";
import { withRateLimit } from "@/lib/api-utils";

export const POST = withRateLimit(async function POST(request: NextRequest) {
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Upsert push subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId || user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh || "",
          auth: subscription.keys?.auth || "",
          created_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Failed to store push subscription:", error);
      return NextResponse.json({ error: "Failed to store subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});

export const GET = withRateLimit(async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, created_at")
      .eq("user_id", user.id);

    return NextResponse.json({ subscriptions: subscriptions || [] });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
