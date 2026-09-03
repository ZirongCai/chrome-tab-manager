## ADDED Requirements

### Requirement: User can pin a URL from search results
The system SHALL display a pin button on each search result item that allows the user to pin that URL.

#### Scenario: Pin button visibility on hover
- **WHEN** user hovers over a search result item
- **THEN** a pin icon button SHALL appear on the right side of the result item

#### Scenario: Pin button state for unpinned URL
- **WHEN** viewing a search result that is not pinned by the user
- **THEN** the pin button SHALL display as an outline/empty icon

#### Scenario: Pin button state for user-pinned URL
- **WHEN** viewing a search result that is pinned by the user
- **THEN** the pin button SHALL display as a filled/solid icon

### Requirement: User can add a pin by clicking the pin button
The system SHALL save the URL as a user pin when the pin button is clicked on an unpinned result.

#### Scenario: Clicking pin button on unpinned result
- **WHEN** user clicks the pin button on an unpinned search result
- **THEN** the URL, title, and auto-generated keywords SHALL be saved to persistent storage
- **AND** the pin button SHALL immediately update to show filled/solid state
- **AND** no navigation SHALL occur (result item click is not triggered)

#### Scenario: Auto-generated keywords
- **WHEN** a URL is pinned
- **THEN** keywords SHALL be extracted from the URL hostname and pathname segments
- **AND** keywords SHALL be lowercase and deduplicated

### Requirement: User can remove a pin by clicking the pin button
The system SHALL remove the user pin when the pin button is clicked on a user-pinned result.

#### Scenario: Clicking pin button on user-pinned result
- **WHEN** user clicks the pin button on a user-pinned search result
- **THEN** the pin SHALL be removed from persistent storage
- **AND** the pin button SHALL immediately update to show outline/empty state

#### Scenario: Cannot unpin built-in pins
- **WHEN** user clicks the pin button on a built-in pinned result
- **THEN** the system SHALL NOT remove the built-in pin
- **AND** the pin button SHALL remain in its current state (or be hidden for built-in pins)

### Requirement: User pins appear in search results
The system SHALL include user-pinned URLs in search results when the query matches.

#### Scenario: User pin matches search query
- **WHEN** user searches with a query that matches a user-pinned URL's keywords
- **THEN** the pinned URL SHALL appear in the search results
- **AND** the result SHALL be scored to appear near the top (below exact built-in matches)

#### Scenario: User pin displayed with pinned badge
- **WHEN** a user-pinned URL appears in search results
- **THEN** it SHALL display the "📌 Pinned" badge

### Requirement: User pins persist across sessions
The system SHALL persist user-pinned URLs in Chrome's local storage.

#### Scenario: Pins survive browser restart
- **WHEN** user pins a URL, closes the browser, and reopens it
- **THEN** the pinned URL SHALL still appear in search results for matching queries

#### Scenario: Pins loaded on extension startup
- **WHEN** the extension initializes
- **THEN** user pins SHALL be loaded from storage before the first search can occur
