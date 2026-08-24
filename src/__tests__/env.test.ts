import { describe, it, expect } from "vitest";
import { getEnv } from "../lib/env";

describe("Environment Configuration & Validation", () => {
  it("should return validated environment object with defaults", () => {
    const env = getEnv();
    expect(env).toBeDefined();
    expect(env.NODE_ENV).toBeDefined();
    expect(["development", "test", "production"]).toContain(env.NODE_ENV);
    expect(typeof env.PORT).toBe("number");
    expect(typeof env.DATABASE_URL).toBe("string");
    expect(typeof env.MAX_SEARCH_RESULTS_DEFAULT).toBe("number");
    expect(typeof env.DISCOVERY_RATE_LIMIT_PER_MINUTE).toBe("number");
  });
});
