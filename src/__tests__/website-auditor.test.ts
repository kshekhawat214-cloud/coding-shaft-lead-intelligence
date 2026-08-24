import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebsiteAuditor } from "@/infrastructure/audit/website-auditor";

// Mock the global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeHtmlResponse(html: string, status = 200, url = "https://example.com") {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(html).buffer;
  return Promise.resolve({
    ok: status >= 200 && status < 400,
    status,
    url,
    arrayBuffer: () => Promise.resolve(buffer),
  } as unknown as Response);
}

const FULL_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Best London Cafe</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="The best cafe in London serving premium coffee">
  <link rel="canonical" href="https://example.com">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
</head>
<body>
  <h1>Welcome to Best London Cafe</h1>
  <p>Call us: <a href="tel:+441234567890">+44 1234 567890</a></p>
  <a href="https://wa.me/441234567890">Chat on WhatsApp</a>
  <a href="https://calendly.com/bestcafe/booking">Book a Table</a>
  <a href="https://facebook.com/bestcafe">Facebook</a>
  <a href="https://instagram.com/bestcafe">Instagram</a>
  <form action="/contact" method="post">
    <input type="email" name="email" placeholder="Your email">
    <input type="text" name="message">
    <button type="submit">Send Message</button>
  </form>
</body>
</html>`;

const MINIMAL_HTML = `<html><body><p>Under construction</p></body></html>`;

describe("WebsiteAuditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Full-featured website", () => {
    it("detects SSL from https resolved URL", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasSSL).toBe(true);
      expect(result.missingSSL).toBe(false);
    });

    it("detects viewport meta tag", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasViewportMeta).toBe(true);
      expect(result.missingViewport).toBe(false);
    });

    it("extracts page title correctly", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasTitle).toBe(true);
      expect(result.titleText).toBe("Best London Cafe");
    });

    it("extracts meta description", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasMetaDescription).toBe(true);
      expect(result.metaDescriptionText).toContain("best cafe in London");
    });

    it("detects H1 heading", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasH1).toBe(true);
      expect(result.h1Text).toBe("Welcome to Best London Cafe");
    });

    it("detects WhatsApp link", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasWhatsApp).toBe(true);
    });

    it("detects online booking (Calendly)", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasOnlineBooking).toBe(true);
    });

    it("detects contact form with email input", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasContactForm).toBe(true);
    });

    it("detects phone number via tel: link", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasPhoneNumber).toBe(true);
    });

    it("detects Facebook and Instagram social links", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasFacebook).toBe(true);
      expect(result.hasInstagram).toBe(true);
    });

    it("detects Google Tag Manager", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.hasGoogleTagManager).toBe(true);
    });

    it("produces a high audit score (≥ 75) for a well-optimized site", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(FULL_HTML, 200, "https://example.com"));
      const result = await WebsiteAuditor.audit("https://example.com");
      expect(result.auditScore).toBeGreaterThanOrEqual(75);
      expect(result.reachable).toBe(true);
    });
  });

  describe("Minimal / weak website", () => {
    it("flags all weaknesses on a barebones page", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(MINIMAL_HTML, 200, "http://example.com"));
      const result = await WebsiteAuditor.audit("http://example.com");

      expect(result.missingSSL).toBe(true);
      expect(result.missingViewport).toBe(true);
      expect(result.missingTitle).toBe(true);
      expect(result.missingMetaDescription).toBe(true);
      expect(result.missingWhatsApp).toBe(true);
      expect(result.missingBooking).toBe(true);
      expect(result.missingContactForm).toBe(true);
      expect(result.missingAnalytics).toBe(true);
      expect(result.weaknesses.length).toBeGreaterThan(5);
      expect(result.auditScore).toBe(0);
    });
  });

  describe("Unreachable website", () => {
    it("returns reachable=false and score=0 on network error", async () => {
      mockFetch.mockRejectedValue(new Error("fetch failed: ECONNREFUSED"));
      const result = await WebsiteAuditor.audit("https://dead-website-that-doesnt-exist.xyz");

      expect(result.reachable).toBe(false);
      expect(result.auditScore).toBe(0);
      expect(result.errorMessage).toContain("ECONNREFUSED");
      expect(result.weaknesses).toHaveLength(1);
    });

    it("prepends https:// when scheme is missing", async () => {
      mockFetch.mockReturnValue(makeHtmlResponse(MINIMAL_HTML, 200, "https://nodomain.com"));
      await WebsiteAuditor.audit("nodomain.com");
      const calledUrl = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toBe("https://nodomain.com");
    });
  });

  describe("Platform detection", () => {
    it("detects WordPress from wp-content path", async () => {
      const wpHtml = `<html><head><link rel="stylesheet" href="/wp-content/themes/main.css"></head><body></body></html>`;
      mockFetch.mockReturnValue(makeHtmlResponse(wpHtml, 200, "https://wp-site.com"));
      const result = await WebsiteAuditor.audit("https://wp-site.com");
      expect(result.hasWordPress).toBe(true);
    });

    it("detects Shopify from cdn.shopify.com", async () => {
      const shopifyHtml = `<html><head><script src="https://cdn.shopify.com/s/files/1/main.js"></script></head><body></body></html>`;
      mockFetch.mockReturnValue(makeHtmlResponse(shopifyHtml, 200, "https://shop.myshopify.com"));
      const result = await WebsiteAuditor.audit("https://shop.myshopify.com");
      expect(result.hasShopify).toBe(true);
    });
  });
});
