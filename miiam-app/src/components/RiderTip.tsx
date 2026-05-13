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
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#0b50d5]/10 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-[#0b50d5]">directions_bike</span>
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Tip your Rider</h3>
          <p className="text-sm text-slate-500">100% goes to your delivery hero</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {tipOptions.map(({ percent, label }) => {
          const amount = calculateTip(percent);
          const isSelected = selectedTip === percent;
          
          return (
            <button
              key={percent}
              onClick={() => handleSelect(percent)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? "border-[#ba001c] bg-red-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-sm font-bold text-slate-800">{label}</div>
              {amount > 0 && <div className="text-xs text-[#ba001c]">₹{amount}</div>}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <label className="text-sm text-slate-600 mb-2 block">Custom amount</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ba001c]"
            />
          </div>
          <button
            onClick={handleCustomTip}
            className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 text-slate-600 font-bold rounded-xl border border-slate-200"
        >
          Skip
        </button>
        <button
          onClick={() => selectedTip !== null && handleSelect(selectedTip)}
          disabled={selectedTip === null}
          className="flex-1 py-3 bg-[#ba001c] text-white font-bold rounded-xl disabled:opacity-50"
        >
          Add ₹{selectedTip !== null && selectedTip >= 0 ? calculateTip(selectedTip) : selectedTip === -1 ? customAmount : 0} Tip
        </button>
      </div>
    </div>
  );
}

export function TipThankYou({ amount }: { amount: number }) {
  return (
    <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-green-600">favorite</span>
      </div>
      <div>
        <p className="font-bold text-green-800">Thanks for your generosity!</p>
        <p className="text-sm text-green-600">₹{amount} tip added for your rider</p>
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
    <div className="bg-[#ffd709] text-[#453900] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">favorite</span>
      <span>₹{amount} tip</span>
    </div>
  );
}