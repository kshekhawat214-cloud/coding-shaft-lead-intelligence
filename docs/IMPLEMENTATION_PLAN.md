# Implementation Plan

## Phase 0 — Documentation and workspace

Create:
- README.md
- PRODUCT_REQUIREMENTS.md
- ARCHITECTURE.md
- DATA_MODEL.md
- AGENT_SYSTEM.md
- LEAD_SCORING.md
- RESEARCH_POLICY.md
- .env.example

Acceptance:
- architecture reviewed
- stack confirmed
- external providers identified
- no secrets committed

## Phase 1 — Application foundation

Build:
- Next.js app
- TypeScript
- Tailwind
- shadcn/ui
- environment configuration
- database connection
- migrations
- logging
- validation
- error handling

Acceptance:
- app runs locally
- database connects
- health check works
- lint/test/build pass

## Phase 2 — Search jobs

Build:
- search job model
- create/search API
- input form
- job status
- job progress
- cancellation

Acceptance:
- valid search job can be created
- invalid input rejected
- status persists

## Phase 3 — Business discovery

Build:
- Google Places provider
- category/location search
- pagination
- retries
- rate limiting
- normalization
- deduplication

Acceptance:
- real provider can return businesses
- duplicates are removed
- provider errors are handled
- external IDs are stored

## Phase 4 — Business database

Build:
- business detail model
- locations
- contacts
- search result association
- timestamps
- source metadata

Acceptance:
- discovered businesses persist correctly
- repeated searches do not duplicate businesses

## Phase 5 — Website intelligence

Build:
- website fetch/research adapter
- public-page extraction
- website scoring
- evidence
- research timestamps

Acceptance:
- valid websites analyzed
- invalid/offline sites handled
- no private access attempted

## Phase 6 — Review intelligence

Build:
- rating/review snapshot model
- review analysis
- themes
- famous-for
- customer pain points
- reputation summary

Acceptance:
- insufficient data is handled safely
- unsupported claims are rejected/flagged

## Phase 7 — Social intelligence

Build:
- public social profile discovery adapter
- platform records
- confidence
- source tracking

Acceptance:
- only reliable profiles stored
- unknown profiles remain unknown

## Phase 8 — AI opportunity engine

Build:
- AI provider abstraction
- structured prompts
- JSON schemas
- service matching
- evidence requirements
- quality-control pass

Acceptance:
- malformed AI output rejected
- opportunities include evidence and confidence

## Phase 9 — Lead scoring

Build:
- deterministic scoring service
- score breakdown
- classification
- score version

Acceptance:
- same input produces same score
- tests cover boundaries 0, 29, 30, 49, 50, 64, 65, 79, 80, 100

## Phase 10 — Dashboard

Build:
- overview
- lead table
- filters
- sorting
- lead detail
- opportunity cards
- research source display
- score visualization

Acceptance:
- user can search and inspect qualified leads
- responsive UI
- loading/error/empty states

## Phase 11 — Google Sheets

Build:
- OAuth/configuration
- export/sync
- column mapping
- error handling

Acceptance:
- selected leads export correctly
- sync failures are visible
- database remains source of truth

## Phase 12 — Notifications

Build:
- notification abstraction
- email summary
- top HOT leads

Acceptance:
- notification only sends after completed jobs
- failures do not silently disappear

## Phase 13 — Scheduling

Build:
- recurring search configuration
- scheduled jobs
- deduplication across historical data

Acceptance:
- scheduled discovery works
- repeated businesses are not duplicated

## Phase 14 — Quality and deployment

Run:
- unit tests
- integration tests
- API mocks
- database tests
- build
- lint
- security review
- manual UX review

Deploy:
- Vercel
- Supabase

Acceptance:
- production environment has no hardcoded secrets
- logs are useful
- failures are recoverable
- documentation is complete

## Build discipline

After every phase:
1. Run tests.
2. Run lint.
3. Run build.
4. Inspect the changed files.
5. Fix errors.
6. Update documentation.
7. Do not proceed if the phase is broken.

## Future phases

- CRM integrations
- Telegram/Slack
- human-approved outreach generation
- team assignment
- deal pipeline
- revenue analytics
- multi-tenant architecture
- additional business providers
- market expansion recommendations
