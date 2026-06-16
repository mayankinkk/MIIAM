import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkIpRateLimit, getClientIp } from "@/lib/security";

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip, 3, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Delete user data across tables
    await admin.from("notifications").delete().eq("user_id", user.id);
    await admin.from("reviews").delete().eq("user_id", user.id);
    await admin.from("service_bookings").delete().eq("user_id", user.id);
    await admin.from("orders").delete().eq("user_id", user.id);
    await admin.from("addresses").delete().eq("user_id", user.id);
    await admin.from("wallet_transactions").delete().eq("user_id", user.id);
    await admin.from("favorites").delete().eq("user_id", user.id);
    await admin.from("profiles").delete().eq("id", user.id);

    // Delete the auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("[AccountDeletion] Failed to delete auth user:", deleteError);
    }

    return NextResponse.json({ success: true, message: "Account and all data permanently deleted." });
  } catch (e) {
    console.error("[AccountDeletion] Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
