## ADDED Requirements

### Requirement: Fuzzy search with Fuse.js
The search system SHALL use Fuse.js library for fuzzy matching, enabling typo-tolerant and intelligent search across tabs, bookmarks, and history.

#### Scenario: Typo-tolerant search
- **WHEN** user types "githbu" (typo for "github")
- **THEN** system returns results containing "github" with appropriate relevance scores

#### Scenario: Partial word matching
- **WHEN** user types "dash" 
- **THEN** system returns results containing "dashboard", "Gardener Dashboard", etc.

#### Scenario: Multi-word fuzzy search
- **WHEN** user types "gard poc"
- **THEN** system returns results where both "garden/gardener" AND "poc" appear in title or URL

### Requirement: Fuse.js configuration
The Fuse.js search SHALL be configured with:
- Title weight: 0.7, URL weight: 0.3
- Threshold: 0.4 (allows moderate fuzzy matching)
- Minimum match character length: 2
- Extended search enabled for exact match syntax

#### Scenario: Title prioritized over URL
- **WHEN** user searches "jira"
- **THEN** results with "jira" in title rank higher than results with "jira" only in URL

#### Scenario: Exact match with quotes
- **WHEN** user searches `"exact phrase"`
- **THEN** only results containing the exact phrase are returned

### Requirement: Type-based score weighting preserved
The search system SHALL preserve type-based weighting: tabs (2.0x) > bookmarks (1.3x) > history (0.8x), applied on top of Fuse.js scores.

#### Scenario: Open tab ranks higher than history
- **WHEN** user searches "confluence" and both an open tab and history item match
- **THEN** the open tab appears above the history item in results

### Requirement: Pin priority preserved
Pinned items SHALL maintain their high priority (9000+ base score) and always appear in a dedicated group at the top of search results.

#### Scenario: Pin appears first
- **WHEN** user has pinned "Gardener Dashboard" and searches "dash"
- **THEN** the pinned item appears in the "Pinned" group at the top, above other matching results

### Requirement: Recency and frequency weighting preserved
History items SHALL retain recency weighting (today 1.5x, this week 1.3x, this month 1.1x) and visit frequency weighting (logarithmic scale up to 1.6x).

#### Scenario: Recent history ranks higher
- **WHEN** user searches "wiki" and has visited Page A today and Page B last month
- **THEN** Page A appears above Page B (assuming similar match quality)
