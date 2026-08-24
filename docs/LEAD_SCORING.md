# Lead Scoring

## Objective

Rank prospects by how attractive they are to Coding Shaft based on evidence, not merely missing digital features.

## Score

Total = 100

### 1. Business attractiveness — 20
Consider:
- business scale signals
- review volume
- category economics
- growth signals where available
- customer demand signals

### 2. Reputation — 15
Consider:
- rating
- review volume
- recurring positive themes
- reputation strength

### 3. Digital weakness — 20
Consider:
- no website
- weak website
- poor mobile experience
- weak conversion path
- missing relevant digital functionality

### 4. Technology opportunity — 20
Consider:
- automation opportunities
- CRM opportunity
- AI opportunity
- booking/order opportunity
- custom software opportunity
- integration opportunity

### 5. Coding Shaft service fit — 15
Consider:
- strength of evidence
- relevance to Coding Shaft services
- realistic implementation opportunity

### 6. Contactability/data quality — 10
Consider:
- valid public business phone
- website
- usable public contact channel
- confidence of research

## Important scoring rules

- Missing information is not automatically a high opportunity.
- A business should not receive a high score merely because its website cannot be analyzed.
- Strong businesses with strong digital experiences can still be good prospects if a specific technology opportunity exists.
- Score explanations must be stored.
- Scoring must be deterministic after AI evidence is produced.

## Classification

80–100: HOT
65–79: HIGH
50–64: MEDIUM
30–49: LOW
0–29: NOT_QUALIFIED

## Opportunity modifiers

The scoring engine may apply evidence-based modifiers for:
- no website
- outdated website
- poor mobile experience
- missing booking/order workflow
- recurring customer communication complaints
- strong review volume with weak digital conversion
- strong automation opportunity

Modifiers must be capped and documented.

## Score versioning

Every stored score must include:
- score_version
- calculation timestamp
- component scores
- reason summary

This allows future scoring-model changes without losing historical context.
