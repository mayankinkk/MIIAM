"use client";

import { useCallback, useState } from "react";
import { useToastStore } from "@/lib/store/toastStore";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  amount: number;
  orderId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  description?: string;
  onSuccess?: (paymentId: string, orderId: string) => void;
  onFailure?: (error: string) => void;
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const loadRazorpayScript = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const pay = useCallback(async ({
    amount,
    orderId,
    userName,
    userEmail,
    userPhone,
    description,
    onSuccess,
    onFailure,
  }: RazorpayOptions) => {
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        addToast("Failed to load payment gateway. Please check your internet.", "error");
        setLoading(false);
        onFailure?.("Failed to load payment gateway");
        return;
      }

      // Create Razorpay order on server
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          receipt: orderId || `receipt_${Date.now()}`,
          notes: { orderId: orderId || "" },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast(data.error || "Failed to create payment order", "error");
        setLoading(false);
        onFailure?.(data.error || "Failed to create payment order");
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "MIIAM",
        description: description || "Order Payment",
        order_id: data.orderId,
        prefill: {
          name: userName || "",
          email: userEmail || "",
          contact: userPhone || "",
        },
        theme: {
          color: "var(--color-primary)",
        },
        handler: async (response: any) => {
          try {
            // Verify payment on server
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.verified) {
              addToast("Payment successful!", "success");
              onSuccess?.(response.razorpay_payment_id, response.razorpay_order_id);
            } else {
              addToast("Payment verification failed. Contact support.", "error");
              onFailure?.("Payment verification failed");
            }
          } catch {
            addToast("Payment received but verification failed. Contact support.", "error");
            // Payment was made but verification failed — order may still be pending
            onSuccess?.(response.razorpay_payment_id, response.razorpay_order_id);
          }
        },
        modal: {
          ondismiss: () => {
            addToast("Payment cancelled", "error");
            setLoading(false);
            onFailure?.("Payment cancelled by user");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response: any) => {
        const msg = response.error?.description || "Payment failed";
        addToast(msg, "error");
        setLoading(false);
        onFailure?.(msg);
      });
      razorpay.open();
    } catch (error: any) {
      console.error("Razorpay error:", error);
      addToast("Payment failed. Please try again.", "error");
      setLoading(false);
      onFailure?.(error.message || "Payment failed");
    }
  }, [loadRazorpayScript, addToast]);

  return { pay, loading };
}
