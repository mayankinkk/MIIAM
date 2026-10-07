import Link from "next/link";

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  badge: string;
}

interface OffersCarouselProps {
  offers: Offer[];
}

export default function OffersCarousel({ offers }: OffersCarouselProps) {
  if (offers.length === 0) return null;

  return (
    <div className="pt-3 pb-1">
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 -mx-4 pb-1">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href="/app/home"
            className="snap-start shrink-0 w-[calc(100%-40px)] sm:w-80"
          >
            <div className={`relative h-36 rounded-xl overflow-hidden bg-gradient-to-r ${offer.gradient} shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
              <div className="absolute top-4 left-5">
                <span className="text-[10px] font-black bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {offer.badge}
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-between px-5 pt-6">
                <div className="flex-1 pr-4">
                  <h3 className="text-2xl font-black text-white leading-tight drop-shadow-sm bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">{offer.title}</h3>
                  <p className="text-white/85 text-sm mt-1.5 font-medium">{offer.subtitle}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-2xl">arrow_forward</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
