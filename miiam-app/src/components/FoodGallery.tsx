"use client";

import { useState } from "react";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-urls";

interface FoodImage {
  id: string;
  url: string;
  alt?: string;
}

interface FoodGalleryProps {
  images: FoodImage[];
  name: string;
}

export function FoodGallery({ images, name }: FoodGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  if (!images.length) return null;

  return (
    <>
      <div className="space-y-3">
        <div
          className="group relative h-56 w-full cursor-pointer overflow-hidden rounded-2xl"
          onClick={() => setShowModal(true)}
        >
          <Image
            src={images[selectedIndex].url}
            alt={images[selectedIndex].alt || name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={!canOptimizeImage(images[selectedIndex].url)}
          />
          {images.length > 1 && (
            <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              <span className="material-symbols-outlined text-sm">photo_library</span>
              {images.length} photos
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        </div>

        {images.length > 1 && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedIndex(idx)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  idx === selectedIndex
                    ? "border-[var(--color-primary)]"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${name} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized={!canOptimizeImage(img.url)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowModal(false)}
        >
          <button
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            onClick={() => setShowModal(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative mb-4 h-[70vh] w-full overflow-hidden rounded-2xl">
              <Image
                src={images[selectedIndex].url}
                alt={images[selectedIndex].alt || name}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized={!canOptimizeImage(images[selectedIndex].url)}
              />
            </div>

            {images.length > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                      idx === selectedIndex ? "border-[var(--color-primary)]" : "border-white/30"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={!canOptimizeImage(img.url)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
