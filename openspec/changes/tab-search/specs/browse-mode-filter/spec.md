## ADDED Requirements

### Requirement: Browse Mode has a filter input
The Browse Mode view SHALL include a filter input field at the top of the view for filtering displayed tabs.

#### Scenario: Filter input visibility
- **WHEN** user switches to Browse Mode
- **THEN** a filter input field is visible at the top of the browse area

### Requirement: Filter searches tabs by title and URL
The filter input SHALL filter the displayed tabs in real-time based on title and URL matching.

#### Scenario: Filtering by title
- **WHEN** user types "jira" in the Browse Mode filter
- **THEN** only tabs with "jira" in their title or URL are displayed
- **AND** tabs without "jira" are hidden from view

#### Scenario: Clearing filter shows all tabs
- **WHEN** user clears the filter input (empty text)
- **THEN** all tabs are displayed again in their normal grouping

### Requirement: Filter uses fuzzy matching
The Browse Mode filter SHALL use fuzzy matching consistent with the main search functionality.

#### Scenario: Typo tolerance in filter
- **WHEN** user types "conflunce" (typo) in the filter
- **THEN** tabs containing "confluence" SHALL still be displayed

#### Scenario: Partial word matching
- **WHEN** user types "dash" in the filter
- **THEN** tabs with "dashboard", "Gardener Dashboard" in title or URL are displayed

### Requirement: Filter updates results in real-time
The filter SHALL update the displayed tabs as the user types, with minimal delay.

#### Scenario: Real-time filtering
- **WHEN** user types each character in the filter input
- **THEN** the tab list updates to show matching results within 200ms

### Requirement: Filter can be dismissed with Escape key
The filter input SHALL be clearable with the Escape key.

#### Scenario: Escape clears filter
- **WHEN** user presses Escape while filter input has text and is focused
- **THEN** the filter text is cleared
- **AND** all tabs are displayed again

#### Scenario: Escape when filter is empty
- **WHEN** user presses Escape while filter input is empty
- **THEN** the overlay closes (existing behavior)

### Requirement: Filter preserves tab grouping structure
When filtering, the system SHALL maintain the visual grouping of tabs (by Chrome groups and domains) while hiding non-matching items.

#### Scenario: Filtered view maintains groups
- **WHEN** user filters and matches exist in multiple groups
- **THEN** each group with matching tabs is shown with its header
- **AND** groups with no matching tabs are hidden entirely

### Requirement: Filter shows match count
The system SHALL display the number of matching tabs when a filter is active.

#### Scenario: Match count display
- **WHEN** user types a filter query that matches 5 tabs out of 20 total
- **THEN** the UI displays "5 of 20 tabs" or similar indicator
