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
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-lg text-accent">directions_bike</span>
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-on-surface">Tip your Rider</h3>
          <p className="text-xs text-on-surface-variant">100% goes to your delivery hero</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {tipOptions.map(({ percent, label }) => {
          const amount = calculateTip(percent);
          const isSelected = selectedTip === percent;

          return (
            <button
              key={percent}
              onClick={() => handleSelect(percent)}
              className={`py-2 rounded-lg border text-center transition-all ${
                isSelected
                  ? "border-primary bg-primary/15"
                  : "border-outline-variant/40 hover:border-primary"
              }`}
            >
              <div className="text-[13px] font-bold text-on-surface">{label}</div>
              {amount > 0 && <div className="text-[11px] font-semibold text-accent">₹{amount}</div>}
            </button>
          );
        })}
      </div>

      <div className="mb-3">
        <label className="text-xs font-bold text-on-surface-variant mb-1.5 block">Custom amount</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">₹</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-8 pr-4 py-2.5 border border-outline-variant/40 rounded-lg bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm"
            />
          </div>
          <button
            onClick={handleCustomTip}
            className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-black text-sm hover:bg-primary-dim transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="flex-1 py-2.5 text-sm text-on-surface-variant font-bold rounded-lg border border-outline-variant/40 hover:border-outline-variant transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => selectedTip !== null && handleSelect(selectedTip)}
          disabled={selectedTip === null}
          className="flex-1 py-2.5 bg-primary text-on-primary text-sm font-black rounded-lg disabled:opacity-50 hover:bg-primary-dim transition-colors"
        >
          Add ₹{selectedTip !== null && selectedTip >= 0 ? calculateTip(selectedTip) : selectedTip === -1 ? customAmount : 0} Tip
        </button>
      </div>
    </div>
  );
}

export function TipThankYou({ amount }: { amount: number }) {
  return (
    <div className="bg-status-success/10 rounded-lg p-2.5 flex items-center gap-2.5">
      <span className="material-symbols-outlined text-status-success" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
      <div className="min-w-0">
        <p className="font-bold text-status-success text-sm">Thanks for your generosity!</p>
        <p className="text-xs text-status-success">₹{amount} tip added for your rider</p>
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
    <div className="bg-tertiary text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">favorite</span>
      <span>₹{amount} tip</span>
    </div>
  );
}