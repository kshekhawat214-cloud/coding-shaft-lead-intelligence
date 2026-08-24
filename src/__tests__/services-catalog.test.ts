import { describe, it, expect } from "vitest";
import {
  CODING_SHAFT_SERVICES,
  getServiceById,
  getServicesByCategory,
  getAllServiceNames,
} from "../domain/services-catalog";

describe("Coding Shaft Services Catalog", () => {
  it("should contain all 22 required services", () => {
    expect(CODING_SHAFT_SERVICES.length).toBe(22);
  });

  it("should have all required fields on every service item", () => {
    CODING_SHAFT_SERVICES.forEach((service) => {
      expect(service.id).toBeDefined();
      expect(service.name).toBeDefined();
      expect(service.category).toBeDefined();
      expect(service.tier).toBeDefined();
      expect(service.description.length).toBeGreaterThan(10);
      expect(service.targetSignals.length).toBeGreaterThan(0);
      expect(typeof service.quickWinPotential).toBe("boolean");
    });
  });

  it("should find services by ID or name case-insensitively", () => {
    const webDev = getServiceById("website-development");
    expect(webDev).toBeDefined();
    expect(webDev?.name).toBe("Website Development");

    const aiChatbot = getServiceById("AI Chatbots");
    expect(aiChatbot).toBeDefined();
    expect(aiChatbot?.id).toBe("ai-chatbots");
  });

  it("should filter services by category accurately", () => {
    const aiServices = getServicesByCategory("AI & Automation");
    expect(aiServices.length).toBeGreaterThan(0);
    aiServices.forEach((s) => expect(s.category).toBe("AI & Automation"));
  });

  it("should list all 22 unique service names", () => {
    const names = getAllServiceNames();
    expect(names.length).toBe(22);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(22);
  });
});
