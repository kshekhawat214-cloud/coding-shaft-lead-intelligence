import { logger } from "@/lib/logger";

const log = logger.child("WebsiteAuditor");

export interface WebsiteAuditResult {
  url: string;
  resolvedUrl: string;
  reachable: boolean;
  responseTimeMs: number;
  httpStatusCode: number | null;

  // SSL
  hasSSL: boolean;

  // Mobile
  hasViewportMeta: boolean;

  // SEO
  hasTitle: boolean;
  titleText: string | null;
  titleLength: number | null;
  hasMetaDescription: boolean;
  metaDescriptionText: string | null;
  metaDescriptionLength: number | null;
  hasH1: boolean;
  h1Text: string | null;
  hasCanonical: boolean;

  // Conversion signals
  hasWhatsApp: boolean;
  hasOnlineBooking: boolean;
  hasContactForm: boolean;
  hasPhoneNumber: boolean;
  hasEmailAddress: boolean;
  hasChatWidget: boolean;

  // Social presence
  hasFacebook: boolean;
  hasInstagram: boolean;
  hasTwitter: boolean;
  hasLinkedIn: boolean;
  hasYouTube: boolean;

  // Tech signals
  hasGoogleAnalytics: boolean;
  hasGoogleTagManager: boolean;
  hasPixel: boolean; // Facebook Pixel
  hasWordPress: boolean;
  hasShopify: boolean;
  hasWix: boolean;
  hasSquarespace: boolean;

  // Weakness signals (sales opportunities)
  missingSSL: boolean;
  missingViewport: boolean;
  missingTitle: boolean;
  missingMetaDescription: boolean;
  missingWhatsApp: boolean;
  missingBooking: boolean;
  missingContactForm: boolean;
  missingAnalytics: boolean;

  // Summary score (0–100)
  auditScore: number;
  weaknesses: string[];

  auditedAt: string;
  errorMessage: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function containsAny(html: string, patterns: string[]): boolean {
  const lower = html.toLowerCase();
  return patterns.some((p) => lower.includes(p.toLowerCase()));
}

function extractContent(html: string, regex: RegExp): string | null {
  const match = regex.exec(html);
  return match ? (match[1] ?? null) : null;
}

// ─── Main Auditor ─────────────────────────────────────────────────────────────

export class WebsiteAuditor {
  private static readonly TIMEOUT_MS = 12_000;
  private static readonly MAX_HTML_BYTES = 500_000; // 500 KB

  static async audit(rawUrl: string): Promise<WebsiteAuditResult> {
    const startedAt = Date.now();
    const auditedAt = new Date().toISOString();

    // Ensure URL has a scheme
    let url = rawUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const base: Omit<
      WebsiteAuditResult,
      | "reachable"
      | "responseTimeMs"
      | "httpStatusCode"
      | "resolvedUrl"
      | "auditScore"
      | "weaknesses"
      | "errorMessage"
    > = {
      url: rawUrl,
      hasSSL: url.startsWith("https://"),
      hasViewportMeta: false,
      hasTitle: false,
      titleText: null,
      titleLength: null,
      hasMetaDescription: false,
      metaDescriptionText: null,
      metaDescriptionLength: null,
      hasH1: false,
      h1Text: null,
      hasCanonical: false,
      hasWhatsApp: false,
      hasOnlineBooking: false,
      hasContactForm: false,
      hasPhoneNumber: false,
      hasEmailAddress: false,
      hasChatWidget: false,
      hasFacebook: false,
      hasInstagram: false,
      hasTwitter: false,
      hasLinkedIn: false,
      hasYouTube: false,
      hasGoogleAnalytics: false,
      hasGoogleTagManager: false,
      hasPixel: false,
      hasWordPress: false,
      hasShopify: false,
      hasWix: false,
      hasSquarespace: false,
      missingSSL: false,
      missingViewport: false,
      missingTitle: false,
      missingMetaDescription: false,
      missingWhatsApp: false,
      missingBooking: false,
      missingContactForm: false,
      missingAnalytics: false,
      auditedAt,
    };

    try {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; CodingShaftBot/1.0; +https://codingshaft.com/bot)",
            Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
        });
      } finally {
        clearTimeout(timeoutHandle);
      }

      const responseTimeMs = Date.now() - startedAt;
      const resolvedUrl = response.url;

      // Only read up to MAX_HTML_BYTES
      const buffer = await response.arrayBuffer();
      const html = new TextDecoder().decode(
        buffer.byteLength > this.MAX_HTML_BYTES
          ? buffer.slice(0, this.MAX_HTML_BYTES)
          : buffer
      );

