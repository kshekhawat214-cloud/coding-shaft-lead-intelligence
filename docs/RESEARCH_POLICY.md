# Research, Data Quality & Safety Policy

## Purpose

The Lead Intelligence Engine should generate useful sales intelligence while maintaining high data quality and respecting provider restrictions.

## Public business information

Prefer:
- official business websites
- official business profiles
- supported business-data APIs
- public review information
- public social profiles
- reputable public sources

## No fabrication

Never invent:
- phone numbers
- emails
- URLs
- social profiles
- review counts
- review content
- business services
- employee names
- customer identities

Use `Unknown` or `null` where appropriate.

## Evidence

Every important inferred conclusion should have supporting evidence.

Examples:
- "Famous for rooftop dining" should be supported by recurring public mentions.
- "Booking problem" should be supported by public customer feedback or observable product gaps.
- "Needs CRM" should be framed as an opportunity, not a fact about the business's internal systems.

## Privacy

Collect business contact information necessary for legitimate B2B prospecting.

Avoid unnecessary personal information.

Do not infer:
- health information
- religion
- political affiliation
- sexual orientation
- ethnicity
- other sensitive personal attributes

Do not profile private individuals.

## Website research

Only inspect publicly accessible pages.

Do not:
- bypass authentication
- access private dashboards
- exploit vulnerabilities
- perform intrusive security testing

Describe website analysis as a public digital-experience audit.

## Review research

Reviews should be summarized rather than copied extensively.

Do not present a single review as representative of all customers.

Distinguish:
- observed review count/rating
- AI interpretation
- business inference

## Social research

Only store public business profiles that can be reliably attributed to the business.

Do not guess handles or construct fake profile URLs.

## Provider terms

Use official APIs where practical and comply with their terms, field restrictions, caching/storage rules, and attribution requirements.

Store source and retrieval time for third-party information.

## Outreach

The V1 system prepares outreach intelligence but does not autonomously send unsolicited messages.

Human approval is required.

Outreach should:
- be relevant
- be truthful
- be specific
- avoid deceptive claims
- avoid pretending to have performed private audits

## Data freshness

Research is time-sensitive.

Store:
- retrieved_at
- research_run_id
- source

Allow stale records to be refreshed.

## Confidence

Use confidence values only when the system can justify them.

Confidence does not convert an unsupported claim into a fact.
