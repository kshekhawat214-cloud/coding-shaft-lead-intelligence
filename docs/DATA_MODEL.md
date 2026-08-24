# Data Model

## Design principles

- Stable internal IDs
- External provider IDs stored separately
- Normalized core entities
- Research snapshots for freshness
- Evidence attached to AI conclusions
- No fabricated values
- Nullable fields for unknown information

## Core entities

### users
- id
- email
- name
- role
- created_at
- updated_at

### search_jobs
- id
- user_id
- location_query
- latitude
- longitude
- radius_meters
- categories
- max_businesses
- minimum_rating
- minimum_review_count
- search_mode
- status
- progress
- created_at
- started_at
- completed_at
- error_message

### businesses
- id
- external_place_id
- name
- primary_category
- categories
- business_status
- maps_url
- created_at
- updated_at

### business_locations
- business_id
- formatted_address
- city
- state
- country
- postal_code
- latitude
- longitude

### business_contacts
- business_id
- public_phone
- website_url
- source
- retrieved_at

### websites
- id
- business_id
- url
- status
- https
- title
- meta_description
- website_score
- mobile_score
- seo_score
- conversion_score
- booking_capability
- ordering_capability
- ecommerce_capability
- whatsapp_present
- research_timestamp

### social_profiles
- id
- business_id
- platform
- profile_url
- public_follower_count
- activity_signal
- confidence
- retrieved_at

### review_snapshots
- id
- business_id
- rating
- review_count
- source
- retrieved_at

### review_insights
- id
- business_id
- positive_themes
- negative_themes
- sentiment_summary
- famous_for
- customer_pain_points
- business_strengths
- evidence
- confidence
- generated_at

### business_insights
- id
- business_id
- digital_maturity
- technology_gaps
- business_attractiveness
- summary
- evidence
- confidence
- generated_at

### service_opportunities
- id
- business_id
- service
- priority
- reason
- evidence
- confidence
- created_at

### lead_scores
- id
- business_id
- total_score
- business_attractiveness_score
- reputation_score
- digital_weakness_score
- technology_opportunity_score
- service_fit_score
- contactability_score
- classification
- score_version
- calculated_at

### outreach_records
- id
- business_id
- status
- assigned_to
- last_contacted_at
- next_follow_up_at
- notes
- created_at
- updated_at

### research_runs
- id
- business_id
- job_id
- research_type
- source
- status
- started_at
- completed_at
- error_message

### audit_logs
- id
- actor
- action
- entity_type
- entity_id
- metadata
- created_at

## Data freshness

Provider-derived information should carry a retrieval timestamp.

Research should be refreshable.

Do not assume an old website/social/review observation is still current.

## Evidence model

AI conclusions should retain compact evidence references such as:
- source URL
- observation
- retrieval timestamp

Do not store unsupported claims as facts.

## Google Sheets

Google Sheets is an export/sync surface, not the source of truth.

Recommended columns:

Lead ID
Business Name
Category
Address
City
State
Country
Maps URL
Phone
Website
Website Status
Website Score
Instagram
Facebook
LinkedIn
YouTube
Rating
Review Count
Reputation Strength
Famous For
Positive Themes
Negative Themes
Customer Pain Points
Digital Maturity
Technology Opportunities
Recommended Services
Recommended Package
Lead Score
Classification
Best Sales Angle
Quick Win
Outreach Idea
Lead Status
Assigned To
Last Contacted
Next Follow-up
Notes
Research Date
