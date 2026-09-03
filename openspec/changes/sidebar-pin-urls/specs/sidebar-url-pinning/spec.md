## ADDED Requirements

### Requirement: Sidebar displays Pinned section
The sidebar SHALL display a "Pinned" section at the top of the panel, above the Groups section, showing all user-pinned URLs.

#### Scenario: Pinned section with items
- **WHEN** user has pinned URLs stored
- **THEN** the Pinned section SHALL display each pinned URL with its favicon and title
- **AND** the section SHALL be collapsible like other sections

#### Scenario: Empty pinned section
- **WHEN** user has no pinned URLs
- **THEN** the Pinned section SHALL be hidden or display "No pinned items"

#### Scenario: Click pinned item to open
- **WHEN** user clicks a pinned item in the Pinned section
- **THEN** if the URL is already open in a tab, that tab SHALL be focused
- **AND** if the URL is not open, it SHALL open in a new tab

### Requirement: Tab chips display pin button
The sidebar SHALL display a pin button on each tab chip that allows users to pin/unpin the URL.

#### Scenario: Pin button visibility on hover
- **WHEN** user hovers over a tab chip
- **THEN** a pin icon button SHALL appear (before the close button)

#### Scenario: Pin button state for unpinned URL
- **WHEN** viewing a tab chip for an unpinned URL
- **THEN** the pin button SHALL display as an outline/empty icon

#### Scenario: Pin button state for pinned URL
- **WHEN** viewing a tab chip for a pinned URL
- **THEN** the pin button SHALL display as a filled/solid icon

### Requirement: User can pin URL from sidebar
The sidebar SHALL allow users to pin a URL by clicking the pin button on a tab chip.

#### Scenario: Clicking pin button on unpinned tab
- **WHEN** user clicks the pin button on an unpinned tab chip
- **THEN** the URL and title SHALL be saved to persistent storage
- **AND** the pin button SHALL update to show filled/solid state
- **AND** the Pinned section SHALL update to include the new item

#### Scenario: Tab close is not triggered
- **WHEN** user clicks the pin button
- **THEN** the tab SHALL NOT be closed (click is isolated to pin action)

### Requirement: User can unpin URL from sidebar
The sidebar SHALL allow users to unpin a URL from either the tab chip or the Pinned section.

#### Scenario: Unpin from tab chip
- **WHEN** user clicks the pin button on a pinned tab chip
- **THEN** the pin SHALL be removed from storage
- **AND** the pin button SHALL update to show outline/empty state
- **AND** the item SHALL be removed from the Pinned section

#### Scenario: Unpin from Pinned section
- **WHEN** user clicks the unpin button on a pinned item in the Pinned section
- **THEN** the pin SHALL be removed from storage
- **AND** the item SHALL be removed from the Pinned section

### Requirement: Pin state syncs across interfaces
The sidebar pin state SHALL stay synchronized with the search overlay pin state.

#### Scenario: Pin in overlay reflects in sidebar
- **WHEN** user pins a URL in the search overlay
- **AND** the sidebar is open
- **THEN** the Pinned section SHALL update to show the newly pinned item

#### Scenario: Pin in sidebar reflects in overlay
- **WHEN** user pins a URL in the sidebar
- **AND** searches for that URL in the overlay
- **THEN** the search results SHALL show the URL as pinned
