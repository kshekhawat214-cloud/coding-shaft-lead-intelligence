---
name: business-discovery
description: Discover businesses in target locations using official business data APIs and normalize external place records.
---

# Business Discovery Skill

## Purpose
Generates query variants for target location and business category, queries Google Places or supported business APIs, and normalizes candidate records.

## Rules
- Never fabricate businesses or addresses.
- Deduplicate on `external_place_id`.
- Store retrieval timestamps and provider source.
