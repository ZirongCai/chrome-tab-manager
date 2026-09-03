## Context

Tab Out is a Chrome extension for tab management with Arc-style overlay UI. The current architecture:

**Files:**
- `manifest.json` - Extension configuration (Manifest V3)
- `background.js` - Service worker for badge updates, shortcuts, user pins
- `core.js` - Shared logic (TabManager, BookmarkManager, helpers)
- `overlay.js` - Main UI controller (~1650 lines, largest file)
- `overlay.html` - UI template with inline CSS (~1470 lines)
- `search.js` - Fuse.js-powered search across tabs/bookmarks/history
- `constants.js` - Centralized configuration values
- `domain-names.js` - Friendly domain name mappings

**Current State Issues:**
1. **Security**: innerHTML used with escapeHtml helper, but not consistently applied everywhere
2. **Architecture**: overlay.js has mixed concerns (UI, state, API calls, event handling)
3. **State**: Global variables (`browseData`, `expandedDomains`, `selectedIndex`) make testing difficult
4. **Error Handling**: Inconsistent - some try/catch, some silent failures
5. **Extensibility**: COMMANDS array exists but empty; no plugin architecture

## Goals / Non-Goals

**Goals:**
- Identify and fix XSS vulnerabilities in HTML rendering
- Add Content Security Policy to manifest.json
- Validate all user inputs before storage
- Establish consistent error handling patterns
- Document architectural improvements for future refactoring
- Make codebase more testable through better separation

**Non-Goals:**
- Complete rewrite of the extension
- Adding TypeScript (would be a separate initiative)
- Changing the visual design or user experience
- Adding new features beyond security/quality improvements

## Decisions

### Decision 1: XSS Prevention Strategy

**Choice**: Audit and fix all innerHTML assignments; ensure escapeHtml is used consistently.

**Rationale**: The extension already has `DOMHelpers.escapeHtml()` but it's not used everywhere. Specifically:
- `overlay.js:renderResults()` uses escapeHtml properly for user data
- `background.js:showPinFeedback()` injects script with template literal - safe (data is from Chrome APIs)
- `overlay.html` has no dynamic content injection risk

**Alternatives considered**:
- Using a templating library (Lit, etc.) - Adds dependency, overkill for current scope
- textContent everywhere - Would require refactoring highlight markup

### Decision 2: Content Security Policy

**Choice**: Add restrictive CSP to manifest.json:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

**Rationale**: Prevents inline script injection while allowing module imports from extension files.

**Alternatives considered**:
- No CSP - Less secure, not recommended for extensions handling user data
- Stricter CSP with nonces - Overkill for this use case, complicates development

### Decision 3: Input Validation Pattern

**Choice**: Add validation functions in search.js for:
- URL validation before storage
- Custom name length limits (max 200 chars)
- Sanitization of keywords

**Rationale**: User pins are stored with URLs, titles, and custom names. Malformed data could cause issues.

**Location**: search.js already handles pin CRUD operations.

### Decision 4: Error Handling Pattern

**Choice**: Standardize on this pattern:
```javascript
async function operation() {
  try {
    // operation
  } catch (error) {
    console.error('[Module] Operation failed:', error);
    // Return safe default OR throw with context
  }
}
```

**Rationale**: Consistent logging with module prefix aids debugging. Silent failures are acceptable for non-critical operations (e.g., badge updates) but not for user-initiated actions.

### Decision 5: State Management (Documentation Only)

**Choice**: Document overlay.js state for future refactoring, but don't refactor now.

**Rationale**: Full refactoring is risky and out of scope. Current state:
- `searchInstance` - Search index
- `selectedIndex`, `browseSelectedIndex` - UI selection state
- `commandMode`, `activeCommand` - Command mode state
- `currentMode`, `browseData` - Mode switching state
- `expandedDomains`, `expandedGroups` - UI expand state
- `customDomainNames` - Cached storage data

**Future recommendation**: Extract to a State class with clear mutation methods.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| CSP might break Fuse.js loading | Test thoroughly; Fuse.js is loaded via script tag, should work with 'self' |
| Input validation might reject valid edge cases | Use permissive limits (200 char names, standard URL validation) |
| Error handling changes might hide real bugs | Keep console.error for all caught exceptions |
| Not fixing state management leaves tech debt | Document it clearly; plan for Phase 2 refactor |

## Migration Plan

1. **Phase 1 - Security** (this change)
   - Add CSP to manifest.json
   - Audit innerHTML usage
   - Add input validation
   - Add consistent error handling

2. **Phase 2 - Architecture** (future)
   - Extract state management
   - Add abstraction layer for Chrome APIs
   - Enable unit testing

**Rollback**: Revert manifest.json and validation changes if issues found.

## Open Questions

1. Should we add automated security scanning (e.g., ESLint security plugin)?
2. Is there a need for user-facing error messages, or are console logs sufficient?
3. Should the extension support import/export of user pins for backup?
