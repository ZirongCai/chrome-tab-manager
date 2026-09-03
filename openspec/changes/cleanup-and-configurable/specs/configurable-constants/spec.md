## ADDED Requirements

### Requirement: Centralized constants file
The extension SHALL have a centralized `constants.js` file that exports all configurable values used across modules.

#### Scenario: Import search configuration
- **WHEN** search.js needs the debounce delay value
- **THEN** it imports `SEARCH_CONFIG.debounceDelay` from constants.js

#### Scenario: Import score weights
- **WHEN** search.js calculates relevance scores
- **THEN** it uses values from `SCORE_WEIGHTS` exported by constants.js

### Requirement: Search configuration constants
The constants file SHALL export `SEARCH_CONFIG` containing: maxInitialItems, debounceDelay, maxHistoryDays, maxHistoryResults, fuseThreshold, fuseDistance.

#### Scenario: Modify search display limit
- **WHEN** user wants to show 3 items instead of 2 before collapse
- **THEN** they change `SEARCH_CONFIG.maxInitialItems` in constants.js

### Requirement: Score weight constants
The constants file SHALL export `SCORE_WEIGHTS` containing all scoring multipliers for tabs, bookmarks, history, pins, and match types.

#### Scenario: Adjust tab priority
- **WHEN** user wants tabs to rank even higher than bookmarks
- **THEN** they increase `SCORE_WEIGHTS.tab` value in constants.js

### Requirement: Badge configuration constants
The constants file SHALL export `BADGE_CONFIG` containing tab count thresholds and corresponding colors.

#### Scenario: Change badge color thresholds
- **WHEN** user wants red badge to appear at 30+ tabs instead of 20+
- **THEN** they change `BADGE_CONFIG.thresholds.medium` to 30 in constants.js

### Requirement: Timing constants
The constants file SHALL export `TIMING` containing toast duration, animation delays, and other timing values.

#### Scenario: Extend toast display time
- **WHEN** user wants toast messages to stay longer
- **THEN** they increase `TIMING.toastDuration` in constants.js

### Requirement: Browser internal URL prefixes
The constants file SHALL export `BROWSER_INTERNAL_PREFIXES` array containing URL schemes that should be filtered out (chrome://, about:, etc.).

#### Scenario: Add new browser prefix
- **WHEN** a new browser needs to be supported
- **THEN** its internal URL prefix is added to `BROWSER_INTERNAL_PREFIXES`

### Requirement: TLD and stop word lists
The constants file SHALL export `TLD_LIST` and `STOP_WORDS` for URL parsing and keyword extraction.

#### Scenario: Add new TLD
- **WHEN** a new TLD (.xxx) needs to be stripped from domain display
- **THEN** it is added to `TLD_LIST` in constants.js
