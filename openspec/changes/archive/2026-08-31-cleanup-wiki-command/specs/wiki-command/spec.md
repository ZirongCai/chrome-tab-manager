## REMOVED Requirements

### Requirement: Wiki command entry point
The system SHALL NOT display any wiki command related UI or messaging.

**Reason**: Wiki command functionality was previously removed, but residual code remains
**Migration**: Users should access wiki directly via browser

#### Scenario: User types /wiki
- **WHEN** user types `/wiki` in the search overlay
- **THEN** system shows no special handling (behaves like any unrecognized command prefix)

### Requirement: Wiki configuration UI
The system SHALL NOT display Confluence token configuration in the settings page.

**Reason**: Configuration is no longer needed as wiki command is removed
**Migration**: N/A - no user action required

#### Scenario: User opens configuration page
- **WHEN** user opens the configuration page
- **THEN** system shows only HAI Proxy configuration (no Confluence section)

### Requirement: Wiki CSS styles
The system SHALL NOT include wiki-related CSS styles in the codebase.

**Reason**: Styles are unused after wiki command removal
**Migration**: N/A - no user impact

#### Scenario: Overlay renders without wiki styles
- **WHEN** overlay is displayed
- **THEN** no wiki-related CSS classes exist in the stylesheet
