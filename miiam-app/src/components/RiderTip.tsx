"use client";

import { useState } from "react";

interface RiderTipProps {
  orderAmount: number;
  onTipSelect: (amount: number) => void;
  onSkip: () => void;
}

const tipOptions = [
  { percent: 0, label: "No tip" },
  { percent: 5, label: "5%" },
  { percent: 10, label: "10%" },
  { percent: 15, label: "15%" },
];

export function RiderTipSelector({ orderAmount, onTipSelect, onSkip }: RiderTipProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  const calculateTip = (percent: number) => Math.round(orderAmount * (percent / 100));

  const handleSelect = (percent: number) => {
    setSelectedTip(percent);
    onTipSelect(calculateTip(percent));
  };

  const handleCustomTip = () => {
    const amount = parseInt(customAmount) || 0;
    setSelectedTip(-1);
    onTipSelect(amount);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <div className="bg-accent/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <span className="material-symbols-outlined text-accent text-lg">directions_bike</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-on-surface text-sm font-bold">Tip your Rider</h3>
          <p className="text-on-surface-variant text-xs">100% goes to your delivery hero</p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-4 gap-2">
        {tipOptions.map(({ percent, label }) => {
          const amount = calculateTip(percent);
          const isSelected = selectedTip === percent;

          return (
            <button
              key={percent}
              onClick={() => handleSelect(percent)}
              className={`rounded-lg border py-2 text-center transition-all ${
                isSelected
                  ? "border-primary bg-primary/15"
                  : "border-outline-variant/40 hover:border-primary"
              }`}
            >
              <div className="text-on-surface text-[13px] font-bold">{label}</div>
              {amount > 0 && <div className="text-accent text-[11px] font-semibold">₹{amount}</div>}
            </button>
          );
        })}
      </div>

      <div className="mb-3">
        <label className="text-on-surface-variant mb-1.5 block text-xs font-bold">
          Custom amount
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="text-on-surface-variant absolute top-1/2 left-3 -translate-y-1/2 text-sm">
              ₹
            </span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              className="border-outline-variant/40 bg-surface focus:border-primary focus:ring-primary/15 w-full rounded-lg border py-2.5 pr-4 pl-8 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
          <button
            onClick={handleCustomTip}
            className="bg-primary text-on-primary hover:bg-primary-dim rounded-lg px-4 py-2.5 text-sm font-black transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="text-on-surface-variant border-outline-variant/40 hover:border-outline-variant flex-1 rounded-lg border py-2.5 text-sm font-bold transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => selectedTip !== null && handleSelect(selectedTip)}
          disabled={selectedTip === null}
          className="bg-primary text-on-primary hover:bg-primary-dim flex-1 rounded-lg py-2.5 text-sm font-black transition-colors disabled:opacity-50"
        >
          Add ₹
          {selectedTip !== null && selectedTip >= 0
            ? calculateTip(selectedTip)
            : selectedTip === -1
              ? customAmount
              : 0}{" "}
          Tip
        </button>
      </div>
    </div>
  );
}

export function TipThankYou({ amount }: { amount: number }) {
  return (
    <div className="bg-status-success/10 flex items-center gap-2.5 rounded-lg p-2.5">
      <span
        className="material-symbols-outlined text-status-success"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        favorite
      </span>
      <div className="min-w-0">
        <p className="text-status-success text-sm font-bold">Thanks for your generosity!</p>
        <p className="text-status-success text-xs">₹{amount} tip added for your rider</p>
      </div>
    </div>
  );
}

interface TipBadgeProps {
  amount: number;
}

export function TipBadge({ amount }: TipBadgeProps) {
  if (!amount) return null;

  return (
    <div className="bg-tertiary text-on-tertiary-fixed flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
      <span className="material-symbols-outlined text-sm">favorite</span>
      <span>₹{amount} tip</span>
    </div>
  );
}
