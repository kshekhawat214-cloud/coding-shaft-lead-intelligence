# Coding Shaft Lead Intelligence Engine

## Purpose

The Coding Shaft Lead Intelligence Engine is a production-oriented B2B prospecting platform for discovering businesses in a target location, researching their public digital presence, understanding their reputation and customer feedback, identifying technology opportunities, scoring prospects, and preparing actionable sales intelligence for Coding Shaft.

**Core principle:** discover → research → understand → qualify → prioritize → convert.

## Primary users

- Coding Shaft founders
- Sales team
- Business development team
- Account managers

## Initial workflow

1. User enters target location, categories, radius, lead limit, and target services.
2. Business Discovery finds relevant businesses through supported business-data APIs.
3. Businesses are deduplicated using stable external identifiers.
4. Research collects publicly available business, website, social, and review information.
5. Intelligence agents analyze digital maturity, reputation, customer themes, famous-for signals, and pain points.
6. Opportunity Engine maps evidence to Coding Shaft services.
7. Lead Scoring calculates a transparent 0–100 score.
8. Qualified leads are saved to the primary database.
9. Google Sheets receives a sales-friendly synchronized/exported view.
10. Dashboard presents the results.
11. Human approval is required before outbound sales communication.

## Non-goals for V1

- Automated unsolicited outreach
- Private-data collection
- Private security testing
- Fabricated business information
- A single monolithic AI prompt
- Using Google Sheets as the primary database

## Documentation map

- `PRODUCT_REQUIREMENTS.md` — product scope and user stories
- `ARCHITECTURE.md` — technical architecture and boundaries
- `DATA_MODEL.md` — entities and database design
- `AGENT_SYSTEM.md` — AI agents, skills, prompts, and orchestration
- `LEAD_SCORING.md` — scoring methodology
- `RESEARCH_POLICY.md` — data quality, source, privacy, and research rules
- `IMPLEMENTATION_PLAN.md` — phased build plan and acceptance criteria
- `.env.example` — required configuration placeholders

## Build principle

Do not implement all features in one pass. Build in phases, test each phase, and verify behavior with real integrations only after mocked/unit-tested paths are stable.
