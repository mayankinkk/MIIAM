import { NOMINATIM_REVERSE_URL, NOMINATIM_SEARCH_URL } from "./constants";

const HEADERS = { "Accept-Language": "en", "User-Agent": "MIIAM/1.0" };

export interface GeocodedAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  displayAddress: string;
  lat: number;
  lng: number;
}

export function buildDisplayAddress(address: Record<string, string>): string {
  const parts: string[] = [];

  if (address.building || address.house_number) {
    const building = [address.building, address.house_number].filter(Boolean).join(" ");
    parts.push(building);
  }

  if (address.road || address.street) {
    parts.push(address.road || address.street);
  }

  const locality = address.neighbourhood || address.suburb || address.quarter || address.city_district || address.residential;
  if (locality) parts.push(locality);

  const city = address.city || address.town || address.village || address.county;
  if (city && !parts.some(p => p.toLowerCase() === city.toLowerCase())) parts.push(city);

  return parts.join(", ");
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress> {
  const res = await fetch(
    `${NOMINATIM_REVERSE_URL}&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    { headers: HEADERS }
  );
  const data = await res.json();
  const addr = data.address || {};
  const displayAddress = buildDisplayAddress(addr) ||
    data.display_name?.split(",").slice(0, 3).join(", ") ||
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return {
    street: displayAddress,
    city: addr.city || addr.town || addr.village || addr.county || "",
    state: addr.state || "",
    postalCode: addr.postcode || "",
    displayAddress,
    lat,
    lng,
  };
}

export interface NominatimResult {
  place_id?: number;
  display_name: string;
  lat: string;
  lon: string;
  address: Record<string, string>;
  [key: string]: unknown;
}

export async function searchLocation(query: string, limit = 5): Promise<NominatimResult[]> {
  const res = await fetch(
    `${NOMINATIM_SEARCH_URL}&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`,
    { headers: HEADERS }
  );
  return res.json();
}

export async function geocodePincode(pin: string): Promise<GeocodedAddress | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_SEARCH_URL}&postalcode=${pin}&countrycodes=in&addressdetails=1&limit=1`,
      { headers: HEADERS }
    );
    const data = await res.json();
    if (data.length === 0) return null;

    const hit = data[0];
    const addr = hit.address || {};
    const displayAddress = buildDisplayAddress(addr) ||
      hit.display_name?.split(",").slice(0, 3).join(", ") ||
      `PIN: ${pin}`;

    return {
      street: displayAddress,
      city: addr.city || addr.town || addr.village || addr.county || "",
      state: addr.state || "",
      postalCode: pin,
      displayAddress,
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
    };
  } catch {
    return null;
  }
}
