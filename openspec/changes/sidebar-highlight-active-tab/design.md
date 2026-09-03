## Context

The sidebar displays tabs organized by domain folders (ungrouped) and tab groups. Currently, all tab chips look identical, making it difficult to identify which tab is currently active in the browser. Users often open the sidebar to pin or manage the current tab, but must search through the list to find it.

The sidebar already tracks tab state via `chrome.tabs` listeners and re-renders on tab changes.

## Goals / Non-Goals

**Goals:**
- Visually distinguish the active tab with a highlight style
- Auto-expand the containing domain folder if collapsed
- Scroll the active tab into view on sidebar open
- Update highlighting when active tab changes

**Non-Goals:**
- Highlighting multiple selected tabs (only the single active tab)
- Custom highlight color configuration
- Animation effects on tab switch

## Decisions

### 1. Highlight Style
**Decision**: Use a left border accent (matching existing selected item patterns) plus a subtle background tint.

**Rationale**: Consistent with the existing `.selected` pattern used for keyboard navigation. Distinct enough to spot quickly without being garish.

### 2. Active Tab Tracking
**Decision**: Query active tab on sidebar load and listen to `chrome.tabs.onActivated` to update.

**Rationale**: `onActivated` fires when the active tab changes in a window, which is exactly what we need. We already have tab listeners set up.

### 3. Auto-expand and Scroll
**Decision**: After rendering, find the active tab chip, expand its parent folder if collapsed, and scroll it into view.

**Rationale**: Defeats the purpose if the active tab is hidden in a collapsed folder or off-screen.

## Risks / Trade-offs

**[Risk] Performance on many tabs** → Only one tab is active, so updating highlight is O(1). Re-rendering on tab activation is already happening.

**[Trade-off] Auto-expand changes user's collapsed state** → Acceptable for UX; user opened sidebar likely to find current tab. Could add setting later if needed.
