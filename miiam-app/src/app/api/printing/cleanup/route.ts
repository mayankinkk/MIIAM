import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRINTING_VENDOR_ID } from "@/lib/constants";

const FINAL_STATUSES = ["delivered", "cancelled", "refunded"] as const;

async function deletePrintFiles(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: orders, error: fetchError } = await supabase
    .from("orders")
    .select("id")
    .eq("vendor_id", PRINTING_VENDOR_ID)
    .in("status", FINAL_STATUSES)
    .is("print_files_cleaned", null);

  if (fetchError) {
    console.error("[printing-cleanup] Fetch error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ message: "No print files to clean up", cleaned: 0 });
  }

  let cleanedCount = 0;
  const orderIds = orders.map(o => o.id);

  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, special_notes")
    .in("order_id", orderIds);

  if (!items) {
    return NextResponse.json({ message: "No order items found", cleaned: 0 });
  }

  const pathsToDelete: string[] = [];

  for (const item of items) {
    if (!item.special_notes) continue;
    try {
      const settings = JSON.parse(item.special_notes);
      const urls: string[] = settings.fileUrls || [];
      for (const url of urls) {
        const path = url.split("/menu-images/")[1];
        if (path) pathsToDelete.push(path);
      }
    } catch {}
  }

  if (pathsToDelete.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("menu-images")
      .remove(pathsToDelete);

    if (removeError) {
      console.error("[printing-cleanup] Storage remove error:", removeError);
    } else {
      cleanedCount = pathsToDelete.length;
    }
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ print_files_cleaned: true })
    .in("id", orderIds);

  if (updateError) {
    console.error("[printing-cleanup] Failed to mark orders cleaned:", updateError);
  }

  return NextResponse.json({
    message: `Cleaned up ${cleanedCount} file(s) across ${orders.length} order(s)`,
    cleaned: cleanedCount,
    orders: orders.length,
  });
}

async function requireCronAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || request.headers.get("x-cron-secret");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader === `Bearer ${secret}`) return true;
  if (!secret) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await requireCronAuth(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = await createClient();
    return await deletePrintFiles(supabase);
  } catch (error: any) {
    console.error("[printing-cleanup] Error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
