import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage, sendOrderConfirmation, sendBookingReminder, sendServiceCompletion } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phoneNumber, ...data } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "send_custom":
        result = await sendWhatsAppMessage(
          phoneNumber,
          data.template as any,
          data.parameters
        );
        break;

      case "order_confirmed":
        result = await sendOrderConfirmation(
          phoneNumber,
          data.orderId,
          data.serviceName,
          data.amount
        );
        break;

      case "booking_reminder":
        result = await sendBookingReminder(
          phoneNumber,
          data.serviceName,
          data.date,
          data.time
        );
        break;

      case "service_completed":
        result = await sendServiceCompletion(
          phoneNumber,
          data.serviceName,
          data.orderId
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const phoneNumber = searchParams.get("phoneNumber");

  if (!phoneNumber) {
    return NextResponse.json(
      { error: "Phone number required" },
      { status: 400 }
    );
  }

  // Return WhatsApp message history
  return NextResponse.json({
    success: true,
    messages: [],
  });
}