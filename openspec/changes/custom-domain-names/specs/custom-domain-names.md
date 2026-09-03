## Requirement: Users can rename domain groups

Users SHALL be able to customize the display name of any domain group in Browse Mode.

### Scenario: Rename via edit button
- **GIVEN** the user is in Browse Mode
- **WHEN** they hover over a domain group header and click the edit icon
- **THEN** an inline text input appears with the current name
- **AND** they can type a new name

### Scenario: Save custom name
- **GIVEN** the user is editing a domain group name
- **WHEN** they press Enter or click outside the input
- **THEN** the custom name is saved and immediately displayed
- **AND** the name persists across browser sessions

### Scenario: Cancel editing
- **GIVEN** the user is editing a domain group name
- **WHEN** they press Escape
- **THEN** the edit is cancelled and original name is restored

### Scenario: Reset to default
- **GIVEN** a domain group has a custom name
- **WHEN** the user clears the input and saves
- **THEN** the domain group reverts to its default name (FRIENDLY_DOMAINS or hostname)

## Requirement: Custom names override defaults

Custom domain names SHALL take priority over built-in FRIENDLY_DOMAINS mapping.

### Scenario: Custom name priority
- **GIVEN** "github.com" has built-in name "GitHub"
- **AND** user has set custom name "My Projects"
- **WHEN** Browse Mode displays github.com group
- **THEN** it shows "My Projects", not "GitHub"

## Requirement: Custom names persist

Custom domain names SHALL be stored in Chrome local storage and persist across sessions.

### Scenario: Persistence
- **GIVEN** the user has set custom name "Work" for "internal.corp"
- **WHEN** they close and reopen the browser
- **THEN** "internal.corp" still displays as "Work"
