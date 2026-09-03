## ADDED Requirements

### Requirement: Active tab displays pin button in Browse Mode

The system SHALL display a pin button for the currently active tab in Browse Mode.

#### Scenario: Active tab is not pinned
- **WHEN** user views Browse Mode and the active tab URL is not pinned
- **THEN** the active tab row SHALL display an unfilled pin icon button
- **AND** the button SHALL have a tooltip "Pin this page"

#### Scenario: Active tab is already pinned
- **WHEN** user views Browse Mode and the active tab URL is already pinned
- **THEN** the active tab row SHALL display a filled/highlighted pin icon button
- **AND** the button SHALL have a tooltip "Unpin this page"

### Requirement: User can pin current tab with one click

The system SHALL allow users to pin the current active tab by clicking the pin button in Browse Mode.

#### Scenario: Pinning an unpinned tab
- **WHEN** user clicks the pin button on an unpinned active tab
- **THEN** the system SHALL add the tab's URL to user pins
- **AND** the pin button SHALL update to show the pinned state
- **AND** a toast notification SHALL display "Page pinned"

#### Scenario: Unpinning a pinned tab
- **WHEN** user clicks the pin button on a pinned active tab
- **THEN** the system SHALL remove the tab's URL from user pins
- **AND** the pin button SHALL update to show the unpinned state
- **AND** a toast notification SHALL display "Page unpinned"

### Requirement: Pin button only appears on active tab

The system SHALL only display the pin button on the active tab, not on other tabs in Browse Mode.

#### Scenario: Non-active tabs
- **WHEN** user views Browse Mode
- **THEN** tabs that are not the active tab SHALL NOT display a pin button
- **AND** they SHALL continue to display only the close button on hover
