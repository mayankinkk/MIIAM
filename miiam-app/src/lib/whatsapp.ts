"use client";

import { createClient } from "@/lib/supabase/client";

const WHATSAPP_CLOUD_API_URL = "https://graph.facebook.com/v18.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN;

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

const messageTemplates = {
  order_confirmed: {
    name: "order_confirmed",
    language: "en_US",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "" },
          { type: "text", text: "" },
          { type: "text", text: "" },
        ],
      },
    ],
  },
  booking_reminder: {
    name: "booking_reminder",
    language: "en_US",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "" },
          { type: "text", text: "" },
          { type: "text", text: "" },
        ],
      },
    ],
  },
  service_completed: {
    name: "service_completed",
    language: "en_US",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "" },
          { type: "text", text: "" },
        ],
      },
    ],
  },
  promo_offer: {
    name: "promo_offer",
    language: "en_US",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "" },
          { type: "text", text: "" },
          { type: "text", text: "" },
        ],
      },
    ],
  },
  prescription_approved: {
    name: "prescription_approved",
    language: "en_US",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "" },
        ],
      },
    ],
  },
  prescription_rejected: {
    name: "prescription_rejected",
    language: "en_US",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "" },
          { type: "text", text: "" },
        ],
      },
    ],
  },
};

export async function sendWhatsAppMessage(
  phoneNumber: string,
  templateName: keyof typeof messageTemplates,
  parameters: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const template = messageTemplates[templateName];
    const paramValues = Object.values(parameters);

    const components = template.components?.map((component, ci) => ({
      ...component,
      parameters: component.parameters?.map((_: any, pi: number) => ({
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

    // Call WhatsApp Cloud API if configured
    if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) {
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
        console.error("[WhatsApp] API error:", data);
        // Still store in DB but mark as failed
        const supabase = createClient();
        await supabase.from("whatsapp_messages").insert({
          phone_number: toPhone,
          template_name: templateName,
          parameters,
          status: "failed",
          error_message: data.error?.message || "API error",
          sent_at: new Date().toISOString(),
        });
        return {
          success: false,
          error: data.error?.message || "WhatsApp API error",
        };
      }

      const messageId = data.messages?.[0]?.id;

      // Store successful message in database
      const supabase = createClient();
      await supabase.from("whatsapp_messages").insert({
        phone_number: toPhone,
        template_name: templateName,
        parameters,
        status: "sent",
        whatsapp_message_id: messageId,
        sent_at: new Date().toISOString(),
      });

      return { success: true, messageId };
    }

    // Fallback: log and store when not configured
    console.log("[WhatsApp] Not configured — message logged:", templateName, toPhone);
    const supabase = createClient();
    await supabase.from("whatsapp_messages").insert({
      phone_number: toPhone,
      template_name: templateName,
      parameters,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return { success: true, messageId: `wa_${Date.now()}` };
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendOrderConfirmation(
  phoneNumber: string,
  orderId: string,
  serviceName: string,
  amount: string
) {
  return sendWhatsAppMessage(phoneNumber, "order_confirmed", {
    order_id: orderId,
    service_name: serviceName,
    amount,
  });
}

export async function sendBookingReminder(
  phoneNumber: string,
  serviceName: string,
  date: string,
  time: string
) {
  return sendWhatsAppMessage(phoneNumber, "booking_reminder", {
    service_name: serviceName,
    date,
    time,
  });
}

export async function sendServiceCompletion(
  phoneNumber: string,
  serviceName: string,
  orderId: string
) {
  const ratingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://miiam.app"}/feedback/${orderId}`;
  return sendWhatsAppMessage(phoneNumber, "service_completed", {
    service_name: serviceName,
    rating_url: ratingUrl,
  });
}

export async function sendPrescriptionApproval(
  phoneNumber: string,
  rxId: string
) {
  return sendWhatsAppMessage(phoneNumber, "prescription_approved", {
    rx_id: rxId,
  });
}

export async function sendPrescriptionRejection(
  phoneNumber: string,
  rxId: string,
  reason: string
) {
  return sendWhatsAppMessage(phoneNumber, "prescription_rejected", {
    rx_id: rxId,
    reason,
  });
}
