## ADDED Requirements

### Requirement: User can search open tabs via /tabs command
The system SHALL provide a `/tabs` command in the search overlay's command mode that searches only open tabs.

#### Scenario: Using /tabs command
- **WHEN** user types "/" in the search input and selects "tabs" command
- **THEN** the search mode switches to tabs-only mode
- **AND** the user can type a query to search only among open tabs

#### Scenario: Live search in /tabs command mode
- **WHEN** user is in `/tabs` command mode and types "github"
- **THEN** only open tabs with "github" in title or URL are shown in real-time
- **AND** bookmarks and history items are NOT included in results

### Requirement: User can search open tabs via keyboard shortcut
The system SHALL provide a dedicated Chrome command "Search Open Tabs" (Cmd+Shift+T) that opens the overlay in tabs-only search mode.

#### Scenario: Invoking search-open-tabs shortcut
- **WHEN** user presses Cmd+Shift+T (or Ctrl+Shift+T on Windows)
- **THEN** the overlay opens with focus in the search input
- **AND** tabs-only mode indicator is shown
- **AND** search results SHALL only include open tabs

### Requirement: Tabs-only mode uses fuzzy search
The tabs-only search mode SHALL use the same Fuse.js fuzzy matching as the unified search.

#### Scenario: Typo tolerance in tabs-only mode
- **WHEN** user types "githbu" (typo) in tabs-only mode
- **THEN** tabs containing "github" SHALL still appear in results

#### Scenario: Partial matching in tabs-only mode
- **WHEN** user types "conf" in tabs-only mode
- **THEN** tabs with "confluence", "config", "configuration" in title or URL appear

### Requirement: Tabs-only mode indicates active filter state
The overlay SHALL clearly indicate when tabs-only search mode is active.

#### Scenario: Visual indicator for /tabs command
- **WHEN** user activates `/tabs` command
- **THEN** a command indicator badge shows "📑 tabs" before the search input

#### Scenario: Visual indicator for keyboard shortcut
- **WHEN** overlay opens via Cmd+Shift+T shortcut
- **THEN** a "Tabs Only" badge is displayed with a clear button to switch to unified search

### Requirement: User can switch from tabs-only to unified search
The system SHALL allow users to exit tabs-only mode and return to unified search.

#### Scenario: Exiting /tabs command mode
- **WHEN** user presses Escape in /tabs command mode
- **THEN** the command mode exits and search input is cleared

#### Scenario: Clearing tabs-only indicator
- **WHEN** user clicks the "×" button on the "Tabs Only" badge
- **THEN** the search expands to include bookmarks and history
