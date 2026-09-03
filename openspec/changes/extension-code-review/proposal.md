## Why

This Chrome extension ("Tab Out") manages browser tabs with Arc-style overlay UI, search, bookmarks integration, and tab grouping. A comprehensive code review is needed to identify security vulnerabilities, architectural issues, and extensibility limitations before further development. The extension handles sensitive browser APIs (tabs, history, bookmarks, scripting) and user data (pins, preferences), making security and code quality critical.

## What Changes

### Security Improvements
- **XSS Prevention**: Audit all `innerHTML` assignments and ensure proper HTML escaping throughout
- **Content Security Policy**: Add CSP headers to manifest.json to prevent script injection
- **Input Validation**: Add validation for user inputs (custom names, URLs) before storage
- **Storage Security**: Review chrome.storage.local usage for sensitive data handling
- **Script Injection Safety**: Audit `chrome.scripting.executeScript` usage in background.js

### Architecture Improvements
- **Error Handling**: Add consistent error handling patterns across all async operations
- **State Management**: Refactor global state in overlay.js into a proper state management pattern
- **Module Boundaries**: Clarify separation between core.js (shared logic) and overlay.js (UI)
- **Event Cleanup**: Add proper event listener cleanup to prevent memory leaks

### Extensibility Improvements
- **Plugin Architecture**: Design command system (`COMMANDS` array) for future extensibility
- **Configuration Management**: Consolidate all settings into constants.js
- **API Abstraction**: Create abstraction layer for Chrome APIs to enable testing

## Capabilities

### New Capabilities
- `security-hardening`: XSS prevention, CSP implementation, input validation, secure storage patterns
- `error-handling`: Consistent error handling, user feedback, graceful degradation
- `state-management`: Centralized state management pattern for overlay.js

### Modified Capabilities
<!-- No existing specs to modify - this is a greenfield analysis -->

## Impact

**Files affected:**
- `manifest.json` - CSP headers, permissions audit
- `background.js` - Script injection security, error handling
- `overlay.js` - XSS prevention, state management refactor, event cleanup
- `overlay.html` - Inline style extraction, CSP compliance
- `search.js` - Input validation, error handling
- `core.js` - Error handling patterns, API abstraction

**Dependencies:**
- Fuse.js (lib/fuse.min.js) - Review for updates/vulnerabilities

**Browser APIs:**
- `chrome.tabs`, `chrome.tabGroups`, `chrome.storage`, `chrome.history`, `chrome.bookmarks`, `chrome.scripting` - All need security review
