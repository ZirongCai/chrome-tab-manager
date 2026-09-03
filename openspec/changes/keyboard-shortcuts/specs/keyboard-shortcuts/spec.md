## ADDED Requirements

### Requirement: User can pin current tab with keyboard shortcut

The system SHALL allow users to pin/unpin the current active tab using `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux) in Browse Mode.

#### Scenario: Pin with keyboard shortcut
- **WHEN** user is in Browse Mode and presses `Cmd/Ctrl+P`
- **THEN** the system SHALL toggle the pin status of the current active tab
- **AND** a toast notification SHALL display "Page pinned" or "Page unpinned"
- **AND** the pin button state SHALL update to reflect the new status

#### Scenario: Shortcut ignored in Search Mode
- **WHEN** user is in Search Mode and presses `Cmd/Ctrl+P`
- **THEN** the system SHALL NOT perform any pin action (shortcut only works in Browse Mode)

### Requirement: Keyboard shortcuts are displayed in overlay footer

The system SHALL display available keyboard shortcuts in a footer bar at the bottom of the overlay.

#### Scenario: Search Mode shortcuts displayed
- **WHEN** user is in Search Mode
- **THEN** the footer SHALL display shortcuts: `↑↓` Navigate, `⏎` Select, `Tab` Browse

#### Scenario: Browse Mode shortcuts displayed
- **WHEN** user is in Browse Mode
- **THEN** the footer SHALL display shortcuts: `↑↓` Navigate, `⏎` Select, `⌘P` Pin, `⌘⌫` Close, `Tab` Search

### Requirement: Footer is always visible

The footer shortcuts bar SHALL be visible at all times in both modes without overlapping content.

#### Scenario: Footer position
- **WHEN** user views the overlay in either mode
- **THEN** the footer SHALL be positioned at the bottom of the search-container
- **AND** the footer SHALL NOT overlap with the results/content area
