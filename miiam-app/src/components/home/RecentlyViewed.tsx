import Link from "next/link";
import BlurImage from "@/components/BlurImage";

interface RecentlyViewedItem {
  id: string;
  name: string;
  image_url?: string;
  cuisine?: string;
  rating?: string | number;
}

interface RecentlyViewedProps {
  items: RecentlyViewedItem[];
}

export default function RecentlyViewed({ items }: RecentlyViewedProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-accent"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            history
          </span>
          <h2 className="text-on-surface text-lg font-bold">Recently Viewed</h2>
        </div>
      </div>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/app/vendor/${item.id}`}
            className="bg-surface-container-lowest border-outline-variant/10 w-32 flex-shrink-0 overflow-hidden rounded-2xl border shadow-sm transition-transform active:scale-95"
          >
            <div className="bg-surface-container relative h-24">
              {item.image_url ? (
                <BlurImage
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="h-full w-full"
                  sizes="128px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
              )}
            </div>
            <div className="p-2">
              <h4 className="text-on-surface truncate text-xs font-bold">{item.name}</h4>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="text-[10px] font-bold text-green-700">★ {item.rating || 4.0}</span>
                {item.cuisine && (
                  <span className="text-on-surface-variant/70 truncate text-[10px]">
                    • {item.cuisine.split(",")[0]}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
