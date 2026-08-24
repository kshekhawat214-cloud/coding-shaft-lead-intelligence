import { logger } from "@/lib/logger";

const log = logger.child("SocialDiscovery");

export interface SocialProfile {
  platform: string;
  profileUrl: string;
  confidence: number;
  source: string;
}

export interface SocialDiscoveryResult {
  profiles: SocialProfile[];
  discoveredAt: string;
  errorMessage: string | null;
}

// ─── Platform URL Patterns ────────────────────────────────────────────────────

const PLATFORM_LINK_PATTERNS: Record<string, RegExp[]> = {
  Facebook: [
    /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|dialog|plugins|tr\?)([a-zA-Z0-9._\-/]+)/gi,
  ],
  Instagram: [
    /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?/gi,
  ],
  Twitter: [
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/?(?!\/(status|intent|share))/gi,
  ],
  LinkedIn: [
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/([a-zA-Z0-9._\-/]+)/gi,
  ],
  YouTube: [
    /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user|@)\/([a-zA-Z0-9._\-/]+)/gi,
  ],
  TikTok: [
    /https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)/gi,
  ],
  Pinterest: [
    /https?:\/\/(?:www\.)?pinterest\.(?:com|co\.uk)\/([a-zA-Z0-9._/]+)/gi,
  ],
};

// Paths / slugs to exclude from profile URL extraction (share buttons, etc.)
const EXCLUDED_PATHS = new Set([
  "share", "sharer", "dialog", "plugins", "tr", "help",
  "legal", "about", "business", "ads", "login", "signup",
  "p", "photo", "video", "events", "groups", "pages",
]);

function cleanProfileUrl(platform: string, rawUrl: string, slug: string): string | null {
  const firstSegment = slug.split("/")[0].split("?")[0];
  if (EXCLUDED_PATHS.has(firstSegment.toLowerCase())) return null;
  if (firstSegment.length < 2) return null;
  return rawUrl.split("?")[0].replace(/\/$/, "");
}

// ─── Main Discoverer ──────────────────────────────────────────────────────────

export class SocialDiscovery {
  private static readonly TIMEOUT_MS = 10_000;
  private static readonly MAX_HTML_BYTES = 300_000;

  /**
   * Discover social media profiles from a business website HTML.
   * Extracts all platform links found in the page.
   */
  static async discoverFromWebsite(websiteUrl: string): Promise<SocialDiscoveryResult> {
    const discoveredAt = new Date().toISOString();
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

      const buffer = await response.arrayBuffer();
      const html = new TextDecoder().decode(
        buffer.byteLength > this.MAX_HTML_BYTES
          ? buffer.slice(0, this.MAX_HTML_BYTES)
          : buffer
      );

      const profiles = this.extractProfilesFromHtml(html);

      log.info(`Social discovery for ${url}: found ${profiles.length} profiles`, {
        platforms: profiles.map((p) => p.platform),
      });

      return { profiles, discoveredAt, errorMessage: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.warn(`Social discovery failed for ${url}: ${errorMessage}`);
      return { profiles: [], discoveredAt, errorMessage };
    }
  }

  static extractProfilesFromHtml(html: string): SocialProfile[] {
    const seen = new Set<string>();
    const profiles: SocialProfile[] = [];

    for (const [platform, patterns] of Object.entries(PLATFORM_LINK_PATTERNS)) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(html)) !== null) {
          const rawUrl = match[0];
          const slug = match[1];

          const cleanUrl = cleanProfileUrl(platform, rawUrl, slug);
          if (!cleanUrl) continue;

          const key = `${platform}:${cleanUrl.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);

          // Higher confidence if found in footer/header context
          const contextStart = Math.max(0, match.index - 200);
          const context = html.slice(contextStart, match.index + rawUrl.length + 100).toLowerCase();
          const inFooterOrHeader =
            context.includes("footer") ||
            context.includes("header") ||
            context.includes("social") ||
            context.includes("follow us") ||
            context.includes("connect");

          profiles.push({
            platform,
            profileUrl: cleanUrl,
            confidence: inFooterOrHeader ? 0.95 : 0.75,
            source: "website_link_extraction",
          });
        }
      }
    }

    // Return highest-confidence profile per platform
    const byPlatform = new Map<string, SocialProfile>();
    for (const p of profiles) {
      const existing = byPlatform.get(p.platform);
      if (!existing || p.confidence > existing.confidence) {
        byPlatform.set(p.platform, p);
      }
    }

    return Array.from(byPlatform.values());
  }
}
