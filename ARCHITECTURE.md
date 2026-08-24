# System Architecture

## Architecture goal

Build a modular application in which discovery, research, AI analysis, scoring, persistence, and presentation are independently testable.

## Recommended stack

### Application
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Data
- PostgreSQL
- Supabase-compatible deployment

### AI
- Gemini API through an internal provider interface

### Business discovery
- Google Places API or another explicitly supported business-data provider

### Spreadsheet
- Google Sheets API

### Deployment
- Vercel
- Supabase/PostgreSQL

## High-level architecture

```text
User
  |
  v
Web Dashboard
  |
  v
Application/API Layer
  |
  +--------------------+
  |                    |
  v                    v
Search Jobs         Lead Database
  |
  v
Discovery Service
  |
  v
Business Provider
  |
  v
Deduplication
  |
  v
Research Orchestrator
  |
  +---------+---------+---------+
  |         |         |         |
  v         v         v         v
Website   Social    Review    Business
Audit     Research  Intel     Context
  |         |         |         |
  +---------+---------+---------+
            |
            v
       AI Intelligence
            |
     +------+------+
     |             |
     v             v
Opportunity     Lead Scoring
Engine              |
     |              |
     +------+-------+
            |
            v
       Sales Intelligence
            |
      +-----+------+
      |            |
      v            v
  Dashboard   Google Sheets
```

## Application layers

### Presentation
Responsible for:
- UI
- forms
- tables
- filters
- charts
- lead detail pages
- loading/error states

Must not contain provider credentials or business logic that belongs on the server.

### API/Application
Responsible for:
- request validation
- authorization
- orchestration
- job lifecycle
- rate limiting
- response contracts

### Domain
Responsible for:
- business entities
- scoring
- opportunity rules
- classification
- normalization
- data-quality decisions

Domain logic must be testable without external services.

### Infrastructure
Responsible for:
- Google Places
- Gemini
- Google Sheets
- database
- web research adapters
- logging

Use interfaces so providers can be replaced.

## Agent orchestration

AI should not control the entire application.

The deterministic application owns:
- validation
- API calls
- persistence
- deduplication
- scoring formula
- permissions
- audit logs

AI owns:
- classification assistance
- theme extraction
- review interpretation
- website qualitative analysis
- opportunity reasoning
- sales-angle generation

AI outputs must be schema-validated before persistence.

## Job model

Long-running discovery/research should use jobs.

Example states:

QUEUED
RUNNING
PARTIAL
COMPLETED
FAILED
CANCELLED

Every job has:
- job ID
- creator
- input
- status
- progress
- timestamps
- error summary

## Reliability

Implement:
- retries with exponential backoff
- provider timeouts
- rate limiting
- idempotency
- structured logging
- partial-result persistence
- resumable research jobs

## Security

- Server-side secrets only
- Validate all external input
- Do not log credentials
- Sanitize provider errors
- Restrict administrative operations
- Prepare architecture for authentication/authorization

## External data policy

Use official APIs where practical. Do not build the product around scraping a consumer map interface when a supported business-data API is available.

Track:
- source
- retrieval time
- confidence
- freshness

Respect each provider's storage and usage terms.

## Future architecture

The system should later support:
- CRM integration
- Telegram/Slack notifications
- email drafting with human approval
- additional business-data providers
- additional search providers
- scheduled market scans
- multi-tenant accounts
- team assignment
- pipeline analytics
