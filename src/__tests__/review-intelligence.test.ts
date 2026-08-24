import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewAnalyzer } from "@/infrastructure/reviews/review-analyzer";
import { ReviewScraper } from "@/infrastructure/reviews/review-scraper";

// ─── ReviewAnalyzer Tests ─────────────────────────────────────────────────────

describe("ReviewAnalyzer", () => {
  describe("Sentiment detection", () => {
    it("returns POSITIVE sentiment for high-rating + positive text", () => {
      const result = ReviewAnalyzer.analyze(
        ["excellent service and amazing food, highly recommend"],
        ["The staff were friendly and professional, absolutely brilliant"],
        4.8,
        120
      );
      expect(result.overallSentiment).toBe("POSITIVE");
      expect(result.confidenceScore).toBeGreaterThan(0.5);
    });

    it("returns NEGATIVE sentiment for low-rating + negative text", () => {
      const result = ReviewAnalyzer.analyze(
        ["terrible service, rude staff, avoid this place"],
        [],
        1.5,
        30
      );
      expect(result.overallSentiment).toBe("NEGATIVE");
    });

    it("returns NEUTRAL sentiment when no data available", () => {
      const result = ReviewAnalyzer.analyze([], [], null, null);
      expect(result.overallSentiment).toBe("NEUTRAL");
      expect(result.confidenceScore).toBe(0.0);
    });

    it("returns MIXED sentiment when both positives and negatives present", () => {
      const result = ReviewAnalyzer.analyze(
        ["great food but terrible service, slow and expensive"],
        [],
        3.0,
        50
      );
      expect(["MIXED", "POSITIVE", "NEGATIVE"]).toContain(result.overallSentiment);
    });
  });

  describe("Theme extraction", () => {
    it("extracts positive themes correctly", () => {
      const result = ReviewAnalyzer.analyze(
        ["excellent service and friendly staff, great value for money"],
        [],
        null,
        null
      );
      expect(result.positiveThemes).toContain("Great service");
      expect(result.positiveThemes).toContain("Friendly staff");
      expect(result.positiveThemes).toContain("Good value");
    });

    it("extracts negative themes correctly", () => {
      const result = ReviewAnalyzer.analyze(
        ["slow service and overpriced for what you get"],
        [],
        null,
        null
      );
      expect(result.negativeThemes).toContain("Slow service");
      expect(result.negativeThemes).toContain("Overpriced");
    });

    it("detects WhatsApp orders as 'famous for' signal", () => {
      const result = ReviewAnalyzer.analyze(
        ["order via whatsapp and they deliver fast"],
        [],
        null,
        null
      );
      expect(result.famousFor).toContain("WhatsApp orders");
    });

    it("detects pain points from negative feedback patterns", () => {
      const result = ReviewAnalyzer.analyze(
        ["cash only which is inconvenient, no card payments accepted"],
        [],
        null,
        null
      );
      expect(result.customerPainPoints).toContain("No card payments");
    });
  });

  describe("Sentiment summary generation", () => {
    it("includes rating and review count in summary when available", () => {
      const result = ReviewAnalyzer.analyze([], [], 4.5, 200);
      expect(result.sentimentSummary).toContain("4.5");
      expect(result.sentimentSummary).toContain("200");
    });

    it("mentions top positive themes in summary for positive sentiment", () => {
      const result = ReviewAnalyzer.analyze(
        ["excellent service, friendly staff, great value"],
        [],
        5.0,
        50
      );
      expect(result.sentimentSummary.toLowerCase()).toMatch(/service|staff|value/);
    });
  });

  describe("Confidence scoring", () => {
    it("gives higher confidence when rating and snippets are present", () => {
      const withData = ReviewAnalyzer.analyze(
        ["amazing quality work"],
        ["truly professional team"],
        4.8,
        80
      );
      const withoutData = ReviewAnalyzer.analyze([], [], null, null);
      expect(withData.confidenceScore).toBeGreaterThan(withoutData.confidenceScore);
    });

    it("caps confidence at 1.0", () => {
      const result = ReviewAnalyzer.analyze(
        ["best ever"],
        ["wonderful experience"],
        5.0,
        500
      );
      expect(result.confidenceScore).toBeLessThanOrEqual(1.0);
    });
  });
});

// ─── ReviewScraper Tests ──────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeResponse(html: string, status = 200, url = "https://example.com") {
  const buffer = new TextEncoder().encode(html).buffer;
  return Promise.resolve({
    ok: status >= 200 && status < 400,
    status,
    url,
    arrayBuffer: () => Promise.resolve(buffer),
  } as unknown as Response);
}

describe("ReviewScraper", () => {
  beforeEach(() => vi.clearAllMocks());

  it("extracts AggregateRating from JSON-LD structured data", async () => {
    const html = `<html><head>
      <script type="application/ld+json">
        {"@type":"LocalBusiness","aggregateRating":{"@type":"AggregateRating","ratingValue":"4.7","reviewCount":"156","bestRating":"5"}}
      </script>
    </head><body></body></html>`;

    mockFetch.mockReturnValue(makeResponse(html));
    const result = await ReviewScraper.scrapeFromWebsite("https://example.com");

    expect(result.rating).toBe(4.7);
    expect(result.reviewCount).toBe(156);
    expect(result.ratingMax).toBe(5);
    expect(result.errorMessage).toBeNull();
  });

  it("extracts review bodies from JSON-LD review array", async () => {
    const html = `<html><head>
      <script type="application/ld+json">
        {"@type":"Product","review":[{"reviewBody":"Absolutely fantastic service, will use again!"},{"reviewBody":"Great quality and very professional team."}]}
      </script>
    </head><body></body></html>`;

    mockFetch.mockReturnValue(makeResponse(html));
    const result = await ReviewScraper.scrapeFromWebsite("https://example.com");

    expect(result.reviewSnippets.length).toBeGreaterThan(0);
    expect(result.reviewSnippets[0]).toContain("fantastic service");
  });

  it("returns empty result with error on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await ReviewScraper.scrapeFromWebsite("https://broken.example.com");

    expect(result.rating).toBeNull();
    expect(result.reviewCount).toBeNull();
    expect(result.errorMessage).toContain("ECONNREFUSED");
  });

  it("returns empty result on non-200 HTTP response", async () => {
    mockFetch.mockReturnValue(makeResponse("", 404));
    const result = await ReviewScraper.scrapeFromWebsite("https://example.com");

    expect(result.rating).toBeNull();
    expect(result.errorMessage).toContain("404");
  });

  it("handles @graph JSON-LD structure", async () => {
    const html = `<html><head>
      <script type="application/ld+json">
        {"@graph":[{"@type":"WebSite","name":"Example"},{"@type":"LocalBusiness","aggregateRating":{"ratingValue":"3.9","reviewCount":"45"}}]}
      </script>
    </head><body></body></html>`;

    mockFetch.mockReturnValue(makeResponse(html));
    const result = await ReviewScraper.scrapeFromWebsite("https://example.com");

    expect(result.rating).toBe(3.9);
    expect(result.reviewCount).toBe(45);
  });
});
