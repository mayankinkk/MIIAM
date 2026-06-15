"use client";

import { useState } from "react";

export type PaymentMethod = "upi" | "card" | "wallet" | "cod";

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  subtitle?: string;
}

const paymentOptions: PaymentOption[] = [
  { id: "upi", name: "UPI", icon: "payments", subtitle: "GPay, PhonePe, Paytm" },
  { id: "card", name: "Credit/Debit Card", icon: "credit_card", subtitle: "Visa, Mastercard, RuPay" },
  { id: "wallet", name: "MIIAM Wallet", icon: "account_balance_wallet", subtitle: "₹0 balance" },
  { id: "cod", name: "Cash on Delivery", icon: "money", subtitle: "Pay when you receive" },
];

interface PaymentOptionsProps {
  total: number;
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  walletBalance?: number;
}

export function PaymentOptions({ total, selected, onSelect, walletBalance = 0 }: PaymentOptionsProps) {
  const [showAllUPI, setShowAllUPI] = useState(false);

  const upiApps = [
    { id: "gpay", name: "Google Pay", icon: "G" },
    { id: "phonepe", name: "PhonePe", icon: "P" },
    { id: "paytm", name: "Paytm", icon: "₹" },
    { id: "bhim", name: "BHIM UPI", icon: "U" },
  ];

  return (
    <div className="space-y-3">
      {paymentOptions.map((option) => {
        const isSelected = selected === option.id;
        const isDisabled = option.id === "wallet" && walletBalance < total;

        return (
          <button
            key={option.id}
            onClick={() => !isDisabled && onSelect(option.id)}
            disabled={isDisabled}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-[var(--color-primary)] bg-red-50"
                : isDisabled
                ? "border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] opacity-50 cursor-not-allowed"
                : "border-[var(--color-border-subtle)] hover:border-[var(--color-outline-variant)]"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isSelected ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
            }`}>
              <span className="material-symbols-outlined text-2xl">{option.icon}</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-[var(--color-on-surface)]">{option.name}</div>
              {option.subtitle && (
                <div className="text-xs text-[var(--color-outline)]">{option.subtitle}</div>
              )}
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isSelected ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-[var(--color-outline-variant)]"
            }`}>
              {isSelected && <div className="w-2 h-2 bg-[var(--color-surface-container-lowest)] rounded-full" />}
            </div>
          </button>
        );
      })}

      {selected === "upi" && (
        <div className="ml-14 space-y-2">
          {showAllUPI ? (
            <>
              {upiApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    navigator.clipboard.writeText("miiam@upi");
                    import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(`${app.name}: UPI ID copied to clipboard`, "success"));
                  }}
                  className="flex items-center gap-3 p-3 bg-[var(--color-surface-subtle)] rounded-lg w-full hover:bg-[var(--color-surface-container)]"
                >
                  <div className="w-8 h-8 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    {app.icon}
                  </div>
                  <span className="text-sm font-medium">{app.name}</span>
                  <span className="text-xs text-[var(--color-outline-variant)] ml-auto">Tap to copy UPI ID</span>
                </button>
              ))}
              <button
                onClick={() => setShowAllUPI(false)}
                className="text-sm text-[var(--color-primary)] font-medium"
              >
                Show less
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                navigator.clipboard.writeText("miiam@upi");
                import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("UPI ID copied to clipboard", "success"));
              }}
              className="flex items-center gap-3 p-3 bg-[var(--color-surface-subtle)] rounded-lg w-full hover:bg-[var(--color-surface-container)]"
            >
              <div className="w-8 h-8 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                G
              </div>
              <span className="text-sm font-medium">Google Pay</span>
              <span className="text-xs text-[var(--color-outline)] ml-auto">Recommended</span>
            </button>
          )}
        </div>
      )}

      {selected === "card" && (
        <div className="ml-14 p-4 bg-[var(--color-surface-subtle)] rounded-xl">
          <div className="flex items-center gap-3 py-3">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">credit_card</span>
            <p className="text-sm text-[var(--color-outline)]">
              Card payments coming soon. Use UPI or Cash on Delivery for now.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface PaymentSummaryProps {
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  tip?: number;
}

export function PaymentSummary({ subtotal, deliveryFee, discount = 0, total, tip = 0 }: PaymentSummaryProps) {
  return (
    <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--color-on-surface-variant)]">Item Total</span>
        <span className="font-medium">₹{subtotal.toFixed(0)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-[var(--color-on-surface-variant)]">Delivery Fee</span>
        <span className="font-medium">₹{deliveryFee.toFixed(0)}</span>
      </div>
      {tip > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-on-surface-variant)]">Rider Tip</span>
          <span className="font-medium text-[var(--color-primary)]">₹{tip.toFixed(0)}</span>
        </div>
      )}
      {discount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span className="font-medium">-₹{discount.toFixed(0)}</span>
        </div>
      )}
      <div className="border-t border-[var(--color-border-subtle)] pt-2 mt-2">
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-[var(--color-primary)]">₹{(total + tip).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}

interface UPIQRCodeProps {
  amount: number;
  onSuccess: () => void;
  onFailure: () => void;
}

export function UPIQRCode({ amount, onSuccess, onFailure }: UPIQRCodeProps) {
  const upiId = "miiam@upi";

  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 text-center">
      <h3 className="font-bold text-lg mb-4">Scan to Pay ₹{amount.toFixed(0)}</h3>
      
      <div className="w-48 h-48 bg-[var(--color-surface-container)] rounded-xl mx-auto mb-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 bg-[var(--color-surface-container-lowest)] rounded-lg border-2 border-dashed border-[var(--color-outline-variant)] flex items-center justify-center mx-auto">
            <span className="text-4xl font-bold text-[var(--color-primary)]">QR</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-[var(--color-outline)] mb-2">UPI ID: {upiId}</p>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onSuccess}
          className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl"
        >
          Payment Done
        </button>
        <button
          onClick={onFailure}
          className="flex-1 py-3 border border-[var(--color-border-subtle)] font-bold rounded-xl"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-[var(--color-outline-variant)] mt-4">
        Don't close this page. Wait for confirmation.
      </p>
    </div>
  );
}