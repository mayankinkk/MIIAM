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

export default function OrderSummary({
  items,
  subtotal,
  deliveryFee = 0,
  discount = 0,
  tax = 0,
  total,
  showHeading = true,
}: OrderSummaryProps) {
  const calculatedSubtotal = subtotal ?? items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const calculatedTotal = total ?? calculatedSubtotal + deliveryFee - discount + tax;

  return (
    <div className="bg-surface-container-lowest space-y-3 rounded-xl p-4">
      {showHeading && <h3 className="text-on-surface text-sm font-bold">Order Summary</h3>}

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant min-w-0 flex-1 truncate">
              {item.quantity}× {item.name}
            </span>
            <span className="text-on-surface ml-2 font-bold">
              ₹{(item.price * item.quantity).toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-outline/10 space-y-1.5 border-t pt-2">
        <div className="flex justify-between text-xs">
          <span className="text-on-surface-variant">Subtotal</span>
          <span className="text-on-surface font-medium">₹{calculatedSubtotal.toFixed(0)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-on-surface-variant">Delivery</span>
            <span className="text-on-surface font-medium">₹{deliveryFee.toFixed(0)}</span>
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
            <span className="text-on-surface font-medium">₹{tax.toFixed(0)}</span>
          </div>
        )}
        <div className="border-outline/10 flex justify-between border-t pt-1">
          <span className="text-on-surface text-sm font-bold">Total</span>
          <span className="text-on-surface text-sm font-black">₹{calculatedTotal.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