      // ── SSL ─────────────────────────────────────────────────────────────────
      const hasSSL = resolvedUrl.startsWith("https://");

      // ── Viewport ─────────────────────────────────────────────────────────────
      const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);

      // ── Title ────────────────────────────────────────────────────────────────
      const titleText = extractContent(html, /<title[^>]*>([^<]{1,200})<\/title>/i);
      const hasTitle = Boolean(titleText && titleText.trim().length > 0);

      // ── Meta Description ─────────────────────────────────────────────────────
      const metaDescriptionText = extractContent(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i
      ) ?? extractContent(
        html,
        /<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description["']/i
      );
      const hasMetaDescription = Boolean(metaDescriptionText && metaDescriptionText.trim().length > 0);

      // ── H1 ───────────────────────────────────────────────────────────────────
      const h1Text = extractContent(html, /<h1[^>]*>([^<]{1,200})<\/h1>/i);
      const hasH1 = Boolean(h1Text && h1Text.trim().length > 0);

      // ── Canonical ────────────────────────────────────────────────────────────
      const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);

      // ── WhatsApp ─────────────────────────────────────────────────────────────
      const hasWhatsApp = containsAny(html, [
        "wa.me/",
        "api.whatsapp.com",
        "whatsapp.com/send",
        "whatsapp://"
      ]);

      // ── Online Booking ────────────────────────────────────────────────────────
      const hasOnlineBooking = containsAny(html, [
        "calendly.com",
        "acuityscheduling.com",
        "simplybook.me",
        "setmore.com",
        "booksy.com",
        "fresha.com",
        "square.site",
        "vagaro.com",
        "opentable.com",
        "resy.com",
        "yelp.com/reservations",
        "book now",
        "book an appointment",
        "schedule a call",
        "schedule appointment",
        "schedule online",
        "online booking",
        "make a reservation",
        "reserve now",
      ]);

      // ── Contact Form ──────────────────────────────────────────────────────────
      const hasContactForm =
        /<form[^>]*>/i.test(html) &&
        containsAny(html, [
          'type="email"',
          "type='email'",
          'type="tel"',
          "type='tel'",
          "contact",
          "enquiry",
          "inquiry",
          "get in touch",
          "send message",
        ]);

      // ── Phone Number ──────────────────────────────────────────────────────────
      const hasPhoneNumber =
        /href=["']tel:/i.test(html) ||
        /\+?\d[\d\s\-().]{8,}\d/.test(html);

      // ── Email Address ─────────────────────────────────────────────────────────
      const hasEmailAddress =
        /href=["']mailto:/i.test(html) ||
        /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i.test(html);

      // ── Chat Widget ───────────────────────────────────────────────────────────
      const hasChatWidget = containsAny(html, [
        "tawk.to",
        "crisp.chat",
        "intercom",
        "zendesk",
        "freshchat",
        "tidio",
        "drift.com",
        "livechat",
        "olark",
      ]);

      // ── Social ────────────────────────────────────────────────────────────────
      const hasFacebook = containsAny(html, ["facebook.com/", "fb.com/"]);
      const hasInstagram = containsAny(html, ["instagram.com/"]);
      const hasTwitter = containsAny(html, ["twitter.com/", "x.com/"]);
      const hasLinkedIn = containsAny(html, ["linkedin.com/"]);
      const hasYouTube = containsAny(html, ["youtube.com/", "youtu.be/"]);

      // ── Analytics ─────────────────────────────────────────────────────────────
      const hasGoogleAnalytics = containsAny(html, [
        "google-analytics.com",
        "gtag.js",
        "ga('create'",
        'ga("create"',
        "UA-",
        "G-",
      ]);
      const hasGoogleTagManager = containsAny(html, [
        "googletagmanager.com",
        "GTM-",
      ]);
      const hasPixel = containsAny(html, [
        "connect.facebook.net",
        "fbevents.js",
        "fbq('init'",
        'fbq("init"',
      ]);

      // ── Platform Detection ────────────────────────────────────────────────────
      const hasWordPress = containsAny(html, [
        "wp-content/",
        "wp-includes/",
        "/wp-json/",
      ]);
      const hasShopify = containsAny(html, ["cdn.shopify.com", "myshopify.com"]);
      const hasWix = containsAny(html, ["static.wixstatic.com", "wix.com"]);
      const hasSquarespace = containsAny(html, ["squarespace.com", "sqspcdn.com"]);

      // ── Weakness Signals ──────────────────────────────────────────────────────
      const missingSSL = !hasSSL;
      const missingViewport = !hasViewportMeta;
      const missingTitle = !hasTitle;
      const missingMetaDescription = !hasMetaDescription;
      const missingWhatsApp = !hasWhatsApp;
      const missingBooking = !hasOnlineBooking;
      const missingContactForm = !hasContactForm;
      const missingAnalytics = !hasGoogleAnalytics && !hasGoogleTagManager;

      // ── Audit Score (0–100) ───────────────────────────────────────────────────
      const scoring = [
        { weight: 15, pass: hasSSL },
        { weight: 15, pass: hasViewportMeta },
        { weight: 10, pass: hasTitle },
        { weight: 10, pass: hasMetaDescription },
        { weight: 10, pass: hasH1 },
        { weight: 10, pass: hasContactForm || hasPhoneNumber || hasEmailAddress },
        { weight: 10, pass: hasWhatsApp },
        { weight: 10, pass: hasOnlineBooking },
        { weight: 5, pass: hasGoogleAnalytics || hasGoogleTagManager },
        { weight: 5, pass: hasFacebook || hasInstagram },
      ];
      const auditScore = scoring.reduce(
        (acc, { weight, pass }) => acc + (pass ? weight : 0),
        0
      );

      // ── Human-readable Weaknesses ─────────────────────────────────────────────
      const weaknesses: string[] = [];
      if (missingSSL) weaknesses.push("No SSL certificate (HTTP only)");
      if (missingViewport) weaknesses.push("Not mobile-responsive (missing viewport meta)");
      if (missingTitle) weaknesses.push("Missing page title tag");
      if (missingMetaDescription) weaknesses.push("Missing meta description");
      if (!hasH1) weaknesses.push("No H1 heading found");
      if (missingWhatsApp) weaknesses.push("No WhatsApp contact link");
      if (missingBooking) weaknesses.push("No online booking system");
      if (missingContactForm) weaknesses.push("No contact form detected");
      if (missingAnalytics) weaknesses.push("No analytics tracking (Google Analytics / GTM)");
      if (!hasPixel) weaknesses.push("No Facebook Pixel for retargeting");

      log.info(`Audit complete for ${url}: score=${auditScore}, weaknesses=${weaknesses.length}`, {
        url,
        auditScore,
        hasSSL,
        hasViewportMeta,
      });

      return {
        ...base,
        url: rawUrl,
        resolvedUrl,
        reachable: response.ok || (response.status >= 200 && response.status < 400),
        responseTimeMs,
        httpStatusCode: response.status,
        hasSSL,
        hasViewportMeta,
        hasTitle,
        titleText: titleText?.trim() ?? null,
        titleLength: titleText ? titleText.trim().length : null,
        hasMetaDescription,
        metaDescriptionText: metaDescriptionText?.trim() ?? null,
        metaDescriptionLength: metaDescriptionText ? metaDescriptionText.trim().length : null,
        hasH1,
        h1Text: h1Text?.trim() ?? null,
        hasCanonical,
        hasWhatsApp,
        hasOnlineBooking,
        hasContactForm,
        hasPhoneNumber,
        hasEmailAddress,
        hasChatWidget,
        hasFacebook,
        hasInstagram,
        hasTwitter,
        hasLinkedIn,
        hasYouTube,
        hasGoogleAnalytics,
        hasGoogleTagManager,
        hasPixel,
        hasWordPress,
        hasShopify,
        hasWix,
        hasSquarespace,
        missingSSL,
        missingViewport,
        missingTitle,
        missingMetaDescription,
        missingWhatsApp,
        missingBooking,
        missingContactForm,
        missingAnalytics,
        auditScore,
        weaknesses,
        auditedAt,
        errorMessage: null,
      };
    } catch (err) {
      const responseTimeMs = Date.now() - startedAt;
      const errorMessage = err instanceof Error ? err.message : String(err);

      log.warn(`Audit failed for ${url}: ${errorMessage}`);

      const weaknesses = ["Website could not be reached or timed out"];

      return {
        ...base,
        url: rawUrl,
        resolvedUrl: url,
        reachable: false,
        responseTimeMs,
        httpStatusCode: null,
        hasSSL: url.startsWith("https://"),
        missingSSL: !url.startsWith("https://"),
        missingViewport: true,
        missingTitle: true,
        missingMetaDescription: true,
        missingWhatsApp: true,
        missingBooking: true,
        missingContactForm: true,
        missingAnalytics: true,
        auditScore: 0,
        weaknesses,
        errorMessage,
      };
    }
  }
}
