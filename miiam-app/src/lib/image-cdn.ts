const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export interface ImageSize {
  width: number;
  height: number;
}

export type ImageFormat = "webp" | "avif" | "jpeg" | "png" | "original";

const DEFAULT_SIZES: Record<string, ImageSize> = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
  original: { width: 0, height: 0 },
};

export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    format?: ImageFormat;
    quality?: number;
    resize?: "cover" | "contain" | "fill";
    preset?: keyof typeof DEFAULT_SIZES;
  } = {},
): string {
  if (!url || url.startsWith("data:")) return url;

  const { preset = "original", format = "webp", quality = 80, resize = "cover" } = options;
  let { width, height } = options;

  if (preset && DEFAULT_SIZES[preset]) {
    const presetSize = DEFAULT_SIZES[preset];
    width = width || presetSize.width || undefined;
    height = height || presetSize.height || undefined;
  }

  if (!SUPABASE_URL || !url.includes(SUPABASE_URL)) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams();

    if (width && width > 0) params.set("width", String(width));
    if (height && height > 0) params.set("height", String(height));
    if (format !== "original") params.set("format", format);
    if (quality) params.set("quality", String(quality));
    if (resize) params.set("resize", resize);

    const paramString = params.toString();
    if (paramString) {
      urlObj.search = paramString;
    }

    return urlObj.toString();
  } catch {
    return url;
  }
}

export function getResponsiveImageProps(
  url: string,
  options: {
    sizes?: string;
    quality?: number;
    format?: ImageFormat;
    preset?: keyof typeof DEFAULT_SIZES;
  } = {},
): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  const { sizes = "100vw", quality = 80, format = "webp", preset = "medium" } = options;

  const breakpoints = [640, 768, 1024, 1280, 1536];
  const src = getOptimizedImageUrl(url, { preset, format, quality });

  const srcSet = breakpoints
    .map((bp) => {
      const optimizedUrl = getOptimizedImageUrl(url, {
        width: bp,
        format,
        quality,
      });
      return `${optimizedUrl} ${bp}w`;
    })
    .join(", ");

  return { src, srcSet, sizes };
}

export function getPlaceholderUrl(url: string): string {
  return getOptimizedImageUrl(url, { preset: "thumbnail", quality: 20, format: "webp" });
}

export function isSupabaseStorageUrl(url: string): boolean {
  if (!SUPABASE_URL) return false;
  return url.includes(`${SUPABASE_URL}/storage/v1/object`);
}

export function getPublicUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
