## ADDED Requirements

### Requirement: Unified collapse limit of 2 items
All search result groups SHALL display a maximum of 2 items initially, with remaining items collapsed behind a "Show more" button.

#### Scenario: Regular group with 5 items
- **WHEN** a search result group contains 5 matching items
- **THEN** only the top 2 items (by score) are displayed, with "Show 3 more" button

#### Scenario: Regular group with 2 items
- **WHEN** a search result group contains exactly 2 matching items
- **THEN** both items are displayed, no "Show more" button appears

#### Scenario: Regular group with 1 item
- **WHEN** a search result group contains 1 matching item
- **THEN** the item is displayed, no "Show more" button appears

### Requirement: Pinned group collapse behavior
The Pinned group SHALL follow the same collapse rules as other groups: maximum 2 items shown initially, with remaining items collapsed.

#### Scenario: Pinned group with 4 pins matching
- **WHEN** user has 4 pinned items and all match the search query
- **THEN** only the top 2 matching pins are displayed, with "Show 2 more" button

#### Scenario: Pinned group expand
- **WHEN** user clicks "Show more" on the Pinned group
- **THEN** all matching pinned items become visible

### Requirement: Show more button interaction
The "Show more" button SHALL be keyboard navigable and expand all hidden items in the group when activated.

#### Scenario: Keyboard navigation to show more
- **WHEN** user navigates to "Show more" button using arrow keys and presses Enter
- **THEN** hidden items in the group are revealed

#### Scenario: Show more button text
- **WHEN** a group has N hidden items
- **THEN** button displays "Show N more" (e.g., "Show 3 more")

### Requirement: Collapsed items sorted by relevance
Hidden items in a collapsed group SHALL be sorted by search relevance score, so expanding reveals items in order of relevance.

#### Scenario: Expand reveals sorted items
- **WHEN** user expands a group with 5 items (2 visible, 3 hidden)
- **THEN** the 3 newly visible items appear sorted by score (highest first)
