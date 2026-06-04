export interface PassportPreset {
  id: string;
  country: string;
  countryCode: string;
  documentType: "passport" | "visa" | "id_card" | "driving_license";
  widthMm: number;
  heightMm: number;
  backgroundColor: string;
  description: string;
  emoji: string;
}

export const PASSPORT_PRESETS: PassportPreset[] = [
  {
    id: "in_passport",
    country: "India",
    countryCode: "IN",
    documentType: "passport",
    widthMm: 35,
    heightMm: 35,
    backgroundColor: "#FFFFFF",
    description: "Indian passport photo (35×35mm)",
    emoji: "🇮🇳",
  },
  {
    id: "in_visa_us",
    country: "India",
    countryCode: "IN",
    documentType: "visa",
    widthMm: 51,
    heightMm: 51,
    backgroundColor: "#FFFFFF",
    description: "US visa from India (51×51mm / 2×2in)",
    emoji: "🇮🇳",
  },
  {
    id: "in_pan",
    country: "India",
    countryCode: "IN",
    documentType: "id_card",
    widthMm: 25,
    heightMm: 25,
    backgroundColor: "#FFFFFF",
    description: "PAN card photo (25×25mm)",
    emoji: "🇮🇳",
  },
  {
    id: "us_passport",
    country: "United States",
    countryCode: "US",
    documentType: "passport",
    widthMm: 51,
    heightMm: 51,
    backgroundColor: "#FFFFFF",
    description: "US passport / visa (2×2 inch)",
    emoji: "🇺🇸",
  },
  {
    id: "schengen_visa",
    country: "Schengen",
    countryCode: "EU",
    documentType: "visa",
    widthMm: 35,
    heightMm: 45,
    backgroundColor: "#F5F5F5",
    description: "Schengen visa (35×45mm)",
    emoji: "🇪🇺",
  },
  {
    id: "uk_passport",
    country: "United Kingdom",
    countryCode: "GB",
    documentType: "passport",
    widthMm: 35,
    heightMm: 45,
    backgroundColor: "#F5F5F5",
    description: "UK passport (35×45mm)",
    emoji: "🇬🇧",
  },
  {
    id: "cn_visa",
    country: "China",
    countryCode: "CN",
    documentType: "visa",
    widthMm: 33,
    heightMm: 48,
    backgroundColor: "#FFFFFF",
    description: "China visa (33×48mm)",
    emoji: "🇨🇳",
  },
  {
    id: "jp_visa",
    country: "Japan",
    countryCode: "JP",
    documentType: "visa",
    widthMm: 35,
    heightMm: 45,
    backgroundColor: "#F5F5F5",
    description: "Japan visa (35×45mm)",
    emoji: "🇯🇵",
  },
  {
    id: "ca_visa",
    country: "Canada",
    countryCode: "CA",
    documentType: "visa",
    widthMm: 35,
    heightMm: 45,
    backgroundColor: "#FFFFFF",
    description: "Canada visa (35×45mm)",
    emoji: "🇨🇦",
  },
  {
    id: "au_visa",
    country: "Australia",
    countryCode: "AU",
    documentType: "visa",
    widthMm: 35,
    heightMm: 45,
    backgroundColor: "#F5F5F5",
    description: "Australia visa (35×45mm)",
    emoji: "🇦🇺",
  },
  {
    id: "in_driving",
    country: "India",
    countryCode: "IN",
    documentType: "driving_license",
    widthMm: 35,
    heightMm: 45,
    backgroundColor: "#FFFFFF",
    description: "Indian driving licence (35×45mm)",
    emoji: "🇮🇳",
  },
];

export interface PhotoSet {
  count: number;
  price: number;
  popular?: boolean;
}

export const PHOTO_SETS: PhotoSet[] = [
  { count: 4, price: 99 },
  { count: 8, price: 149, popular: true },
  { count: 16, price: 249 },
  { count: 32, price: 399 },
];

export function getPresetById(id: string): PassportPreset | undefined {
  return PASSPORT_PRESETS.find((p) => p.id === id);
}

export function presetsByCountry(countryCode: string): PassportPreset[] {
  return PASSPORT_PRESETS.filter((p) => p.countryCode === countryCode);
}

export function getPhotoAspectRatio(preset: PassportPreset): number {
  return preset.widthMm / preset.heightMm;
}

export function mmToPixels(mm: number, dpi = 300): number {
  return Math.round((mm / 25.4) * dpi);
}

export function documentTypeLabel(type: PassportPreset["documentType"]): string {
  switch (type) {
    case "passport": return "Passport";
    case "visa": return "Visa";
    case "id_card": return "ID Card";
    case "driving_license": return "Driving Licence";
  }
}

export function checkCompliance(imageUrl: string): Promise<{
  width: number;
  height: number;
  aspect: number;
  isSquare: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  estimatedFileType: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const aspect = w / h;
      resolve({
        width: w,
        height: h,
        aspect,
        isSquare: Math.abs(aspect - 1) < 0.02,
        isLandscape: aspect > 1.02,
        isPortrait: aspect < 0.98,
        estimatedFileType: imageUrl.startsWith("data:image/png") ? "PNG" : "JPEG",
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}
