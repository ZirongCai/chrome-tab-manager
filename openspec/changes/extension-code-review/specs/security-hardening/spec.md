## ADDED Requirements

### Requirement: Content Security Policy
The extension manifest SHALL include a Content Security Policy that restricts script execution to extension-owned scripts only.

#### Scenario: CSP blocks inline scripts
- **WHEN** an attacker attempts to inject inline JavaScript via XSS
- **THEN** the browser blocks execution due to CSP violation

#### Scenario: Extension scripts load normally
- **WHEN** the extension loads overlay.html
- **THEN** all module scripts (overlay.js, core.js, search.js) load and execute correctly

#### Scenario: Fuse.js library loads correctly
- **WHEN** overlay.html loads lib/fuse.min.js via script tag
- **THEN** Fuse.js is available globally and search functionality works

### Requirement: HTML escaping for user content
All user-provided content (titles, URLs, custom names) SHALL be escaped before insertion into HTML.

#### Scenario: Malicious title is escaped
- **WHEN** a tab has title `<script>alert('xss')</script>`
- **THEN** the title is displayed as literal text, not executed as script

#### Scenario: Custom pin name with HTML characters
- **WHEN** user creates a pin with custom name `<b>Important</b>`
- **THEN** the name displays as literal text including the angle brackets

#### Scenario: URL with special characters displays correctly
- **WHEN** a bookmark URL contains `&`, `<`, or `>` characters
- **THEN** the URL displays correctly without breaking HTML structure

### Requirement: Input validation for user pins
User-provided data for pins SHALL be validated before storage.

#### Scenario: URL validation on pin creation
- **WHEN** user attempts to pin a page with an invalid URL format
- **THEN** the system rejects the pin and logs an error

#### Scenario: Custom name length limit
- **WHEN** user enters a custom name longer than 200 characters
- **THEN** the system truncates to 200 characters before storage

#### Scenario: Empty URL rejected
- **WHEN** addUserPin is called with empty or null URL
- **THEN** the function returns false and does not modify storage

### Requirement: Secure script injection
When injecting scripts into pages via chrome.scripting.executeScript, the extension SHALL only pass serializable primitive data as arguments.

#### Scenario: Toast notification injection
- **WHEN** background.js shows a toast notification on the current page
- **THEN** only string/number arguments are passed to the injected function

#### Scenario: Injection on restricted pages fails gracefully
- **WHEN** script injection is attempted on chrome:// or other restricted pages
- **THEN** the operation fails silently without throwing unhandled errors

### Requirement: Storage data integrity
Data retrieved from chrome.storage.local SHALL be validated before use.

#### Scenario: Corrupted pins array
- **WHEN** loadUserPins retrieves malformed data (not an array)
- **THEN** the system returns an empty array and logs a warning

#### Scenario: Pin missing required fields
- **WHEN** a stored pin object lacks url field
- **THEN** the pin is filtered out during load and not displayed
