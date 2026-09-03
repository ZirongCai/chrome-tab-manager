## ADDED Requirements

### Requirement: Active tab is visually highlighted
The sidebar SHALL display the currently active browser tab with a distinct visual highlight that differentiates it from other tabs.

#### Scenario: Active tab shows highlight on sidebar open
- **WHEN** user opens the sidebar
- **THEN** the tab chip for the currently active browser tab SHALL display with a highlight style (accent border and background tint)

#### Scenario: Only one tab highlighted at a time
- **WHEN** viewing the sidebar with multiple tabs
- **THEN** exactly one tab chip SHALL have the active highlight (the currently active tab)

### Requirement: Active tab highlight updates on tab switch
The sidebar SHALL update the active tab highlight when the user switches to a different tab.

#### Scenario: Switching tabs updates highlight
- **WHEN** user switches to a different browser tab while sidebar is open
- **THEN** the highlight SHALL move from the previously active tab to the newly active tab

#### Scenario: Highlight removed from old tab
- **WHEN** user switches to a different tab
- **THEN** the previously active tab SHALL no longer display the highlight style

### Requirement: Active tab is visible on sidebar open
The sidebar SHALL ensure the active tab is visible when opened.

#### Scenario: Auto-expand collapsed folder
- **WHEN** sidebar opens and the active tab is inside a collapsed domain folder
- **THEN** that domain folder SHALL be expanded to reveal the active tab

#### Scenario: Scroll active tab into view
- **WHEN** sidebar opens and the active tab is outside the visible viewport
- **THEN** the sidebar SHALL scroll to bring the active tab into view
