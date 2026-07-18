"use client";

interface OrderSummaryItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  tax?: number;
  total?: number;
  showHeading?: boolean;
}

export default function OrderSummary({ items, subtotal, deliveryFee = 0, discount = 0, tax = 0, total, showHeading = true }: OrderSummaryProps) {
  const calculatedSubtotal = subtotal ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const calculatedTotal = total ?? calculatedSubtotal + deliveryFee - discount + tax;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 space-y-3">
      {showHeading && (
        <h3 className="text-sm font-bold text-on-surface">Order Summary</h3>
      )}

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant flex-1 min-w-0 truncate">
              {item.quantity}× {item.name}
            </span>
            <span className="font-bold text-on-surface ml-2">₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-outline/10 pt-2 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-on-surface-variant">Subtotal</span>
          <span className="font-medium text-on-surface">₹{calculatedSubtotal.toFixed(0)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Delivery</span>
            <span className="font-medium text-on-surface">₹{deliveryFee.toFixed(0)}</span>
          </div>
        )}
        {deliveryFee === 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Delivery</span>
            <span className="font-bold text-emerald-600">FREE</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Discount</span>
            <span className="font-bold text-emerald-600">-₹{discount.toFixed(0)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Tax</span>
            <span className="font-medium text-on-surface">₹{tax.toFixed(0)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t border-outline/10">
          <span className="text-sm font-bold text-on-surface">Total</span>
          <span className="text-sm font-black text-primary">₹{calculatedTotal.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
