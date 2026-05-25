import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reviewId, reply } = body;

    if (!reviewId || !reply?.trim()) {
      return NextResponse.json({ error: "reviewId and reply are required" }, { status: 400 });
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const { error } = await supabase
      .from("reviews")
      .update({ vendor_reply: reply.trim(), vendor_reply_at: new Date().toISOString() })
      .eq("id", reviewId)
      .eq("vendor_id", vendor.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) return NextResponse.json({ error: "reviewId required" }, { status: 400 });

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const { error } = await supabase
      .from("reviews")
      .update({ vendor_reply: null, vendor_reply_at: null })
      .eq("id", reviewId)
      .eq("vendor_id", vendor.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
