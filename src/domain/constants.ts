export const SCORING_WEIGHTS = {
  BUSINESS_ATTRACTIVENESS: 20,
  REPUTATION: 15,
  DIGITAL_WEAKNESS: 20,
  TECHNOLOGY_OPPORTUNITY: 20,
  SERVICE_FIT: 15,
  CONTACTABILITY: 10,
} as const;

export const TOTAL_MAX_SCORE = 100;

export const LEAD_CLASSIFICATION_THRESHOLDS = {
  HOT: { min: 80, max: 100, label: "HOT", color: "emerald", badgeVariant: "success" },
  HIGH: { min: 65, max: 79, label: "HIGH", color: "blue", badgeVariant: "default" },
  MEDIUM: { min: 50, max: 64, label: "MEDIUM", color: "amber", badgeVariant: "warning" },
  LOW: { min: 30, max: 49, label: "LOW", color: "orange", badgeVariant: "secondary" },
  NOT_QUALIFIED: { min: 0, max: 29, label: "NOT_QUALIFIED", color: "zinc", badgeVariant: "outline" },
} as const;

export type LeadClassificationType = keyof typeof LEAD_CLASSIFICATION_THRESHOLDS;

export function classifyScore(score: number): LeadClassificationType {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped >= 80) return "HOT";
  if (clamped >= 65) return "HIGH";
  if (clamped >= 50) return "MEDIUM";
  if (clamped >= 30) return "LOW";
  return "NOT_QUALIFIED";
}

export const SEARCH_MODES = [
  { id: "BROAD", name: "Broad Discovery", description: "Discover all businesses in the target area across selected categories" },
  { id: "NO_WEBSITE", name: "No Website", description: "Focus on established businesses lacking an active public website" },
  { id: "WEAK_WEBSITE", name: "Weak / Outdated Website", description: "Target businesses with non-responsive, slow, or poor UX websites" },
  { id: "HIGH_REPUTATION", name: "High Reputation", description: "Identify well-loved, busy businesses with strong review volume and scale" },
  { id: "HIGH_AUTOMATION_POTENTIAL", name: "High Automation Potential", description: "Target high-inquiry businesses needing booking, CRM, or WhatsApp bots" },
  { id: "PREMIUM_BUSINESS", name: "Premium Businesses", description: "Target high-ticket, premium brands ready for enterprise software & custom AI" },
  { id: "CUSTOM", name: "Custom Filters", description: "Apply customized rating, review count, and service filters" },
] as const;

export const LEAD_LIFECYCLE_STAGES = [
  "NEW",
  "QUALIFIED",
  "RESEARCHED",
  "CONTACTED",
  "REPLIED",
  "MEETING",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
  "NOT_INTERESTED",
  "DO_NOT_CONTACT",
] as const;

export type LeadLifecycleStage = (typeof LEAD_LIFECYCLE_STAGES)[number];
