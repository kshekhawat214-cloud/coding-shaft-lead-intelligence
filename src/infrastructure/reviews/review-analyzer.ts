/**
 * Rule-based review intelligence analyzer.
 * No LLM or API key required — pure keyword/pattern matching.
 * Produces themes, pain points, sentiments, and "famous for" signals.
 */

export interface ReviewAnalysis {
  positiveThemes: string[];
  negativeThemes: string[];
  sentimentSummary: string;
  famousFor: string[];
  customerPainPoints: string[];
  businessStrengths: string[];
  overallSentiment: "POSITIVE" | "NEGATIVE" | "MIXED" | "NEUTRAL";
  confidenceScore: number;
  evidence: string[];
}

// ─── Theme Keyword Maps ───────────────────────────────────────────────────────

const POSITIVE_THEME_KEYWORDS: Record<string, string[]> = {
  "Great service": ["great service", "excellent service", "amazing service", "outstanding service", "top service", "best service"],
  "Friendly staff": ["friendly staff", "friendly team", "welcoming staff", "polite staff", "helpful staff", "kind staff", "amazing staff"],
  "Fast delivery": ["fast delivery", "quick delivery", "on time", "prompt delivery", "speedy delivery"],
  "Good value": ["good value", "great value", "value for money", "affordable", "reasonable price", "worth it", "cheap and good"],
  "High quality": ["high quality", "great quality", "excellent quality", "top quality", "premium quality", "quality work"],
  "Clean & hygienic": ["clean", "hygienic", "spotless", "tidy", "neat"],
  "Professional": ["professional", "professionalism", "expert", "knowledgeable", "skilled"],
  "Highly recommended": ["highly recommend", "would recommend", "recommend to", "5 stars", "five stars", "10/10"],
  "Great atmosphere": ["great atmosphere", "lovely atmosphere", "nice ambience", "good ambiance", "cozy", "comfortable"],
  "Delicious food": ["delicious", "tasty", "amazing food", "great food", "yummy", "mouth-watering"],
};

const NEGATIVE_THEME_KEYWORDS: Record<string, string[]> = {
  "Slow service": ["slow service", "took forever", "waited too long", "long wait", "slow response"],
  "Poor communication": ["no response", "didn't reply", "poor communication", "hard to reach", "ignores"],
  "Overpriced": ["overpriced", "too expensive", "not worth the price", "expensive for what", "rip off"],
  "Unprofessional": ["unprofessional", "rude staff", "rude behavior", "disrespectful"],
  "Quality issues": ["bad quality", "poor quality", "defective", "broke down", "stopped working"],
  "Wrong order": ["wrong order", "incorrect", "not what I ordered", "mistake"],
  "Dirty premises": ["dirty", "unhygienic", "filthy", "unclean"],
  "Long wait times": ["wait time", "waiting time", "queue", "long queue"],
  "No follow-up": ["no follow-up", "never called back", "forgot to follow up"],
  "Misleading information": ["misleading", "false advertising", "not as described", "lied"],
};

const FAMOUS_FOR_KEYWORDS: Record<string, string[]> = {
  "Fast turnaround": ["fast turnaround", "quick turnaround", "same day", "within 24 hours"],
  "Custom work": ["custom", "bespoke", "tailored", "personalized"],
  "Home delivery": ["home delivery", "delivers to", "door delivery", "free delivery"],
  "24/7 availability": ["24/7", "available always", "round the clock", "any time"],
  "Free consultation": ["free consultation", "free quote", "no cost consultation"],
  "Loyalty discounts": ["loyalty", "returning customer", "discount for", "member"],
  "WhatsApp orders": ["whatsapp", "order via whatsapp", "message on whatsapp"],
  "Birthday specials": ["birthday special", "anniversary", "special occasion"],
};

const PAIN_POINT_KEYWORDS: Record<string, string[]> = {
  "Hard to contact": ["hard to contact", "difficult to reach", "not answering", "calls not returned"],
  "No online booking": ["wish they had online booking", "no booking system", "couldn't book online"],
  "Limited hours": ["closed early", "limited hours", "not open on weekends", "wish they were open"],
  "No card payments": ["cash only", "no card", "only accepts cash"],
  "No parking": ["no parking", "parking problem", "hard to park"],
  "Inconsistent quality": ["hit or miss", "inconsistent", "sometimes good sometimes bad"],
  "Poor website": ["website is bad", "website doesn't work", "outdated website"],
  "No delivery": ["wish they delivered", "no delivery option", "pickup only"],
};

// ─── Sentiment Word Lists ─────────────────────────────────────────────────────

const POSITIVE_WORDS = [
  "excellent", "amazing", "great", "fantastic", "wonderful", "love",
  "perfect", "best", "outstanding", "brilliant", "superb", "awesome",
  "recommend", "satisfied", "happy", "impressed", "quality", "professional",
  "friendly", "helpful", "fast", "reliable", "clean", "affordable",
];

const NEGATIVE_WORDS = [
  "terrible", "awful", "horrible", "worst", "bad", "disappointing",
  "disgusting", "unprofessional", "rude", "slow", "overpriced", "dirty",
  "broken", "waste", "fraud", "scam", "never again", "avoid",
  "useless", "poor", "incompetent", "dishonest",
];

// ─── Analyzer ────────────────────────────────────────────────────────────────

