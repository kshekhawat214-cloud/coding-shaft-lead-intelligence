# Agent System

## Principle

Use multiple specialized agents/skills instead of one giant prompt.

The deterministic application controls:
- discovery API calls
- persistence
- deduplication
- scoring formula
- permissions
- job state
- source tracking

AI agents provide structured intelligence.

## Agent 1: Discovery Agent

### Goal
Find relevant businesses for a search job.

### Inputs
- location
- coordinates when available
- radius
- categories
- maximum results

### Responsibilities
- generate category/location search variants
- request supported business data
- normalize results
- emit business candidates

### Must not
- fabricate businesses
- invent contact information
- scrape unsupported private data

## Agent 2: Business Research Agent

### Goal
Assemble public business context.

Research:
- website
- public social profiles
- business description
- public business information

Every finding should have source and timestamp.

## Agent 3: Website Audit Agent

### Goal
Assess publicly accessible website experience.

Analyze:
- HTTPS
- title/meta
- mobile experience
- navigation
- CTA
- contact
- booking
- ordering
- ecommerce
- WhatsApp
- SEO basics
- content freshness signals

Output a 0–100 website score plus evidence.

Never call this a security audit.

## Agent 4: Review Intelligence Agent

### Goal
Understand customer sentiment and reputation.

Output:
- rating
- review count
- positive themes
- negative themes
- sentiment summary
- customer pain points
- famous-for themes
- business strengths

Do not fabricate exact statistics from insufficient data.

## Agent 5: Opportunity Agent

### Goal
Map evidence to Coding Shaft services.

For each opportunity:
- service
- priority
- reason
- evidence
- confidence

Do not recommend a service without a defensible reason.

## Agent 6: Sales Intelligence Agent

### Goal
Turn validated research into useful sales intelligence.

Output:
- best sales angle
- quick win
- recommended service bundle
- personalized outreach idea

Do not make unsupported claims.

## Agent 7: Quality Control Agent

### Goal
Review AI outputs before persistence.

Checks:
- JSON schema validity
- unsupported claims
- missing evidence
- contradictory fields
- confidence consistency
- hallucinated URLs
- impossible scores

Reject or flag invalid results.

## Orchestration

Recommended:

Discovery
→ Deduplication
→ Research
→ Website/Review/Social analysis in parallel
→ Opportunity analysis
→ Deterministic score calculation
→ Sales intelligence
→ Quality control
→ Persistence
→ Sheets sync

## Agent output rules

- JSON only for machine-to-machine steps
- Schema validation required
- Null/Unknown when evidence is unavailable
- Evidence required for factual claims
- Confidence included where inference is used

## Agent skills

Recommended workspace skills:

`.agents/skills/business-discovery/SKILL.md`
`.agents/skills/website-audit/SKILL.md`
`.agents/skills/review-intelligence/SKILL.md`
`.agents/skills/opportunity-analysis/SKILL.md`
`.agents/skills/lead-scoring/SKILL.md`
`.agents/skills/sales-intelligence/SKILL.md`
`.agents/skills/data-quality/SKILL.md`
