import { describe, it, expect } from "vitest";
import {
  deduplicateBusinesses,
  calculateDistanceMeters,
  normalizeNameForComparison,
} from "../domain/deduplication";
import { DiscoveredBusinessDTO } from "../domain/types";

describe("Business Deduplication Engine", () => {
  it("should calculate distance between coordinates correctly using Haversine formula", () => {
    // Distance between Austin downtown (30.2672, -97.7431) and slightly north (30.2680, -97.7431) is ~89 meters
    const dist = calculateDistanceMeters(30.2672, -97.7431, 30.268, -97.7431);
    expect(dist).toBeGreaterThan(80);
    expect(dist).toBeLessThan(100);
  });

  it("should normalize business names for comparison by stripping LLC, Inc, punctuation", () => {
    expect(normalizeNameForComparison("Austin Smiles Dental, LLC")).toBe("austinsmilesdental");
    expect(normalizeNameForComparison("Austin Smiles Dental Inc.")).toBe("austinsmilesdental");
  });

  it("should deduplicate duplicate records with matching externalPlaceId", () => {
    const list: DiscoveredBusinessDTO[] = [
      {
        externalPlaceId: "osm:node/123",
        name: "Prime Dental",
        categories: ["Dentist"],
      },
      {
        externalPlaceId: "osm:node/123", // Duplicate
        name: "Prime Dental Updated",
        categories: ["Dentist", "Clinic"],
      },
    ];

    const result = deduplicateBusinesses(list);
    expect(result.length).toBe(1);
  });

  it("should deduplicate and merge records with matching phone number", () => {
    const list: DiscoveredBusinessDTO[] = [
      {
        externalPlaceId: "osm:node/1",
        name: "Acme Dental",
        categories: ["Dentist"],
        publicPhone: "512-555-9999",
      },
      {
        externalPlaceId: "osm:way/2", // Different ID, same phone
        name: "Acme Dental Care LLC",
        categories: ["Dental Clinic"],
        publicPhone: "512-555-9999",
        websiteUrl: "https://acmedental.com",
      },
    ];

    const result = deduplicateBusinesses(list);
    expect(result.length).toBe(1);
    expect(result[0].publicPhone).toBe("512-555-9999");
    expect(result[0].websiteUrl).toBe("https://acmedental.com"); // Merged
    expect(result[0].categories).toContain("Dentist");
    expect(result[0].categories).toContain("Dental Clinic");
  });

  it("should deduplicate records with similar name within 100 meters proximity", () => {
    const list: DiscoveredBusinessDTO[] = [
      {
        externalPlaceId: "osm:node/10",
        name: "Austin Coffee Roasters",
        categories: ["Cafe"],
        latitude: 30.2672,
        longitude: -97.7431,
      },
      {
        externalPlaceId: "osm:way/20",
        name: "Austin Coffee Roasters LLC",
        categories: ["Coffee Shop"],
        latitude: 30.2673, // ~15m away
        longitude: -97.7431,
        websiteUrl: "https://austincoffeeroasters.com",
      },
    ];

    const result = deduplicateBusinesses(list);
    expect(result.length).toBe(1);
    expect(result[0].websiteUrl).toBe("https://austincoffeeroasters.com");
  });
});
