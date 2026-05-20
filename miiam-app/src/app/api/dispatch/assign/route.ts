import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Order {
  id: string;
  vendor_lat: number;
  vendor_lng: number;
  delivery_lat: number;
  delivery_lng: number;
  status: string;
  rider_id: string | null;
}

interface Rider {
  id: string;
  current_lat: number;
  current_lng: number;
  is_online: boolean;
  is_available: boolean;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateRiderScore(rider: Rider, order: Order): number {
  const vendorDistance = calculateDistance(
    rider.current_lat, rider.current_lng,
    order.vendor_lat, order.vendor_lng
  );
  
  const deliveryDistance = calculateDistance(
    order.vendor_lat, order.vendor_lng,
    order.delivery_lat, order.delivery_lng
  );
  
  const totalDistance = vendorDistance + deliveryDistance;
  
  const baseScore = 100;
  const distancePenalty = Math.min(totalDistance * 2, 50);
  
  return Math.max(0, baseScore - distancePenalty);
}

export async function POST(request: NextRequest) {
  try {
    const { order_id, rider_id, force_assign = false } = await request.json();

    if (!order_id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.rider_id) {
      return NextResponse.json({ 
        error: "Order already assigned",
        assigned_to: order.rider_id 
      }, { status: 400 });
    }

    if (rider_id && !force_assign) {
      const { data: rider } = await supabase
        .from("riders")
        .select("*")
        .eq("id", rider_id)
        .eq("is_online", true)
        .single();

      if (!rider) {
        return NextResponse.json({ error: "Rider not available" }, { status: 400 });
      }

      const { error: assignError } = await supabase
        .from("orders")
        .update({ 
          rider_id: rider_id,
          status: "accepted",
          assigned_at: new Date().toISOString()
        })
        .eq("id", order_id);

      if (assignError) {
        return NextResponse.json({ error: "Failed to assign rider" }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Manual assignment successful",
        rider_id 
      });
    }

    const { data: availableRiders } = await supabase
      .from("riders")
      .select("*")
      .eq("is_online", true)
      .eq("is_available", true)
      .eq("verification_status", "verified");

    if (!availableRiders || availableRiders.length === 0) {
      return NextResponse.json({ 
        error: "No riders available",
        suggested_action: "queue_order"
      }, { status: 404 });
    }

    const scoredRiders = availableRiders.map(rider => ({
      ...rider,
      score: calculateRiderScore(rider, order)
    }));

    scoredRiders.sort((a, b) => b.score - a.score);

    const bestRider = scoredRiders[0];

    const { error: assignError } = await supabase
      .from("orders")
      .update({ 
        rider_id: bestRider.id,
        status: "accepted",
        assigned_at: new Date().toISOString()
      })
      .eq("id", order_id);

    if (assignError) {
      return NextResponse.json({ error: "Failed to assign rider" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Auto-assignment successful",
      assigned_rider: {
        id: bestRider.id,
        name: bestRider.name,
        phone: bestRider.phone,
        distance: calculateDistance(
          bestRider.current_lat, bestRider.current_lng,
          order.vendor_lat, order.vendor_lng
        ).toFixed(1) + " km"
      },
      alternatives: scoredRiders.slice(1, 4).map(r => ({
        id: r.id,
        name: r.name,
        score: r.score
      }))
    });

  } catch (error) {
    console.error("Dispatch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("id, status, rider_id, vendor_lat, vendor_lng, delivery_lat, delivery_lng")
    .is("rider_id", null)
    .in("status", ["pending", "accepted"]);

  const { data: availableRiders } = await supabase
    .from("riders")
    .select("id, name, current_lat, current_lng, is_online")
    .eq("is_online", true)
    .eq("is_available", true);

  return NextResponse.json({
    unassigned_orders: pendingOrders?.length || 0,
    available_riders: availableRiders?.length || 0,
    timestamp: new Date().toISOString()
  });
}