---
name: lead-scoring
description: Deterministically compute 0–100 lead scores based on weighted business attractiveness, weakness, and service opportunity.
---

# Lead Scoring Skill

## Purpose
Applies deterministic mathematical scoring (20/15/20/20/15/10) to structured evidence and classifies leads into HOT, HIGH, MEDIUM, LOW, and NOT_QUALIFIED.

## Rules
- Strictly deterministic calculation.
- Never award high opportunity points solely for missing or unreadable data.
- Store score breakdowns and reason summaries for auditing.
