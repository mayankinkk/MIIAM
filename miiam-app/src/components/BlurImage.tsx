"use client";

import Image from "next/image";
import { useState } from "react";

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  fallbackSrc?: string;
}

export default function BlurImage({ src, alt, className = "", fill, width, height, sizes, fallbackSrc }: BlurImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  const commonProps = {
    src: imgSrc,
    alt,
    sizes,
    loading: "lazy" as const,
    className: `object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`,
    onLoad: () => setIsLoaded(true),
    onError: () => {
      setErrored(true);
      if (fallbackSrc) setImgSrc(fallbackSrc);
    },
  };

  if (errored && !fallbackSrc) {
    return (
      <div className={`flex items-center justify-center bg-surface-container ${className}`}>
        <span className="material-symbols-outlined text-outline-variant">image</span>
      </div>
    );
  }

  if (fill) {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <Image {...commonProps} fill alt={alt} />
        {!isLoaded && <div className="absolute inset-0 bg-surface-variant animate-pulse" />}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image {...commonProps} width={width ?? 400} height={height ?? 300} alt={alt} />
      {!isLoaded && <div className="absolute inset-0 bg-surface-variant animate-pulse" />}
    </div>
  );
}
