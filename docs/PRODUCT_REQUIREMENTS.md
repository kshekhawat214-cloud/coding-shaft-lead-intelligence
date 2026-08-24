# Product Requirements

## Product

**Name:** Coding Shaft Lead Intelligence Engine

**Positioning:** AI-assisted B2B prospect discovery and sales intelligence for Coding Shaft.

## Problem

Finding potential clients manually requires searching maps, opening websites, checking social profiles, reading reviews, identifying weaknesses, and deciding what service to pitch. This is repetitive and inconsistent.

## Solution

Create a system that turns a target market definition into a ranked list of actionable business prospects with evidence-backed recommendations.

## User input

Required:
- Location
- At least one business category

Optional:
- Radius
- Maximum businesses
- Minimum rating
- Minimum review count
- Target Coding Shaft services
- Search mode

## Search modes

- BROAD
- NO_WEBSITE
- WEAK_WEBSITE
- HIGH_REPUTATION
- HIGH_AUTOMATION_POTENTIAL
- PREMIUM_BUSINESS
- CUSTOM

## Business output

Each lead should expose:

### Identity
- Business name
- Category
- Address
- City
- State
- Country
- Postal code
- Latitude
- Longitude
- External place ID
- Maps URL

### Contact
- Public business phone
- Public business website
- Other publicly discoverable business contact channels

### Reputation
- Rating
- Review count
- Reputation strength
- Positive themes
- Negative themes
- Customer sentiment
- Customer pain points
- Famous-for themes
- Business strengths

### Digital presence
- Website status
- Website score
- Mobile experience
- SEO signals
- CTA/conversion signals
- Booking/order capability where relevant
- Social platforms
- Digital maturity

### Coding Shaft opportunity
- Technology gaps
- Recommended services
- Service priority
- Recommended package
- Quick win
- Lead score
- Score breakdown
- Classification
- Best sales angle
- Outreach idea
- Confidence
- Data quality
- Research timestamp

## Lead classifications

- 80–100: HOT
- 65–79: HIGH
- 50–64: MEDIUM
- 30–49: LOW
- 0–29: NOT_QUALIFIED

## Lead lifecycle

NEW → QUALIFIED → RESEARCHED → CONTACTED → REPLIED → MEETING → PROPOSAL → NEGOTIATION → WON

Alternative terminal states:
- LOST
- NOT_INTERESTED
- DO_NOT_CONTACT

## Coding Shaft service catalog

- Website Development
- Website Redesign
- E-commerce Development
- Mobile App Development
- Custom Software Development
- CRM Development
- ERP Development
- AI Solutions
- AI Chatbots
- AI Automation
- Business Process Automation
- WhatsApp Automation
- API Integration
- UI/UX Design
- SEO
- Digital Marketing
- Cloud Solutions
- DevOps
- Cybersecurity
- IT Consulting
- Data Analytics
- Maintenance & Support

The catalog must be configuration-driven.

## Dashboard

Required views:
- Overview
- Search
- Leads
- Hot Leads
- Business Detail
- Opportunities
- Research
- Outreach
- Analytics
- Settings

## V1 acceptance criteria

A user can:
1. Create a search job.
2. Discover businesses.
3. Deduplicate them.
4. Research selected businesses.
5. Analyze website/reputation/customer themes.
6. Generate evidence-backed service opportunities.
7. Calculate a transparent score.
8. View the result in the dashboard.
9. Export/sync to Google Sheets.
10. Review the data source and research timestamp.
