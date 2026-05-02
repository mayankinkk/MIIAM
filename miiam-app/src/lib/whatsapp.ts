"use client";

import { createClient } from "@/lib/supabase/client";

const WHATSAPP_API_URL = "https://api.whatsapp.com/v3/messages";
const WHATSAPP_BUSINESS_ID = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_ID;

interface WhatsAppMessage {
  to: string;
  type: string;
  template?: {
    name: string;
    language: string;
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
          { type: "text", parameter_name: "order_id" },
          { type: "text", parameter_name: "service_name" },
          { type: "text", parameter_name: "amount" },
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
          { type: "text", parameter_name: "service_name" },
          { type: "text", parameter_name: "date" },
          { type: "text", parameter_name: "time" },
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
          { type: "text", parameter_name: "service_name" },
          { type: "text", parameter_name: "rating_url" },
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
          { type: "text", parameter_name: "offer_name" },
          { type: "text", parameter_name: "discount" },
          { type: "text", parameter_name: "validity" },
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
    
    // Replace template parameters
    const components = template.components?.map((component) => ({
      ...component,
      parameters: component.parameters?.map((param: any) => ({
        ...param,
        text: parameters[param.parameter_name] || "",
      })),
    }));

    const message: WhatsAppMessage = {
      to: phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`,
      type: "template",
      template: {
        name: template.name,
        language: template.language,
        components,
      },
    };

    // In production, call WhatsApp API
    // For now, we'll log and simulate
    console.log("[WhatsApp] Sending message:", JSON.stringify(message, null, 2));

    // Simulate API call
    // const response = await fetch(`${WHATSAPP_API_URL}`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(message),
    // });

    // Store message in database for history
    const supabase = createClient();
    await supabase.from("whatsapp_messages").insert({
      phone_number: phoneNumber,
      template_name: templateName,
      parameters,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: `wa_${Date.now()}`,
    };
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper to send order confirmation
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

// Helper to send booking reminder
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

// Helper to send service completion
export async function sendServiceCompletion(
  phoneNumber: string,
  serviceName: string,
  orderId: string
) {
  const ratingUrl = `https://miiam.app/feedback/${orderId}`;
  return sendWhatsAppMessage(phoneNumber, "service_completed", {
    service_name: serviceName,
    rating_url: ratingUrl,
  });
}