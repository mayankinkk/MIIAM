import { query } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

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

    const { rows: orderRows } = await query("SELECT * FROM orders WHERE id = $1", [order_id]);
    const order = orderRows[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.rider_id) {
      return NextResponse.json({ 
        error: "Order already assigned",
        assigned_to: order.rider_id 
      }, { status: 400 });
    }

    const assignableStatuses = ["pending", "no_rider_available"];
    if (!assignableStatuses.includes(order.status)) {
      return NextResponse.json({ 
        error: `Order status "${order.status}" is not assignable` 
      }, { status: 400 });
    }

    if (rider_id && !force_assign) {
      const { rows: riderRows } = await query("SELECT * FROM riders WHERE id = $1 AND is_online = $2", [rider_id, true]);
      const rider = riderRows[0];

      if (!rider) {
        return NextResponse.json({ error: "Rider not available" }, { status: 400 });
      }

      const { rows: rpcRows } = await query("SELECT accept_order_as_rider($1, $2) AS success", [order_id, rider_id]);
      const rpcSuccess = rpcRows[0]?.success;

      if (!rpcSuccess) {
        return NextResponse.json({ error: "Failed to assign rider — order may already be taken" }, { status: 409 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Manual assignment successful",
        rider_id 
      });
    }

    const { rows: availableRiders } = await query(
      "SELECT * FROM riders WHERE is_online = $1 AND is_available = $2 AND verification_status = $3",
      [true, true, "verified"]
    );

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

    await query(
      "UPDATE orders SET rider_id = $1, status = $2, assigned_at = $3 WHERE id = $4",
      [bestRider.id, "accepted", new Date().toISOString(), order_id]
    );

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
  const { rows: pendingOrders } = await query(
    "SELECT id, status, rider_id, vendor_lat, vendor_lng, delivery_lat, delivery_lng FROM orders WHERE rider_id IS NULL AND status = ANY($1)",
    [["pending", "no_rider_available"]]
  );

  const { rows: availableRiders } = await query(
    "SELECT id, name, current_lat, current_lng, is_online FROM riders WHERE is_online = $1 AND is_available = $2",
    [true, true]
  );

  return NextResponse.json({
    unassigned_orders: pendingOrders?.length || 0,
    available_riders: availableRiders?.length || 0,
    timestamp: new Date().toISOString()
  });
}