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
  const [imgSrc, setImgSrc] = useState(src);

  const commonProps = {
    src: imgSrc,
    alt,
    sizes,
    className: `object-cover transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`,
    onLoad: () => setIsLoaded(true),
    onError: fallbackSrc ? () => setImgSrc(fallbackSrc) : undefined,
  };

  if (fill) {
    return (
      <div className={`relative ${className}`}>
        <Image {...commonProps} fill />
        {!isLoaded && <div className="absolute inset-0 bg-surface-variant animate-pulse" />}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image {...commonProps} width={width ?? 400} height={height ?? 300} />
      {!isLoaded && <div className="absolute inset-0 bg-surface-variant animate-pulse" />}
    </div>
  );
}
