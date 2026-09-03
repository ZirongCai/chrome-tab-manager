## ADDED Requirements

### Requirement: User can see duplicate tab count in Browse Mode

The system SHALL display the count of duplicate tabs in the Browse Mode statistics area when duplicates exist.

#### Scenario: Duplicates exist
- **WHEN** user switches to Browse Mode and there are tabs with identical URLs
- **THEN** the statistics area SHALL show a "X duplicates" indicator with the count of tabs that would be closed

#### Scenario: No duplicates
- **WHEN** user switches to Browse Mode and all tabs have unique URLs
- **THEN** no duplicate indicator SHALL be displayed (or it shows "0 duplicates")

### Requirement: User can deduplicate tabs with one click

The system SHALL provide a "Deduplicate" button in Browse Mode that closes all duplicate tabs when clicked.

#### Scenario: Clicking deduplicate button with duplicates
- **WHEN** user clicks the "Deduplicate" button and duplicate tabs exist
- **THEN** the system SHALL close all duplicate tabs, keeping one tab per unique URL (preferring the active tab)
- **AND** the Browse Mode view SHALL refresh to show the updated tab list
- **AND** a toast notification SHALL display "Closed X duplicate tabs"

#### Scenario: Clicking deduplicate button without duplicates
- **WHEN** user clicks the "Deduplicate" button and no duplicate tabs exist
- **THEN** no tabs SHALL be closed
- **AND** a toast notification SHALL display "No duplicate tabs found"

### Requirement: Deduplicate preserves the most relevant tab

When closing duplicate tabs, the system SHALL preserve the most relevant tab for each unique URL.

#### Scenario: Active tab is a duplicate
- **WHEN** multiple tabs have the same URL and one of them is the active tab
- **THEN** the system SHALL keep the active tab and close the others

#### Scenario: No active tab among duplicates
- **WHEN** multiple tabs have the same URL and none is the active tab
- **THEN** the system SHALL keep the first tab (by tab order) and close the others
