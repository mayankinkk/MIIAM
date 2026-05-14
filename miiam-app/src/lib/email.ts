import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_ADDRESS = "MIIAM <noreply@miiam.in>";

const baseStyles = `
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
`;

const headerStyles = `
  background: linear-gradient(135deg, #ba001c, #8a0014);
  padding: 30px;
  text-align: center;
  border-radius: 10px 10px 0 0;
`;

const contentStyles = `
  background: #fff4f4;
  padding: 30px;
  border-radius: 0 0 10px 10px;
`;

function getOrderItemsHtml(items: Array<{ name: string; quantity: number; price: number }>): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
      </tr>
    `
    )
    .join("");
}

export type OrderEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  vendorName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  deliveryFee: number;
  tip?: number;
  total: number;
  deliveryAddress: string;
  estimatedDelivery?: string;
};

export type OrderStatusEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: string;
  vendorName: string;
  estimatedDelivery?: string;
  riderName?: string;
  riderPhone?: string;
};

export type RefundEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  reason?: string;
};

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[DEV EMAIL] Order Confirmation:", data);
    return { success: true };
  }

  const itemsHtml = getOrderItemsHtml(data.items);

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      subject: `Order Confirmed - #${data.orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="${baseStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0;">MIIAM</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Order Confirmed</p>
          </div>
          <div style="${contentStyles}">
            <h2 style="color: #4d212a; margin-bottom: 20px;">Hi ${data.customerName}! 👋</h2>
            <p style="color: #666; margin-bottom: 25px;">Your order has been confirmed and is being prepared.</p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8f8f8;">
                    <th style="padding: 10px; text-align: left; color: #666;">Item</th>
                    <th style="padding: 10px; color: #666;">Qty</th>
                    <th style="padding: 10px; text-align: right; color: #666;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              <div style="border-top: 1px solid #eee; margin-top: 10px; padding-top: 10px;">
                <p style="margin: 5px 0; color: #666;">Subtotal: <span style="float: right; color: #4d212a;">₹${data.subtotal.toFixed(2)}</span></p>
                <p style="margin: 5px 0; color: #666;">Delivery: <span style="float: right; color: #4d212a;">₹${data.deliveryFee.toFixed(2)}</span></p>
                ${data.tip ? `<p style="margin: 5px 0; color: #666;">Tip: <span style="float: right; color: #4d212a;">₹${data.tip.toFixed(2)}</span></p>` : ""}
                <p style="margin: 10px 0 0 0; font-weight: bold; font-size: 18px; color: #ba001c;">Total: <span style="float: right;">₹${data.total.toFixed(2)}</span></p>
              </div>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
              <p style="margin: 0; color: #666; font-size: 14px;"><strong>Delivery Address:</strong></p>
              <p style="margin: 5px 0 0 0; color: #4d212a;">${data.deliveryAddress}</p>
            </div>
            
            <p style="color: #999; font-size: 12px;">Order ID: ${data.orderId}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

const statusMessages: Record<string, { title: string; message: string }> = {
  accepted: {
    title: "Order Accepted! 🎉",
    message: "Great news! The restaurant has accepted your order.",
  },
  preparing: {
    title: "Preparing Your Order 👨‍🍳",
    message: "Your order is being prepared with care.",
  },
  shopping: {
    title: "Shopping in Progress 🛒",
    message: "Your rider is gathering your items.",
  },
  picking_up: {
    title: "Picking Up Order 📦",
    message: "Your rider is on the way to pick up your order.",
  },
  on_the_way: {
    title: "On the Way 🚴",
    message: "Your order is en route to you!",
  },
  delivered: {
    title: "Delivered! ✅",
    message: "Your order has been delivered. Enjoy!",
  },
  cancelled: {
    title: "Order Cancelled ❌",
    message: "Your order has been cancelled.",
  },
};

export async function sendOrderStatusUpdateEmail(data: OrderStatusEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[DEV EMAIL] Order Status Update:", data);
    return { success: true };
  }

  const statusInfo = statusMessages[data.status] || { title: "Order Update", message: "Your order status has been updated." };

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      subject: `Order Update - #${data.orderId.slice(0, 8).toUpperCase()} - ${statusInfo.title}`,
      html: `
        <div style="${baseStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0;">MIIAM</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Order Update</p>
          </div>
          <div style="${contentStyles}">
            <h2 style="color: #4d212a; margin-bottom: 20px;">Hi ${data.customerName}! 👋</h2>
            <p style="color: #666; margin-bottom: 25px;">${statusInfo.message}</p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
              <p style="color: #ba001c; font-size: 24px; font-weight: bold; margin: 0;">${statusInfo.title}</p>
            </div>
            
            ${data.riderName ? `
            <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;"><strong>Rider Details:</strong></p>
              <p style="margin: 0; color: #4d212a;">${data.riderName}</p>
              ${data.riderPhone ? `<p style="margin: 5px 0 0 0; color: #0b50d5;">📞 ${data.riderPhone}</p>` : ""}
            </div>
            ` : ""}
            
            ${data.estimatedDelivery ? `
            <p style="color: #666; margin-bottom: 20px;">Estimated delivery: <strong>${data.estimatedDelivery}</strong></p>
            ` : ""}
            
            <p style="color: #999; font-size: 12px;">Order ID: ${data.orderId}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendRefundNotificationEmail(data: RefundEmailData): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[DEV EMAIL] Refund Notification:", data);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: data.customerEmail,
      subject: `Refund Processed - #${data.orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="${baseStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0;">MIIAM</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Refund Processed</p>
          </div>
          <div style="${contentStyles}">
            <h2 style="color: #4d212a; margin-bottom: 20px;">Hi ${data.customerName}! 👋</h2>
            <p style="color: #666; margin-bottom: 25px;">Your refund has been processed successfully.</p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
              <p style="color: #666; margin: 0;">Refund Amount</p>
              <p style="color: #ba001c; font-size: 32px; font-weight: bold; margin: 10px 0 0 0;">₹${data.amount.toFixed(2)}</p>
            </div>
            
            ${data.reason ? `<p style="color: #666; margin-bottom: 20px;">Reason: ${data.reason}</p>` : ""}
            
            <p style="color: #999; font-size: 12px;">Order ID: ${data.orderId}</p>
            <p style="color: #999; font-size: 12px;">The refund should appear in your account within 3-5 business days.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendWelcomeEmail(name: string, email: string): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[DEV EMAIL] Welcome:", { name, email });
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Welcome to MIIAM! 🎉",
      html: `
        <div style="${baseStyles}">
          <div style="${headerStyles}">
            <h1 style="color: white; margin: 0;">MIIAM</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Welcome!</p>
          </div>
          <div style="${contentStyles}">
            <h2 style="color: #4d212a; margin-bottom: 20px;">Hi ${name}! 👋</h2>
            <p style="color: #666; margin-bottom: 25px;">Welcome to MIIAM - your one-stop superapp for food, groceries, beauty, pharmacy, and more!</p>
            
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://miiam.in/app/home" style="background: #ba001c; color: white; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Start Ordering</a>
            </div>
            
            <p style="color: #999; font-size: 12px;">With MIIAM, you can:</p>
            <ul style="color: #666; font-size: 14px;">
              <li>Order food from your favorite restaurants</li>
              <li>Get groceries delivered in minutes</li>
              <li>Book beauty and wellness services</li>
              <li>Order medicines from pharmacies</li>
              <li>And much more!</li>
            </ul>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}