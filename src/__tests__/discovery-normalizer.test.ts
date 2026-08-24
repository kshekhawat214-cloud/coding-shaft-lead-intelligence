import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  normalizeWebsite,
  formatAddress,
  deriveCategory,
  normalizeRawCandidate,
} from "../domain/discovery-normalizer";
import { RawPlaceCandidate } from "../infrastructure/discovery/discovery-provider.interface";

describe("Discovery Data Normalizer", () => {
  it("should normalize phone numbers cleanly and ignore invalid ones", () => {
    expect(normalizePhone("+1 (512) 555-0199")).toBe("+1 (512) 555-0199");
    expect(normalizePhone("512.555.0199")).toBe("512.555.0199");
    expect(normalizePhone("123")).toBeUndefined(); // Too short
    expect(normalizePhone(undefined)).toBeUndefined();
  });

  it("should normalize and sanitize website URLs", () => {
    expect(normalizeWebsite("austindental.com")).toBe("https://austindental.com");
    expect(normalizeWebsite("http://example.com/about/")).toBe("http://example.com/about/");
    expect(normalizeWebsite("invalid-url")).toBeUndefined();
    expect(normalizeWebsite(undefined)).toBeUndefined();
  });

  it("should format multi-line address tags correctly", () => {
    const tags = {
      "addr:housenumber": "100",
      "addr:street": "Congress Ave",
      "addr:city": "Austin",
      "addr:state": "TX",
      "addr:postcode": "78701",
    };

    const addressResult = formatAddress(tags);
    expect(addressResult.formattedAddress).toBe("100 Congress Ave, Austin, TX, 78701");
    expect(addressResult.city).toBe("Austin");
    expect(addressResult.state).toBe("TX");
    expect(addressResult.postalCode).toBe("78701");
  });

  it("should derive primary category and tags correctly", () => {
    const tags = {
      amenity: "dentist",
      healthcare: "clinic",
    };

    const catResult = deriveCategory(tags);
    expect(catResult.primaryCategory).toBe("Dentist");
    expect(catResult.categories).toContain("Dentist");
    expect(catResult.categories).toContain("Clinic");
  });

  it("should normalize full RawPlaceCandidate into standard DiscoveredBusinessDTO", () => {
    const rawCandidate: RawPlaceCandidate = {
      id: "node/987654",
      type: "node",
      name: "Austin Smiles Dental",
      lat: 30.2672,
      lon: -97.7431,
      tags: {
        name: "Austin Smiles Dental",
        amenity: "dentist",
        "addr:housenumber": "500",
        "addr:street": "Lamar Blvd",
        "addr:city": "Austin",
        "addr:state": "TX",
        phone: "+1 512 555 1234",
        website: "https://austinsmilesdental.com",
      },
    };

    const normalized = normalizeRawCandidate(rawCandidate);
    expect(normalized.externalPlaceId).toBe("osm:node/987654");
    expect(normalized.name).toBe("Austin Smiles Dental");
    expect(normalized.primaryCategory).toBe("Dentist");
    expect(normalized.publicPhone).toBe("+1 512 555 1234");
    expect(normalized.websiteUrl).toBe("https://austinsmilesdental.com");
    expect(normalized.address).toContain("500 Lamar Blvd");
    expect(normalized.latitude).toBe(30.2672);
    expect(normalized.longitude).toBe(-97.7431);
    expect(normalized.mapsUrl).toContain("30.2672,-97.7431");
  });
});
