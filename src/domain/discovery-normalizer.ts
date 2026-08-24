import { RawPlaceCandidate, GeocodeResult } from "@/infrastructure/discovery/discovery-provider.interface";
import { DiscoveredBusinessDTO } from "./types";

/**
 * Clean and format raw phone string
 */
export function normalizePhone(rawPhone?: string): string | undefined {
  if (!rawPhone) return undefined;
  const cleaned = rawPhone.trim().replace(/[^\d+()\-\s.]/g, "");
  return cleaned.length >= 7 ? cleaned : undefined;
}

/**
 * Clean and validate website URL
 */
export function normalizeWebsite(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let url = rawUrl.trim();

  // If missing protocol, prepend https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes(".")) {
      return parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname);
    }
  } catch {
    // Invalid URL format
  }
  return undefined;
}

/**
 * Format multi-tag address components into a single human-readable line
 */
export function formatAddress(tags: Record<string, string>, defaultLocation?: GeocodeResult): {
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
} {
  const house = tags["addr:housenumber"] || tags["addr:housename"];
  const street = tags["addr:street"];
  const unit = tags["addr:unit"] || tags["addr:door"];
  const city = tags["addr:city"] || defaultLocation?.city;
  const state = tags["addr:state"] || defaultLocation?.state;
  const postalCode = tags["addr:postcode"];
  const country = tags["addr:country"] || defaultLocation?.country;

  const parts: string[] = [];
  if (house && street) {
    parts.push(`${house} ${street}`);
  } else if (street) {
    parts.push(street);
  }

  if (unit) parts.push(`Unit ${unit}`);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (postalCode) parts.push(postalCode);

  const formattedAddress =
    parts.length > 0
      ? parts.join(", ")
      : defaultLocation?.displayName || "Address available on map";

  return {
    formattedAddress,
    city,
    state,
    country,
    postalCode,
  };
}

/**
 * Extract human-readable category from OSM tags
 */
export function deriveCategory(tags: Record<string, string>): {
  primaryCategory: string;
  categories: string[];
} {
  const categories: string[] = [];

  const mainTagKeys = [
    "amenity",
    "shop",
    "office",
    "healthcare",
    "craft",
    "leisure",
    "tourism",
  ];

  for (const key of mainTagKeys) {
    if (tags[key]) {
      const rawVal = tags[key].replace(/_/g, " ");
      const capitalized = rawVal.charAt(0).toUpperCase() + rawVal.slice(1);
      categories.push(capitalized);
    }
  }

  if (tags["cuisine"]) {
    const cuisines = tags["cuisine"].split(";").map((c) => `${c.trim()} Cuisine`);
    categories.push(...cuisines);
  }

  const primaryCategory = categories[0] || "Local Business";

  return {
    primaryCategory,
    categories: categories.length > 0 ? categories : [primaryCategory],
  };
}

/**
 * Normalizes raw candidate into standard DiscoveredBusinessDTO
 */
export function normalizeRawCandidate(
  candidate: RawPlaceCandidate,
  geocode?: GeocodeResult
): DiscoveredBusinessDTO {
  const { tags, lat, lon } = candidate;

  const { formattedAddress, city, state, country, postalCode } = formatAddress(
    tags,
    geocode
  );

  const { primaryCategory, categories } = deriveCategory(tags);

  const rawPhone =
    tags["phone"] ||
    tags["contact:phone"] ||
    tags["telephone"] ||
    tags["mobile"] ||
    tags["contact:mobile"];

  const rawWebsite =
    tags["website"] ||
    tags["contact:website"] ||
    tags["url"] ||
    tags["contact:url"];

  const phone = normalizePhone(rawPhone);
  const websiteUrl = normalizeWebsite(rawWebsite);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  return {
    externalPlaceId: `osm:${candidate.id}`,
    name: candidate.name,
    primaryCategory,
    categories,
    address: formattedAddress,
    city,
    state,
    country,
    postalCode,
    latitude: lat,
    longitude: lon,
    publicPhone: phone,
    websiteUrl,
    mapsUrl,
  };
}
