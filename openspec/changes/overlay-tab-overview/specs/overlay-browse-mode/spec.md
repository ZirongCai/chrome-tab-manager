## ADDED Requirements

### Requirement: Overlay supports dual-mode interface
The overlay SHALL support two modes: **Search Mode** (default) and **Browse Mode**. Users SHALL be able to switch between modes seamlessly.

#### Scenario: Default mode is Search
- **WHEN** user opens the overlay via `Cmd+Shift+K`
- **THEN** the overlay opens in Search Mode with focus on the search input

#### Scenario: Switch to Browse Mode via Tab key
- **WHEN** user presses `Tab` key while in Search Mode with empty search input
- **THEN** the overlay switches to Browse Mode showing the tab overview

#### Scenario: Switch to Browse Mode via click
- **WHEN** user clicks the "Browse" toggle button in the overlay header
- **THEN** the overlay switches to Browse Mode

#### Scenario: Return to Search Mode
- **WHEN** user is in Browse Mode and presses `Escape` or clicks "Search" toggle
- **THEN** the overlay returns to Search Mode with focus on search input

### Requirement: Browse Mode displays all open tabs grouped by domain
The Browse Mode SHALL display all open tabs organized by domain in a compact, scannable layout.

#### Scenario: Tabs grouped by domain
- **WHEN** Browse Mode is active
- **THEN** all open tabs are displayed grouped by their domain (e.g., github.com, google.com)
- **AND** each domain group shows a collapsed summary with tab count

#### Scenario: Expand domain group
- **WHEN** user clicks on a domain group header
- **THEN** the group expands to show all tabs under that domain
- **AND** each tab shows favicon, title (truncated), and close button on hover

#### Scenario: Active tab highlighting
- **WHEN** Browse Mode displays tabs
- **THEN** the currently active browser tab is visually highlighted

### Requirement: Browse Mode displays Tab Groups
The Browse Mode SHALL display Chrome Tab Groups with their colors and names, separate from ungrouped tabs.

#### Scenario: Tab Groups shown separately
- **WHEN** user has created Tab Groups in Chrome
- **THEN** Browse Mode displays Tab Groups in a dedicated section above ungrouped tabs
- **AND** each Tab Group shows its color indicator, name, and tab count

#### Scenario: Expand Tab Group
- **WHEN** user clicks on a Tab Group header
- **THEN** the group expands to show all tabs within that group

### Requirement: Quick actions in Browse Mode
The Browse Mode SHALL support quick actions on tabs without leaving the overlay.

#### Scenario: Switch to tab
- **WHEN** user clicks on a tab item in Browse Mode
- **THEN** the browser switches to that tab
- **AND** the overlay closes

#### Scenario: Close tab via button
- **WHEN** user clicks the close button (X) on a tab item
- **THEN** that tab is closed
- **AND** the tab list updates to reflect the change

#### Scenario: Close tab via keyboard
- **WHEN** user navigates to a tab with arrow keys and presses `Cmd+Backspace`
- **THEN** that tab is closed

#### Scenario: Close all tabs in domain group
- **WHEN** user clicks the close-all button on a domain group header
- **THEN** all tabs in that domain group are closed

### Requirement: Browse Mode is compact and scannable
The Browse Mode SHALL use a compact layout that allows users to quickly scan and find tabs without information overload.

#### Scenario: Compact layout by default
- **WHEN** Browse Mode is displayed
- **THEN** domain groups are collapsed by default showing only domain name and tab count
- **AND** maximum visible height is limited with scrolling for overflow

#### Scenario: Keyboard navigation
- **WHEN** user presses arrow keys in Browse Mode
- **THEN** selection moves between domain groups and individual tabs (when expanded)
- **AND** the selected item is visually highlighted

### Requirement: Browse Mode shows tab statistics
The Browse Mode SHALL show a summary of open tabs to help users understand their tab usage.

#### Scenario: Statistics header
- **WHEN** Browse Mode is active
- **THEN** a header shows total tab count and number of domains
- **AND** optionally shows number of Tab Groups if any exist
