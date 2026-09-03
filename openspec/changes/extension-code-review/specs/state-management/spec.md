## ADDED Requirements

### Requirement: Documented state inventory
All global state variables in overlay.js SHALL be documented with their purpose, type, and mutation points.

#### Scenario: State documentation exists
- **WHEN** a developer reads overlay.js
- **THEN** a comment block at the top lists all state variables with descriptions

#### Scenario: State variable has clear type
- **WHEN** examining state documentation
- **THEN** each variable's expected type (string, number, object, etc.) is specified

### Requirement: State initialization is centralized
All state variables SHALL be initialized in a single location at module load time.

#### Scenario: State variables initialized at top of module
- **WHEN** overlay.js loads
- **THEN** all state variables are declared and initialized before any function definitions

#### Scenario: No inline state initialization
- **WHEN** searching for variable declarations in functions
- **THEN** no new global state is created inside function bodies

### Requirement: State mutations are traceable
State mutations SHALL occur through clearly named functions or documented inline with comments.

#### Scenario: selectedIndex mutation is clear
- **WHEN** selectedIndex is modified
- **THEN** the modification occurs in updateSelection or with a clear comment explaining why

#### Scenario: browseData mutation is clear
- **WHEN** browseData is assigned
- **THEN** it happens in loadBrowseData or with a comment explaining the source

### Requirement: Mode state is consistent
Mode switching between 'search' and 'browse' SHALL maintain consistent UI state.

#### Scenario: Mode switch preserves search input
- **WHEN** user switches from search to browse and back
- **THEN** the search input retains its previous value

#### Scenario: Mode switch resets selection
- **WHEN** user switches modes
- **THEN** selectedIndex and browseSelectedIndex are reset appropriately

#### Scenario: Mode indicators match actual mode
- **WHEN** currentMode is 'browse'
- **THEN** document.body has 'browse-mode' class and browse tab is active

### Requirement: Expand/collapse state persists within session
Domain and group expand/collapse states SHALL persist during the overlay session.

#### Scenario: Domain expand state persists
- **WHEN** user expands a domain group, switches to search, then back to browse
- **THEN** the domain group remains expanded

#### Scenario: Tab group expand state persists
- **WHEN** user collapses a tab group and scrolls away
- **THEN** the tab group remains collapsed when scrolled back into view

### Requirement: Search instance lifecycle is managed
The UnifiedSearch instance SHALL be properly initialized before use and updated when underlying data changes.

#### Scenario: Search ready before user types
- **WHEN** overlay.html loads
- **THEN** searchInstance is initialized with tabs and bookmarks before search input is enabled

#### Scenario: User pins reflect current state
- **WHEN** user pins/unpins a URL
- **THEN** searchInstance.reloadUserPins() is called to update the search index
