import { describe, it, expect } from "vitest";
import {
  SCORING_WEIGHTS,
  TOTAL_MAX_SCORE,
  classifyScore,
  LEAD_CLASSIFICATION_THRESHOLDS,
  SEARCH_MODES,
  LEAD_LIFECYCLE_STAGES,
} from "../domain/constants";

describe("Domain Constants & Scoring Rules", () => {
  it("should sum scoring weights to exactly TOTAL_MAX_SCORE (100)", () => {
    const totalWeights = Object.values(SCORING_WEIGHTS).reduce(
      (sum, val) => sum + val,
      0
    );
    expect(totalWeights).toBe(100);
    expect(TOTAL_MAX_SCORE).toBe(100);
  });

  it("should correctly classify scores across all threshold boundaries", () => {
    // Boundaries: 0, 29, 30, 49, 50, 64, 65, 79, 80, 100
    expect(classifyScore(100)).toBe("HOT");
    expect(classifyScore(85)).toBe("HOT");
    expect(classifyScore(80)).toBe("HOT");

    expect(classifyScore(79)).toBe("HIGH");
    expect(classifyScore(70)).toBe("HIGH");
    expect(classifyScore(65)).toBe("HIGH");

    expect(classifyScore(64)).toBe("MEDIUM");
    expect(classifyScore(55)).toBe("MEDIUM");
    expect(classifyScore(50)).toBe("MEDIUM");

    expect(classifyScore(49)).toBe("LOW");
    expect(classifyScore(35)).toBe("LOW");
    expect(classifyScore(30)).toBe("LOW");

    expect(classifyScore(29)).toBe("NOT_QUALIFIED");
    expect(classifyScore(15)).toBe("NOT_QUALIFIED");
    expect(classifyScore(0)).toBe("NOT_QUALIFIED");
  });

  it("should handle out-of-bound or negative scores gracefully with clamping", () => {
    expect(classifyScore(-10)).toBe("NOT_QUALIFIED");
    expect(classifyScore(150)).toBe("HOT");
  });

  it("should have all 7 required search modes defined", () => {
    const modeIds = SEARCH_MODES.map((m) => m.id);
    expect(modeIds).toContain("BROAD");
    expect(modeIds).toContain("NO_WEBSITE");
    expect(modeIds).toContain("WEAK_WEBSITE");
    expect(modeIds).toContain("HIGH_REPUTATION");
    expect(modeIds).toContain("HIGH_AUTOMATION_POTENTIAL");
    expect(modeIds).toContain("PREMIUM_BUSINESS");
    expect(modeIds).toContain("CUSTOM");
    expect(SEARCH_MODES.length).toBe(7);
  });

  it("should define non-empty lifecycle stages with NEW and WON", () => {
    expect(LEAD_LIFECYCLE_STAGES).toContain("NEW");
    expect(LEAD_LIFECYCLE_STAGES).toContain("QUALIFIED");
    expect(LEAD_LIFECYCLE_STAGES).toContain("WON");
    expect(LEAD_LIFECYCLE_STAGES).toContain("LOST");
  });
});
