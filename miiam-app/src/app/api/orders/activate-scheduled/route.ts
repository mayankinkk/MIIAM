import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Get all scheduled orders that should be activated
    // Orders that have scheduled time in the past
    const now = new Date().toISOString();

    // First, find orders with scheduled time that has passed
    const { data: scheduledOrders, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "scheduled")
      .or("scheduled_time.lt." + now)
      .or("special_instructions.like.%at%");

    if (fetchError) {
      console.error("[activate-scheduled] Fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!scheduledOrders || scheduledOrders.length === 0) {
      return NextResponse.json({ message: "No scheduled orders to activate", activated: 0 });
    }

    let activatedCount = 0;

    for (const order of scheduledOrders) {
      // Parse the scheduled time from special_instructions (format: "Monday, 15 May at 01:00 PM - 03:00 PM")
      const scheduledTimeStr = order.special_instructions;
      
      if (scheduledTimeStr) {
        // Extract date and time from the string
        const timeMatch = scheduledTimeStr.match(/at\s+(.+)$/);
        const dateMatch = scheduledTimeStr.match(/^(.+?)\s+at/);
        
        if (timeMatch && dateMatch) {
          const timePart = timeMatch[1].trim(); // "01:00 PM - 03:00 PM"
          const datePart = dateMatch[1].trim(); // "Monday, 15 May"
          
          // Get the start time (first time slot)
          const startTime = timePart.split(" - ")[0].trim(); // "01:00 PM"
          
          // Combine date and time
          const scheduledDateTime = new Date(`${datePart} ${startTime}`);
          
          // If scheduled time has passed, activate the order
          if (scheduledDateTime <= new Date()) {
            const { error: updateError } = await supabase
              .from("orders")
              .update({ 
                status: "pending",
                special_instructions: order.special_instructions + " [ACTIVATED]"
              })
              .eq("id", order.id);

            if (!updateError) {
              activatedCount++;
              console.log(`[activate-scheduled] Activated order ${order.id}`);

              // Send notification to user
              await supabase.from("notifications").insert({
                user_id: order.user_id,
                title: "Order Ready! 🚀",
                body: `Your scheduled order is now active and ready for delivery.`,
                type: "order_activated",
                order_id: order.id
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      message: `Activated ${activatedCount} scheduled orders`,
      activated: activatedCount
    });

  } catch (error: any) {
    console.error("[activate-scheduled] Error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}

// Also allow GET for cron job
export async function GET() {
  return POST(new NextRequest("http://localhost"));
}