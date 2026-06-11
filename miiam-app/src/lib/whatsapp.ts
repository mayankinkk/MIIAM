interface SendWhatsAppParams {
  phoneNumber: string;
  templateName: string;
  parameters: Record<string, string>;
}

export async function sendWhatsAppMessage(
  phoneNumber: string,
  templateName: string,
  parameters: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, templateName, parameters }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
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
  const ratingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/feedback/${orderId}`;
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
