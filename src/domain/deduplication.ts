import { DiscoveredBusinessDTO } from "./types";

/**
 * Calculates distance in meters between two lat/lon points using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Normalizes name for fuzzy matching (lowercase, removes punctuation and common suffixes)
 */
export function normalizeNameForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(llc|inc|corp|ltd|co|company|group|services)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Merges two duplicate business records, keeping the most complete information
 */
export function mergeBusinessRecords(
  primary: DiscoveredBusinessDTO,
  secondary: DiscoveredBusinessDTO
): DiscoveredBusinessDTO {
  const mergedCategories = Array.from(
    new Set([...primary.categories, ...secondary.categories])
  );

  return {
    ...primary,
    categories: mergedCategories,
    publicPhone: primary.publicPhone || secondary.publicPhone,
    websiteUrl: primary.websiteUrl || secondary.websiteUrl,
    address:
      primary.address && !primary.address.includes("available on map")
        ? primary.address
        : secondary.address || primary.address,
    city: primary.city || secondary.city,
    state: primary.state || secondary.state,
    country: primary.country || secondary.country,
    postalCode: primary.postalCode || secondary.postalCode,
  };
}

/**
 * Deduplicates a list of discovered businesses
 */
export function deduplicateBusinesses(
  businesses: DiscoveredBusinessDTO[]
): DiscoveredBusinessDTO[] {
  const uniqueList: DiscoveredBusinessDTO[] = [];
  const seenIds = new Set<string>();

  for (const item of businesses) {
    // 1. Direct ID match
    if (seenIds.has(item.externalPlaceId)) {
      continue;
    }

    // 2. Check for duplicate by phone or name + proximity
    let duplicateIndex = -1;

    for (let i = 0; i < uniqueList.length; i++) {
      const existing = uniqueList[i];

      // Exact phone match
      if (
        item.publicPhone &&
        existing.publicPhone &&
        item.publicPhone === existing.publicPhone
      ) {
        duplicateIndex = i;
        break;
      }

      // Name similarity + proximity (< 100 meters)
      const name1 = normalizeNameForComparison(item.name);
      const name2 = normalizeNameForComparison(existing.name);

      if (name1 && name2 && (name1 === name2 || name1.includes(name2) || name2.includes(name1))) {
        if (
          item.latitude &&
          item.longitude &&
          existing.latitude &&
          existing.longitude
        ) {
          const dist = calculateDistanceMeters(
            item.latitude,
            item.longitude,
            existing.latitude,
            existing.longitude
          );
          if (dist <= 100) {
            duplicateIndex = i;
            break;
          }
        }
      }
    }

    if (duplicateIndex >= 0) {
      // Merge with existing record
      uniqueList[duplicateIndex] = mergeBusinessRecords(
        uniqueList[duplicateIndex],
        item
      );
    } else {
      seenIds.add(item.externalPlaceId);
      uniqueList.push(item);
    }
  }

  return uniqueList;
}
