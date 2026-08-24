import { logger } from "@/lib/logger";

const log = logger.child("ReviewScraper");

export interface ScrapedReviewData {
  source: string;
  rating: number | null;
  reviewCount: number | null;
  ratingMax: number | null;
  reviewSnippets: string[];
  testimonials: string[];
  fetchedAt: string;
  errorMessage: string | null;
}

// ─── JSON-LD / Schema.org Helpers ─────────────────────────────────────────────

interface JsonLdAggregateRating {
  "@type"?: string;
  ratingValue?: string | number;
  reviewCount?: string | number;
  ratingCount?: string | number;
  bestRating?: string | number;
}

interface JsonLdGraph {
  "@type"?: string | string[];
  aggregateRating?: JsonLdAggregateRating;
  review?: Array<{ reviewBody?: string; description?: string }>;
}

function extractJsonLd(html: string): JsonLdAggregateRating | null {
  // Find all JSON-LD script blocks
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as JsonLdGraph | JsonLdGraph[];

      const candidates = Array.isArray(parsed) ? parsed : [parsed];

      for (const candidate of candidates) {
        // Direct aggregateRating on entity
        if (candidate.aggregateRating) {
          return candidate.aggregateRating;
        }
        // @graph array
        if (Array.isArray((candidate as Record<string, unknown>)["@graph"])) {
          for (const node of (candidate as Record<string, unknown[]>)["@graph"]) {
            const graphNode = node as JsonLdGraph;
            if (graphNode.aggregateRating) {
              return graphNode.aggregateRating;
            }
          }
        }
      }
    } catch {
      // malformed JSON-LD — skip
    }
  }

  return null;
}

function extractReviewBodies(html: string): string[] {
  const snippets: string[] = [];
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]) as Record<string, unknown>;
      const reviews = (parsed.review ?? []) as Array<Record<string, unknown>>;
      for (const r of reviews) {
        const body = (r.reviewBody ?? r.description ?? "") as string;
        if (body.trim().length > 20) {
          snippets.push(body.trim().slice(0, 500));
        }
      }
    } catch {
      // skip
    }
  }

  return snippets.slice(0, 10);
}

// ─── Testimonial Extraction ───────────────────────────────────────────────────

const TESTIMONIAL_SELECTORS = [
  // Common testimonial class/attribute patterns in HTML
  /class=["'][^"']*testimonial[^"']*["'][^>]*>([\s\S]{30,400}?)<\//gi,
  /class=["'][^"']*review[^"']*["'][^>]*>[\s\S]{0,200}?<p[^>]*>([\s\S]{30,400}?)<\/p>/gi,
  /class=["'][^"']*quote[^"']*["'][^>]*>([\s\S]{30,400}?)<\//gi,
  /<blockquote[^>]*>([\s\S]{30,500}?)<\/blockquote>/gi,
];

function extractTestimonials(html: string): string[] {
  const found = new Set<string>();

  for (const pattern of TESTIMONIAL_SELECTORS) {
    let m: RegExpExecArray | null;
    // Reset lastIndex each time
    pattern.lastIndex = 0;
    while ((m = pattern.exec(html)) !== null && found.size < 8) {
      // Strip tags and collapse whitespace
      const text = m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length >= 30 && text.length <= 500 && !text.includes("<!--")) {
        found.add(text);
      }
    }
  }

  return Array.from(found).slice(0, 5);
}

// ─── Main Scraper ─────────────────────────────────────────────────────────────

export class ReviewScraper {
  private static readonly TIMEOUT_MS = 10_000;
  private static readonly MAX_HTML_BYTES = 400_000;

  /**
   * Scrape review signals from a business website.
   * Looks for:
   *   1. JSON-LD AggregateRating (most reliable — many sites include this)
   *   2. Review body text from JSON-LD
   *   3. Testimonial HTML blocks
   */
  static async scrapeFromWebsite(websiteUrl: string): Promise<ScrapedReviewData> {
    const fetchedAt = new Date().toISOString();

    let url = websiteUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; CodingShaftBot/1.0; +https://codingshaft.com/bot)",
            Accept: "text/html,*/*;q=0.8",
          },
          redirect: "follow",
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok && response.status !== 200) {
        return this.emptyResult("website", fetchedAt, `HTTP ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const html = new TextDecoder().decode(
        buffer.byteLength > this.MAX_HTML_BYTES
          ? buffer.slice(0, this.MAX_HTML_BYTES)
          : buffer
      );

      const aggregateRating = extractJsonLd(html);
      const reviewSnippets = extractReviewBodies(html);
      const testimonials = extractTestimonials(html);

      const rating = aggregateRating?.ratingValue
        ? parseFloat(String(aggregateRating.ratingValue))
        : null;
      const reviewCount = aggregateRating?.reviewCount ?? aggregateRating?.ratingCount
        ? parseInt(String(aggregateRating.reviewCount ?? aggregateRating.ratingCount), 10)
        : null;
      const ratingMax = aggregateRating?.bestRating
        ? parseFloat(String(aggregateRating.bestRating))
        : rating !== null ? 5.0 : null;

      log.info(
        `Review scrape from website: rating=${rating ?? "none"}, count=${reviewCount ?? "none"}, snippets=${reviewSnippets.length}, testimonials=${testimonials.length}`,
        { url }
      );

      return {
        source: "website_structured_data",
        rating,
        reviewCount,
        ratingMax,
        reviewSnippets,
        testimonials,
        fetchedAt,
        errorMessage: null,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.warn(`Review scrape failed for ${url}: ${errorMessage}`);
      return this.emptyResult("website", fetchedAt, errorMessage);
    }
  }

  private static emptyResult(
    source: string,
    fetchedAt: string,
    errorMessage: string | null
  ): ScrapedReviewData {
    return {
      source,
      rating: null,
      reviewCount: null,
      ratingMax: null,
      reviewSnippets: [],
      testimonials: [],
      fetchedAt,
      errorMessage,
    };
  }
}
