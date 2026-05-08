import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Find orders that have expired (no rider assigned after 5 min) and haven't notified user
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: expiredOrders, error } = await supabase
      .from("orders")
      .select("id, user_id, placed_at")
      .is("rider_id", null)
      .eq("status", "pending")
      .lt("placed_at", fiveMinutesAgo)
      .eq("no_rider_notified", false);
    
    if (error) {
      console.error("Error fetching expired orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ processed: 0, message: "No expired orders" });
    }
    
    // Process each expired order
    let processedCount = 0;
    for (const order of expiredOrders) {
      // Mark order as no rider available
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          no_rider_notified: true, 
          status: 'no_rider_available',
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id);
      
      if (updateError) {
        console.error("Error updating order:", updateError);
        continue;
      }
      
      // Create notification for user
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: order.user_id,
          title: "No Rider Available",
          message: "Sorry, no riders are available for your order right now. Please try again in a few minutes.",
          type: "order_failed",
          read: false,
          icon: "local_shipping"
        });
      
      if (!notifError) {
        processedCount++;
      }
    }
    
    return NextResponse.json({ 
      processed: processedCount, 
      message: `Processed ${processedCount} expired orders` 
    });
  } catch (error: any) {
    console.error("Error in check-expired-orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}