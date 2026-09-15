## Context

Tab Out is a Chrome extension that provides an Arc-style tab manager with fuzzy search across tabs, bookmarks, and history. The extension uses:
- Chrome Commands API for keyboard shortcuts
- Fuse.js for fuzzy search
- A popup overlay with Search Mode and Browse Mode

Currently, the search in Search Mode searches across all sources (tabs, bookmarks, history). Browse Mode shows all tabs organized by groups and domains but has no filtering capability.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated command to search only open tabs (faster, more focused)
- Enable real-time filtering in Browse Mode to find specific tabs quickly
- Reuse existing Fuse.js infrastructure to minimize code duplication

**Non-Goals:**
- Changing the existing unified search behavior
- Adding search to other parts of the UI (e.g., group management dialogs)
- Supporting complex query syntax in Browse Mode filter (keep it simple)

## Decisions

### Decision 1: New Chrome command for tab-only search
**Choice**: Add a new command `search-open-tabs` with shortcut Cmd+Shift+T (or similar available binding)

**Rationale**: 
- Separating tab-only search from unified search provides a faster path for users who only want to find open tabs
- Mirrors Arc's behavior where you can search just tabs vs everything

**Alternatives considered**:
- Modifier key in existing search (e.g., prefix `tab:`): More discoverable but adds complexity to the query parser
- Settings toggle: Too slow to access; users want instant access

**Implementation**: 
- Open overlay with a flag indicating tabs-only mode
- Pass `searchTabsOnly=true` via URL params to the overlay
- In overlay.js, initialize with tabs-only filter active

### Decision 2: Browse Mode filter placement
**Choice**: Add a filter input at the top of the Browse Mode view, inline with the existing header/stats area

**Rationale**:
- Consistent with common UI patterns (filter at top)
- Always visible without scrolling
- Natural eye flow from header → filter → content

**Alternatives considered**:
- Floating search bar: More intrusive, doesn't fit the existing design
- Filter in sidebar: No sidebar in current design

### Decision 3: Reuse Fuse.js for Browse Mode filtering
**Choice**: Use the existing `UnifiedSearch` class or create a lightweight wrapper that filters only the current `browseData.tabs`

**Rationale**:
- Consistent search behavior (fuzzy matching, typo tolerance)
- No new dependencies
- Users get the same search quality they're used to

**Implementation**:
- Create Fuse instance with just the tabs array
- Filter results update `renderBrowseMode()` display in real-time
- Clear filter on mode switch or Escape key

## Risks / Trade-offs

**[Risk] Keyboard shortcut conflict** → Check Chrome's default shortcuts; use a less common combination. Document in manifest description.

**[Risk] Browse Mode filter performance with many tabs** → Fuse.js is efficient; debounce input by 100-150ms if needed.

**[Trade-off] Separate command vs unified search** → Adds one more shortcut to learn, but provides faster access for the common case.