export class ReviewAnalyzer {
  static analyze(
    reviewSnippets: string[],
    testimonials: string[],
    rating: number | null,
    reviewCount: number | null
  ): ReviewAnalysis {
    const allText = [...reviewSnippets, ...testimonials].join(" ").toLowerCase();
    const evidence: string[] = [...reviewSnippets.slice(0, 3), ...testimonials.slice(0, 2)];

    // ── Positive Themes ──────────────────────────────────────────────────────
    const positiveThemes: string[] = [];
    for (const [theme, keywords] of Object.entries(POSITIVE_THEME_KEYWORDS)) {
      if (keywords.some((kw) => allText.includes(kw.toLowerCase()))) {
        positiveThemes.push(theme);
      }
    }

    // ── Negative Themes ──────────────────────────────────────────────────────
    const negativeThemes: string[] = [];
    for (const [theme, keywords] of Object.entries(NEGATIVE_THEME_KEYWORDS)) {
      if (keywords.some((kw) => allText.includes(kw.toLowerCase()))) {
        negativeThemes.push(theme);
      }
    }

    // ── Famous For ───────────────────────────────────────────────────────────
    const famousFor: string[] = [];
    for (const [signal, keywords] of Object.entries(FAMOUS_FOR_KEYWORDS)) {
      if (keywords.some((kw) => allText.includes(kw.toLowerCase()))) {
        famousFor.push(signal);
      }
    }

    // ── Pain Points ──────────────────────────────────────────────────────────
    const customerPainPoints: string[] = [];
    for (const [pain, keywords] of Object.entries(PAIN_POINT_KEYWORDS)) {
      if (keywords.some((kw) => allText.includes(kw.toLowerCase()))) {
        customerPainPoints.push(pain);
      }
    }

    // ── Sentiment Scoring ────────────────────────────────────────────────────
    const posScore = POSITIVE_WORDS.filter((w) => allText.includes(w)).length;
    const negScore = NEGATIVE_WORDS.filter((w) => allText.includes(w)).length;

    // Incorporate numeric rating if available
    let ratingBoost = 0;
    if (rating !== null) {
      if (rating >= 4.0) ratingBoost = 3;
      else if (rating >= 3.0) ratingBoost = 1;
      else if (rating < 3.0) ratingBoost = -2;
    }

    const adjustedPos = posScore + ratingBoost;
    const adjustedNeg = negScore;

    let overallSentiment: ReviewAnalysis["overallSentiment"];
    if (allText.length < 30 && rating === null) {
      overallSentiment = "NEUTRAL";
    } else if (adjustedPos > adjustedNeg + 2) {
      overallSentiment = "POSITIVE";
    } else if (adjustedNeg > adjustedPos + 1) {
      overallSentiment = "NEGATIVE";
    } else if (adjustedPos > 0 && adjustedNeg > 0) {
      overallSentiment = "MIXED";
    } else if (adjustedPos > 0) {
      overallSentiment = "POSITIVE";
    } else {
      overallSentiment = "NEUTRAL";
    }

    // ── Business Strengths (from positive themes + famous for) ────────────────
    const businessStrengths = [...new Set([...positiveThemes, ...famousFor])].slice(0, 5);

    // ── Sentiment Summary ────────────────────────────────────────────────────
    const sentimentSummary = this.buildSentimentSummary(
      overallSentiment,
      rating,
      reviewCount,
      positiveThemes,
      negativeThemes
    );

    // ── Confidence Score (0–1) ───────────────────────────────────────────────
    const hasText = allText.length > 100;
    const hasRating = rating !== null;
    const hasReviews = (reviewCount ?? 0) > 0;
    const hasSnippets = reviewSnippets.length > 0 || testimonials.length > 0;

    let confidence = 0.0;
    if (hasRating) confidence += 0.4;
    if (hasReviews) confidence += 0.2;
    if (hasSnippets) confidence += 0.3;
    if (hasText) confidence += 0.1;

    return {
      positiveThemes,
      negativeThemes,
      sentimentSummary,
      famousFor,
      customerPainPoints,
      businessStrengths,
      overallSentiment,
      confidenceScore: Math.min(confidence, 1.0),
      evidence,
    };
  }

  private static buildSentimentSummary(
    sentiment: string,
    rating: number | null,
    reviewCount: number | null,
    positiveThemes: string[],
    negativeThemes: string[]
  ): string {
    const parts: string[] = [];

    if (rating !== null && reviewCount !== null) {
      parts.push(`Rated ${rating.toFixed(1)}/5 based on ${reviewCount} review${reviewCount !== 1 ? "s" : ""}.`);
    } else if (rating !== null) {
      parts.push(`Rated ${rating.toFixed(1)}/5.`);
    } else if (reviewCount !== null) {
      parts.push(`${reviewCount} review${reviewCount !== 1 ? "s" : ""} found.`);
    }

    if (sentiment === "POSITIVE" && positiveThemes.length > 0) {
      parts.push(`Customers highlight: ${positiveThemes.slice(0, 3).join(", ")}.`);
    } else if (sentiment === "NEGATIVE" && negativeThemes.length > 0) {
      parts.push(`Common complaints include: ${negativeThemes.slice(0, 3).join(", ")}.`);
    } else if (sentiment === "MIXED") {
      parts.push("Mixed feedback — strengths and areas for improvement both noted.");
    } else if (sentiment === "NEUTRAL") {
      parts.push("Insufficient review data for a strong sentiment signal.");
    }

    return parts.join(" ") || "No review data available.";
  }
}
