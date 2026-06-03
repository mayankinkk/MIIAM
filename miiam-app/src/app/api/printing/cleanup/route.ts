import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRINTING_VENDOR_ID } from "@/lib/constants";

const FINAL_STATUSES = ["delivered", "cancelled", "refunded"] as const;

const ABANDONED_TTL_MS = 24 * 60 * 60 * 1000;

async function cleanPrintedFiles(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: orders, error: fetchError } = await supabase
    .from("orders")
    .select("id")
    .eq("vendor_id", PRINTING_VENDOR_ID)
    .in("status", FINAL_STATUSES)
    .is("print_files_cleaned", null);

  if (fetchError) {
    return { error: fetchError.message, cleaned: 0, abandoned: 0, orders: 0 };
  }

  let cleanedCount = 0;
  const orderIds = orders?.map(o => o.id) || [];
  const pathsFromOrders: string[] = [];

  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, special_notes")
      .in("order_id", orderIds);

    if (items) {
      for (const item of items) {
        if (!item.special_notes) continue;
        try {
          const settings = JSON.parse(item.special_notes);
          const urls: string[] = settings.fileUrls || [];
          for (const url of urls) {
            const path = url.split("/menu-images/")[1];
            if (path) pathsFromOrders.push(path);
          }
        } catch {}
      }
    }
  }

  if (pathsFromOrders.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("menu-images")
      .remove(pathsFromOrders);
    if (!removeError) cleanedCount = pathsFromOrders.length;
  }

  if (orderIds.length > 0) {
    await supabase
      .from("orders")
      .update({ print_files_cleaned: true })
      .in("id", orderIds);
  }

  return { cleaned: cleanedCount, abandoned: 0, orders: orderIds.length };
}

async function cleanAbandonedUploads(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: files, error } = await supabase.storage
    .from("menu-images")
    .list("prints", { limit: 500 });

  if (error || !files) return 0;

  const cutoff = Date.now() - ABANDONED_TTL_MS;
  const oldFiles = files.filter(f => {
    const created = f.created_at ? new Date(f.created_at).getTime() : 0;
    return created > 0 && created < cutoff;
  });

  if (oldFiles.length === 0) return 0;

  const paths = oldFiles.map(f => `prints/${f.name}`);
  const { error: removeError } = await supabase.storage.from("menu-images").remove(paths);
  if (removeError) {
    console.error("[printing-cleanup] Abandoned file remove error:", removeError);
    return 0;
  }
  return oldFiles.length;
}

async function handleCleanup(supabase: Awaited<ReturnType<typeof createClient>>) {
  const orderResult = await cleanPrintedFiles(supabase);
  const abandonedCount = await cleanAbandonedUploads(supabase);

  return NextResponse.json({
    message: `Cleaned ${orderResult.cleaned} completed file(s) across ${orderResult.orders} order(s), ${abandonedCount} abandoned upload(s)`,
    cleaned: orderResult.cleaned,
    abandoned: abandonedCount,
    orders: orderResult.orders,
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
    return await handleCleanup(supabase);
  } catch (error: any) {
    console.error("[printing-cleanup] Error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
