"use client";

import { useState } from "react";
import Image from "next/image";

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
          className="relative w-full h-56 rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => setShowModal(true)}
        >
          <Image
            src={images[selectedIndex].url}
            alt={images[selectedIndex].alt || name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">photo_library</span>
              {images.length} photos
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedIndex(idx)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === selectedIndex ? "border-[#ba001c]" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt || `${name} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <button 
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            onClick={() => setShowModal(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden mb-4">
              <Image
                src={images[selectedIndex].url}
                alt={images[selectedIndex].alt || name}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto justify-center">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      idx === selectedIndex ? "border-[#ba001c]" : "border-white/30"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
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