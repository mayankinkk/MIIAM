"use client";

import BlurImage from "@/components/BlurImage";
import ShareLocationToggle from "@/components/rider/ShareLocationToggle";

interface RiderContactCardProps {
  name: string;
  image: string;
  rating: number;
  phone?: string;
  orderId: string;
  currentUserId: string;
  orderStatus: string;
  unreadCount: number;
  onChat: () => void;
}

export default function RiderContactCard({
  name,
  image,
  rating,
  phone,
  orderId,
  currentUserId,
  orderStatus,
  unreadCount,
  onChat,
}: RiderContactCardProps) {
  return (
    <div className="relative bg-surface-container-lowest rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/20 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="flex items-center gap-3 sm:gap-6 relative z-10 min-w-0">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
          <BlurImage
            src={image}
            alt={name}
            fill
            className="w-full h-full rounded-full overflow-hidden border-4 border-surface-container"
            sizes="80px"
          />
          {rating > 0 && (
            <div className="absolute bottom-0 right-0 bg-tertiary text-on-tertiary-fixed px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
              <span
                className="material-symbols-outlined text-[12px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {rating}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold tracking-tight text-on-surface">{name}</h3>
          <p className="text-on-surface-variant font-medium">Your delivery hero is on the move</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={onChat}
              className="flex-1 bg-secondary text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all scale-95 active:scale-90 relative"
            >
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <a
              href={`tel:${phone || ""}`}
              className="w-14 h-14 bg-surface-container text-secondary rounded-xl flex items-center justify-center hover:opacity-90 transition-all scale-95 active:scale-90"
            >
              <span className="material-symbols-outlined text-2xl">call</span>
            </a>
          </div>
          {currentUserId && ["shopping", "picked_up", "on_the_way", "arrived", "picking_up"].includes(orderStatus) && (
            <div className="mt-3">
              <ShareLocationToggle orderId={orderId} userId={currentUserId} enabled />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
