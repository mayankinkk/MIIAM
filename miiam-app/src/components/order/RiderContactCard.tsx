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
    <div className="bg-surface-container-lowest relative overflow-hidden rounded-2xl p-4 shadow-sm sm:p-6">
      <div className="bg-secondary-container/20 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-2xl" />
      <div className="relative z-10 flex min-w-0 items-center gap-3 sm:gap-6">
        <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
          <BlurImage
            src={image}
            alt={name}
            fill
            className="border-surface-container h-full w-full overflow-hidden rounded-full border-4"
            sizes="80px"
          />
          {rating > 0 && (
            <div className="bg-tertiary text-on-tertiary-fixed absolute right-0 bottom-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black shadow-sm">
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
          <h3 className="text-on-surface text-xl font-bold tracking-tight">{name}</h3>
          <p className="text-on-surface-variant font-medium">Your delivery hero is on the move</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={onChat}
              className="bg-secondary relative flex flex-1 scale-95 items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-all hover:opacity-90 active:scale-90"
            >
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              Chat
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-md">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <a
              href={`tel:${phone || ""}`}
              className="bg-surface-container text-secondary flex h-14 w-14 scale-95 items-center justify-center rounded-xl transition-all hover:opacity-90 active:scale-90"
            >
              <span className="material-symbols-outlined text-2xl">call</span>
            </a>
          </div>
          {currentUserId &&
            ["shopping", "picked_up", "on_the_way", "arrived", "picking_up"].includes(
              orderStatus
            ) && (
              <div className="mt-3">
                <ShareLocationToggle orderId={orderId} userId={currentUserId} enabled />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
