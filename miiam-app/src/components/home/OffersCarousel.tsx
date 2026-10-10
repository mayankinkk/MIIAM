import Link from "next/link";
import BlurImage from "@/components/BlurImage";
import { normalizeGradientClass } from "@/lib/gradient-utils";

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  badge: string;
  link_url?: string | null;
  image_url?: string | null;
}

interface OffersCarouselProps {
  offers: Offer[];
}

export default function OffersCarousel({ offers }: OffersCarouselProps) {
  if (offers.length === 0) return null;

  return (
    <div className="pt-3 pb-1">
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={offer.link_url || "/app/home"}
            className="w-[calc(100%-40px)] shrink-0 snap-start sm:w-80"
          >
            <div
              className={`relative h-36 overflow-hidden rounded-xl bg-gradient-to-r ${normalizeGradientClass(offer.gradient)} shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}
            >
              {offer.image_url && (
                <>
                  <BlurImage
                    src={offer.image_url}
                    alt={offer.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 320px"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                </>
              )}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
              <div className="absolute top-4 left-5">
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black tracking-wider text-white uppercase backdrop-blur-sm">
                  {offer.badge}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-between px-5 pt-6">
                <div className="flex-1 pr-4">
                  <h3 className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-2xl leading-tight font-black text-transparent text-white drop-shadow-sm">
                    {offer.title}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium text-white/85">{offer.subtitle}</p>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-2xl text-white">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
