import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma at module boundary so no real DB calls happen
vi.mock("@/lib/db", () => ({
  prisma: {
    business: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    businessLocation: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    businessContact: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    leadScore: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    reviewSnapshot: {
      create: vi.fn(),
    },
    reviewInsight: {
      create: vi.fn(),
    },
    serviceOpportunity: {
      create: vi.fn(),
    },
    outreachRecord: {
      create: vi.fn(),
    },
    researchRun: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { BusinessRepository } from "@/repositories/business-repository";
import { prisma } from "@/lib/db";
import { DiscoveredBusinessDTO } from "@/domain/types";

function makeDto(overrides: Partial<DiscoveredBusinessDTO> = {}): DiscoveredBusinessDTO {
  return {
    externalPlaceId: "osm:node:999",
    name: "Test Cafe",
    primaryCategory: "cafe",
    categories: ["cafe", "food"],
    address: "123 Main St, London",
    city: "London",
    state: "England",
    country: "GB",
    postalCode: "EC1A 1BB",
    latitude: 51.5074,
    longitude: -0.1278,
    publicPhone: "+441234567890",
    websiteUrl: "https://testcafe.example.com",
    mapsUrl: "https://www.openstreetmap.org/node/999",
    ...overrides,
  };
}

const mockTx = {
  business: { create: vi.fn().mockResolvedValue({ id: "biz-uuid-1" }) },
  businessLocation: { create: vi.fn().mockResolvedValue({}) },
  businessContact: { create: vi.fn().mockResolvedValue({}) },
  leadScore: { upsert: vi.fn().mockResolvedValue({ totalScore: 85, classification: "HOT" }) },
  reviewSnapshot: { create: vi.fn().mockResolvedValue({}) },
  reviewInsight: { create: vi.fn().mockResolvedValue({}) },
  serviceOpportunity: {
    create: vi.fn().mockResolvedValue({}),
  },
  outreachRecord: {
    create: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({}),
  },
};

describe("BusinessRepository.upsertBusiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new business with location, contact, reputation, and outreach when none exists", async () => {
    (prisma.business.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (fn) => fn(mockTx));

    const result = await BusinessRepository.upsertBusiness(makeDto());

    expect(result.isNew).toBe(true);
    expect(result.businessId).toBe("biz-uuid-1");
    expect(result.name).toBe("Test Cafe");
  });

  it("returns isNew=false and updates when business already exists", async () => {
    (prisma.business.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing-biz-1",
      name: "Test Cafe",
      primaryCategory: "cafe",
      leadScore: { totalScore: 80, classification: "HOT" },
    });
    (prisma.business.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.businessLocation.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.businessContact.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await BusinessRepository.upsertBusiness(makeDto());

    expect(result.isNew).toBe(false);
    expect(result.businessId).toBe("existing-biz-1");
    expect(prisma.business.update).toHaveBeenCalled();
  });
});

describe("BusinessRepository.bulkUpsert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes all businesses, collecting errors without throwing", async () => {
    (prisma.business.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("DB error"));

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (fn) => fn(mockTx));

    const dtos = [
      makeDto({ externalPlaceId: "osm:node:1", name: "A" }),
      makeDto({ externalPlaceId: "osm:node:2", name: "B" }),
    ];

    const result = await BusinessRepository.bulkUpsert(dtos, "job-123");

    expect(result.totalProcessed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].externalPlaceId).toBe("osm:node:2");
  });

  it("correctly counts new vs updated businesses", async () => {
    (prisma.business.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "existing-id",
        name: "Existing",
        leadScore: { totalScore: 80, classification: "HOT" },
      });

    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (fn) => fn(mockTx));
    (prisma.business.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const dtos = [
      makeDto({ externalPlaceId: "osm:node:new", name: "New" }),
      makeDto({ externalPlaceId: "osm:node:existing", name: "Existing" }),
    ];

    const result = await BusinessRepository.bulkUpsert(dtos, "job-456");

    expect(result.totalNew).toBe(1);
    expect(result.totalUpdated).toBe(1);
    expect(result.totalProcessed).toBe(2);
  });
});

describe("BusinessRepository.associateWithJob", () => {
  it("calls prisma.researchRun.createMany with DISCOVERY type", async () => {
    (prisma.researchRun.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });

    await BusinessRepository.associateWithJob(["biz-1", "biz-2"], "job-999");

    expect(prisma.researchRun.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          businessId: "biz-1",
          jobId: "job-999",
          researchType: "DISCOVERY",
        }),
      ]),
      skipDuplicates: true,
    });
  });
});
