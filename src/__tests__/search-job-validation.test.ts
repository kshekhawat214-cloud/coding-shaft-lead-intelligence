import { describe, it, expect } from "vitest";
import {
  createSearchJobSchema,
  canTransitionJob,
  JobStatusType,
} from "../domain/search-job";

describe("Search Job Validation & Domain Rules", () => {
  it("should validate and accept valid search job input with default values", () => {
    const validData = {
      locationQuery: "Austin, TX",
      categories: ["Dental & Clinics", "Restaurants"],
    };

    const result = createSearchJobSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locationQuery).toBe("Austin, TX");
      expect(result.data.categories).toEqual(["Dental & Clinics", "Restaurants"]);
      expect(result.data.radiusMeters).toBe(10000);
      expect(result.data.maxBusinesses).toBe(20);
      expect(result.data.searchMode).toBe("BROAD");
    }
  });

  it("should validate and accept full custom search job input", () => {
    const fullData = {
      locationQuery: "Miami Beach, FL",
      categories: ["Real Estate"],
      radiusMeters: 5000,
      maxBusinesses: 50,
      minimumRating: 4.0,
      minimumReviewCount: 20,
      searchMode: "HIGH_REPUTATION",
      targetServices: ["website-redesign", "whatsapp-automation"],
      latitude: 25.7907,
      longitude: -80.13,
    };

    const result = createSearchJobSchema.safeParse(fullData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radiusMeters).toBe(5000);
      expect(result.data.maxBusinesses).toBe(50);
      expect(result.data.searchMode).toBe("HIGH_REPUTATION");
      expect(result.data.targetServices).toEqual(["website-redesign", "whatsapp-automation"]);
    }
  });

  it("should reject input when location query is empty or too short", () => {
    const invalidData = {
      locationQuery: " ",
      categories: ["Restaurants"],
    };

    const result = createSearchJobSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject input when categories array is empty", () => {
    const invalidData = {
      locationQuery: "Austin, TX",
      categories: [],
    };

    const result = createSearchJobSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject radius out of bounds (< 500m or > 50,000m)", () => {
    const tooSmall = {
      locationQuery: "Austin, TX",
      categories: ["Restaurants"],
      radiusMeters: 100,
    };
    expect(createSearchJobSchema.safeParse(tooSmall).success).toBe(false);

    const tooLarge = {
      locationQuery: "Austin, TX",
      categories: ["Restaurants"],
      radiusMeters: 60000,
    };
    expect(createSearchJobSchema.safeParse(tooLarge).success).toBe(false);
  });

  it("should reject maxBusinesses out of bounds (< 1 or > 100)", () => {
    const zero = {
      locationQuery: "Austin, TX",
      categories: ["Restaurants"],
      maxBusinesses: 0,
    };
    expect(createSearchJobSchema.safeParse(zero).success).toBe(false);

    const overLimit = {
      locationQuery: "Austin, TX",
      categories: ["Restaurants"],
      maxBusinesses: 200,
    };
    expect(createSearchJobSchema.safeParse(overLimit).success).toBe(false);
  });

  describe("Job Lifecycle State Transitions", () => {
    it("should allow valid transitions from QUEUED", () => {
      expect(canTransitionJob("QUEUED", "RUNNING")).toBe(true);
      expect(canTransitionJob("QUEUED", "CANCELLED")).toBe(true);
      expect(canTransitionJob("QUEUED", "FAILED")).toBe(true);
      expect(canTransitionJob("QUEUED", "COMPLETED")).toBe(false);
    });

    it("should allow valid transitions from RUNNING", () => {
      expect(canTransitionJob("RUNNING", "COMPLETED")).toBe(true);
      expect(canTransitionJob("RUNNING", "PARTIAL")).toBe(true);
      expect(canTransitionJob("RUNNING", "FAILED")).toBe(true);
      expect(canTransitionJob("RUNNING", "CANCELLED")).toBe(true);
      expect(canTransitionJob("RUNNING", "QUEUED")).toBe(false);
    });

    it("should not allow transitions from terminal states", () => {
      const terminalStates: JobStatusType[] = ["COMPLETED", "FAILED", "CANCELLED"];
      terminalStates.forEach((state) => {
        expect(canTransitionJob(state, "RUNNING")).toBe(false);
        expect(canTransitionJob(state, "QUEUED")).toBe(false);
      });
    });

    it("should allow transition to the same state (idempotent)", () => {
      expect(canTransitionJob("RUNNING", "RUNNING")).toBe(true);
      expect(canTransitionJob("COMPLETED", "COMPLETED")).toBe(true);
    });
  });
});
