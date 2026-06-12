import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, checkIpRateLimit } from "@/lib/security";
import { createRouteLogger } from "@/lib/logger";

const WHATSAPP_CLOUD_API_URL = "https://graph.facebook.com/v18.0";

interface WhatsAppMessage {
  messaging_product: string;
  to: string;
  type: string;
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
  text?: {
    body: string;
  };
}

const messageTemplates: Record<string, { name: string; language: string; components: any[] }> = {
  order_confirmed: {
    name: "order_confirmed",
    language: "en_US",
    components: [
      { type: "body", parameters: [{ type: "text", text: "" }, { type: "text", text: "" }, { type: "text", text: "" }] },
    ],
  },
  booking_reminder: {
    name: "booking_reminder",
    language: "en_US",
    components: [
      { type: "body", parameters: [{ type: "text", text: "" }, { type: "text", text: "" }, { type: "text", text: "" }] },
    ],
  },
  service_completed: {
    name: "service_completed",
    language: "en_US",
    components: [
      { type: "body", parameters: [{ type: "text", text: "" }, { type: "text", text: "" }] },
    ],
  },
  promo_offer: {
    name: "promo_offer",
    language: "en_US",
    components: [
      { type: "body", parameters: [{ type: "text", text: "" }, { type: "text", text: "" }, { type: "text", text: "" }] },
    ],
  },
  prescription_approved: {
    name: "prescription_approved",
    language: "en_US",
    components: [
      { type: "body", parameters: [{ type: "text", text: "" }] },
    ],
  },
  prescription_rejected: {
    name: "prescription_rejected",
    language: "en_US",
    components: [
      { type: "body", parameters: [{ type: "text", text: "" }, { type: "text", text: "" }] },
    ],
  },
};

export async function POST(request: NextRequest) {
  const logger = createRouteLogger("whatsapp/send");
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 10 messages per minute per IP
    const ip = getClientIp(request);
    if (!checkIpRateLimit(ip, 10, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      return NextResponse.json({ error: "WhatsApp not configured" }, { status: 503 });
    }

    const { phoneNumber, templateName, parameters } = await request.json();

    if (!phoneNumber || !templateName || !parameters) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const template = messageTemplates[templateName];
    if (!template) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }

    const paramValues = Object.values(parameters);
    const components = template.components.map((component) => ({
      ...component,
      parameters: component.parameters.map((_: any, pi: number) => ({
        type: "text" as const,
        text: paramValues[pi] || "",
      })),
    }));

    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "");
    const toPhone = cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone;

    const message: WhatsAppMessage = {
      messaging_product: "whatsapp",
      to: toPhone,
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
        components,
      },
    };

    const response = await fetch(
      `${WHATSAPP_CLOUD_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      logger.error({ err: data }, "WhatsApp API error");
      const supabaseAdmin = (await import("@/lib/supabase/server")).createAdminClient();
      await supabaseAdmin.from("whatsapp_messages").insert({
        phone_number: toPhone,
        template_name: templateName,
        parameters,
        status: "failed",
        error_message: data.error?.message || "API error",
        sent_at: new Date().toISOString(),
      });
      return NextResponse.json({ success: false, error: data.error?.message || "WhatsApp API error" }, { status: 502 });
    }

    const messageId = data.messages?.[0]?.id;
    const supabaseAdmin = (await import("@/lib/supabase/server")).createAdminClient();
    await supabaseAdmin.from("whatsapp_messages").insert({
      phone_number: toPhone,
      template_name: templateName,
      parameters,
      status: "sent",
      whatsapp_message_id: messageId,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    logger.error({ err: error }, "WhatsApp send error");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
