import Link from "next/link";

interface LastOrder {
  id: string;
  vendor_id: string;
  vendor_name: string;
  items: string;
  total: number;
  placed_at: string;
}

interface QuickReorderProps {
  order: LastOrder;
}

export default function QuickReorder({ order }: QuickReorderProps) {
  return (
    <div className="px-5 pt-2 pb-1">
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>replay</span>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Order again</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-on-surface text-sm truncate">{order.vendor_name}</p>
            <p className="text-[11px] text-on-surface-variant truncate mt-0.5">{order.items}</p>
            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">₹{order.total} · {new Date(order.placed_at).toLocaleDateString()}</p>
          </div>
          <Link
            href={`/app/vendor/${order.vendor_id}`}
            className="flex-shrink-0 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-transform shadow-sm"
          >
            Reorder
          </Link>
        </div>
      </div>
    </div>
  );
}
