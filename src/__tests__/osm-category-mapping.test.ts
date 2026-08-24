import { describe, it, expect } from "vitest";
import {
  mapCategoriesToOSMTags,
  buildOverpassQuery,
} from "../infrastructure/discovery/osm-category-mapping";

describe("OSM Category Mapping & Overpass Query Builder", () => {
  it("should map standard friendly categories to specific OSM tag filters", () => {
    const dentalFilters = mapCategoriesToOSMTags(["Dental & Clinics"]);
    expect(dentalFilters.length).toBeGreaterThan(0);
    expect(dentalFilters.some((f) => f.key === "amenity" && f.value === "dentist")).toBe(true);

    const restaurantFilters = mapCategoriesToOSMTags(["Restaurants & Cafes"]);
    expect(restaurantFilters.some((f) => f.key === "amenity" && f.value === "restaurant")).toBe(true);

    const gymFilters = mapCategoriesToOSMTags(["Gyms & Fitness"]);
    expect(gymFilters.some((f) => f.key === "leisure" && f.value === "fitness_centre")).toBe(true);
  });

  it("should handle custom unknown categories with fallback tags", () => {
    const customFilters = mapCategoriesToOSMTags(["CustomNicheService"]);
    expect(customFilters.length).toBeGreaterThan(0);
    expect(customFilters.some((f) => f.value === "customnicheservice")).toBe(true);
  });

  it("should build valid Overpass QL query syntax", () => {
    const filters = [{ key: "amenity", value: "dentist" }];
    const query = buildOverpassQuery(30.2672, -97.7431, 5000, filters);

    expect(query).toContain("[out:json]");
    expect(query).toContain("around:5000,30.2672,-97.7431");
    expect(query).toContain('["amenity"="dentist"]');
    expect(query).toContain('["name"]');
    expect(query).toContain("out center;");
  });
});
