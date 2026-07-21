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
  currentOffer: number;
}

export default function OffersCarousel({ offers, currentOffer }: OffersCarouselProps) {
  if (offers.length === 0) return null;

  return (
    <div className="px-5 pt-3 pb-1">
      <Link href="/app/home">
        <div className={`relative h-36 rounded-3xl overflow-hidden bg-gradient-to-r ${offers[currentOffer].gradient} shadow-lg`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
          <div className="absolute top-4 left-5">
            <span className="text-[10px] font-black bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
              {offers[currentOffer].badge}
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-5 pt-6">
            <div className="flex-1 pr-4">
              <h3 className="text-2xl font-black text-white leading-tight drop-shadow-sm">{offers[currentOffer].title}</h3>
              <p className="text-white/85 text-sm mt-1.5 font-medium">{offers[currentOffer].subtitle}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-2xl">arrow_forward</span>
            </div>
          </div>
          {/* Progress Bar */}
          {offers.length > 1 && (
            <div className="absolute bottom-3 left-5 right-5 flex gap-1.5">
              {offers.map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-white transition-all duration-400 ${i === currentOffer ? "w-full" : "w-0"}`}
                    style={i === currentOffer ? { animation: "offerProgress 4s linear" } : {}}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
