import type { Metadata } from "next";
import PaymentContent from "@/components/PaymentContent";

export const metadata: Metadata = { title: "Payment | MIIAM" };

export default function PaymentPage() {
  return <PaymentContent />;
}
