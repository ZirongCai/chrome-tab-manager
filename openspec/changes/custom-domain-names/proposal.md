## Problem

Currently, domain grouping names in Tab Manager are hardcoded in `FRIENDLY_DOMAINS` and `URL_PATTERN_NAMES`. Users cannot customize how their frequently visited domains appear in Browse Mode. For example:
- `github.com` always shows as "GitHub" 
- Internal company domains show as raw hostnames
- Users cannot rename groups to match their mental model (e.g., "Work Projects" instead of "github.tools.example.com")

## Proposed Solution

Add a **Custom Domain Names** feature that allows users to:
1. **Edit domain names directly in Browse Mode** - Right-click or click an edit icon on a domain group header to rename it
2. **Persist custom names** - Store in Chrome storage, surviving browser restarts
3. **Override defaults** - User custom names take priority over built-in `FRIENDLY_DOMAINS`

### User Experience

1. In Browse Mode, hover over a domain group header
2. Click the ✏️ edit icon (or right-click → "Rename Group")
3. Enter custom name in a small inline editor
4. Press Enter to save, Escape to cancel
5. The custom name appears immediately and persists

### Storage

- Use `chrome.storage.local` for persistence
- Store as key-value: `{ customDomainNames: { "github.com": "My Projects", "internal.corp": "Work Tools" } }`
- No external file needed - Chrome storage is simpler and more reliable

## Impact

- **Low risk** - Additive feature, doesn't change core search/tab functionality
- **Improves UX** - Users can organize tabs in a way that makes sense to them
- **Simple implementation** - Uses existing Chrome storage API, minimal code changes

## Out of Scope

- Syncing custom names across devices (could be future enhancement with `chrome.storage.sync`)
- Pattern-based renaming (e.g., "*.google.com" → "Google Services")
- Import/export custom names to file
