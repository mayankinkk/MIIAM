import logger from "@/lib/logger";

export interface SmsOptions {
  to: string;
  template: string;
  variables?: Record<string, string>;
}

export interface SmsProvider {
  send(options: SmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class TwilioProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || "";
  }

  async send(options: SmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      logger.warn("Twilio credentials not configured — SMS not sent");
      return { success: false, error: "Twilio not configured" };
    }
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: options.to,
        From: this.fromNumber,
        Body: this.renderTemplate(options.template, options.variables),
      });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      const data = await response.json();
      if (!response.ok) {
        logger.error({ twilioError: data }, "Twilio SMS failed");
        return { success: false, error: data.message || "Twilio error" };
      }
      return { success: true, messageId: data.sid };
    } catch (err) {
      logger.error({ err }, "Twilio SMS send failed");
      return { success: false, error: "Failed to send SMS" };
    }
  }

  private renderTemplate(template: string, variables?: Record<string, string>): string {
    if (!variables) return template;
    return Object.entries(variables).reduce(
      (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, "g"), value),
      template,
    );
  }
}

class Msg91Provider implements SmsProvider {
  private authKey: string;
  private senderId: string;
  private templateId: string;

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || "";
    this.senderId = process.env.MSG91_SENDER_ID || "MIIAM";
    this.templateId = process.env.MSG91_TEMPLATE_ID || "";
  }

  async send(options: SmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.authKey || !this.templateId) {
      logger.warn("MSG91 credentials not configured — SMS not sent");
      return { success: false, error: "MSG91 not configured" };
    }
    try {
      const response = await fetch("https://api.msg91.com/api/v5/flow", {
        method: "POST",
        headers: {
          authkey: this.authKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flow_id: this.templateId,
          mobiles: options.to.replace("+", ""),
          VAR_NAME: options.variables ? Object.values(options.variables).join("|") : "",
        }),
      });
      const data = await response.json();
      if (data.type !== "success") {
        logger.error({ msg91Error: data }, "MSG91 SMS failed");
        return { success: false, error: data.message || "MSG91 error" };
      }
      return { success: true, messageId: data.request_id };
    } catch (err) {
      logger.error({ err }, "MSG91 SMS send failed");
      return { success: false, error: "Failed to send SMS" };
    }
  }
}

function getProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || "twilio";
  switch (provider) {
    case "msg91":
      return new Msg91Provider();
    case "twilio":
    default:
      return new TwilioProvider();
  }
}

let provider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (!provider) provider = getProvider();
  return provider;
}

export async function sendSms(options: SmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return getSmsProvider().send(options);
}

export const SMS_TEMPLATES = {
  ORDER_CONFIRMED: "Your MIIAM order #{{orderId}} has been confirmed! Estimated delivery: {{eta}}",
  ORDER_DISPATCHED: "Great news! Your MIIAM order #{{orderId}} is on its way. Rider: {{riderName}}",
  ORDER_DELIVERED: "Your MIIAM order #{{orderId}} has been delivered. Enjoy your meal!",
  ORDER_CANCELLED: "Your MIIAM order #{{orderId}} has been cancelled. Refund will be processed within 2-5 business days.",
  OTP_LOGIN: "Your MIIAM login OTP is {{otp}}. Valid for 5 minutes.",
  VENDOR_NEW_ORDER: "New order #{{orderId}} from {{customerName}}. Total: ₹{{amount}}. Check your dashboard!",
  RIDER_NEW_ASSIGNMENT: "You've been assigned order #{{orderId}}. Pickup from: {{vendorAddress}}",
} as const;
